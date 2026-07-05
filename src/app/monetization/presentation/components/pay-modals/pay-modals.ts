import { Component, EventEmitter, Input, NgZone, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GemPackageEntity } from '../../../domain/gem-package.entity';
import { MonetizationApi } from '../../../infrastructure/monetization-api';
import { CurrentUser } from '../../../../shared/application/current-user';
import { environment } from '../../../../../environments/environment';

export type PayStep = 'method' | 'paypal' | 'processing' | 'success' | 'error';

declare const paypal: any;
declare const Culqi: any;

@Component({
  selector: 'app-pay-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pay-modals.html',
  styleUrls: ['./pay-modals.css'],
})
export class PayModalComponent implements OnChanges {

  private readonly monetizationApi = inject(MonetizationApi);
  private readonly currentUser     = inject(CurrentUser);
  private readonly ngZone          = inject(NgZone);

  @Input() gemPackage: GemPackageEntity | null = null;
  @Input() visible = false;
  @Output() closed        = new EventEmitter<void>();
  @Output() paymentDone   = new EventEmitter<GemPackageEntity>();
  @Output() paymentFailed = new EventEmitter<void>();

  step: PayStep = 'method';
  errorMessage = '';

  private static paypalSdkPromise: Promise<void> | null = null;
  private static culqiSdkPromise: Promise<void> | null = null;
  private static readonly PEN_TO_USD_RATE = 0.27;
  private paypalButtonsRendered = false;

  ngOnChanges(): void {
    if (this.visible) {
      this.step = 'method';
      this.paypalButtonsRendered = false;
      this.errorMessage = '';
    }
  }

  close(): void {
    this.closed.emit();
  }

  selectMethod(method: 'paypal' | 'culqi'): void {
    this.errorMessage = '';
    if (method === 'paypal') {
      this.step = 'paypal';
      this.paypalButtonsRendered = false;
      setTimeout(() => this.renderPaypalButton(), 0);
      return;
    }
    this.openCulqiCheckout();
  }

  private openCulqiCheckout(): void {
    if (!this.gemPackage) return;

    this.loadCulqiSdk()
      .then(() => {
        Culqi.publicKey = environment.platformProviderCulqiPublicKey;
        Culqi.settings({
          title: 'EcoMind',
          currency: this.gemPackage!.currency,
          amount: Math.round(this.gemPackage!.realPrice * 100),
        });
        Culqi.options({
          lang: 'es',
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: true,
            bancaMovil: false,
            agente: false,
            billetera: false,
            cuotealo: false,
          },
        });
        (window as any).culqi = () => this.handleCulqiResult();
        Culqi.open();
      })
      .catch((err) => this.handleError(err));
  }

  private handleCulqiResult(): void {
    this.ngZone.run(() => {
      if (Culqi.token) {
        const token = Culqi.token.id as string;
        const method: 'card' | 'yape' = token.startsWith('ype_') ? 'yape' : 'card';
        const email = Culqi.token.email as string;
        this.step = 'processing';
        this.checkoutAndPay(method, token, email);
        return;
      }
      if (Culqi.error) {
        this.handleError(new Error(Culqi.error.user_message || Culqi.error.merchant_message || 'Culqi error'));
      }
    });
  }

  private loadCulqiSdk(): Promise<void> {
    if ((window as any).Culqi) {
      return Promise.resolve();
    }
    if (!PayModalComponent.culqiSdkPromise) {
      PayModalComponent.culqiSdkPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.culqi.com/js/v4';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load the Culqi SDK'));
        document.body.appendChild(script);
      });
    }
    return PayModalComponent.culqiSdkPromise;
  }

  private loadPaypalSdk(): Promise<void> {
    if ((window as any).paypal) {
      return Promise.resolve();
    }
    if (!PayModalComponent.paypalSdkPromise) {
      PayModalComponent.paypalSdkPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${environment.platformProviderPaypalClientId}&currency=USD&disable-funding=card`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not load the PayPal SDK'));
        document.body.appendChild(script);
      });
    }
    return PayModalComponent.paypalSdkPromise;
  }

  private renderPaypalButton(): void {
    if (this.paypalButtonsRendered || !this.gemPackage) return;
    const container = document.getElementById('paypal-button-container');
    if (!container) return;

    this.loadPaypalSdk()
      .then(() => {
        this.paypalButtonsRendered = true;
        paypal
          .Buttons({
            createOrder: (_data: unknown, actions: any) =>
              actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      currency_code: 'USD',
                      value: (this.gemPackage!.realPrice * PayModalComponent.PEN_TO_USD_RATE).toFixed(2),
                    },
                  },
                ],
              }),
            onApprove: (data: { orderID: string }) => {
              this.step = 'processing';
              this.checkoutAndPay('paypal', data.orderID, 'buyer@ecomind.com');
            },
            onError: (err: unknown) => this.handleError(err),
          })
          .render('#paypal-button-container');
      })
      .catch((err) => this.handleError(err));
  }

  private checkoutAndPay(method: 'card' | 'yape' | 'paypal', sourceToken: string, email: string): void {
    if (!this.gemPackage) return;
    this.monetizationApi
      .checkoutGemPurchase(this.currentUser.getCurrentUserId(), this.gemPackage.id, method)
      .subscribe({
        next: (purchase) => this.payWithToken(purchase.id, sourceToken, email),
        error: (err) => this.handleError(err),
      });
  }

  private payWithToken(purchaseId: number, sourceToken: string, email: string): void {
    this.monetizationApi.payGemPurchase(purchaseId, sourceToken, email).subscribe({
      next: () => this.onPaid(),
      error: (err) => this.handleError(err),
    });
  }

  private onPaid(): void {
    if (this.gemPackage) {
      this.paymentDone.emit(this.gemPackage);
    }
    this.step = 'success';
  }

  private handleError(err: unknown): void {
    this.errorMessage = err instanceof Error ? err.message : 'Payment processing error';
    this.step = 'error';
    this.paymentFailed.emit();
  }
}
