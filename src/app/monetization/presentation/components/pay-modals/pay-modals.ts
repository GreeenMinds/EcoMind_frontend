import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GemPackageEntity } from '../../../domain/gem-package.entity';
import { MonetizationApi } from '../../../infrastructure/monetization-api';
import { CurrentUser } from '../../../../shared/application/current-user';
import { environment } from '../../../../../environments/environment';

export type PayStep = 'method' | 'yape' | 'paypal' | 'card' | 'processing' | 'success' | 'error';

declare const paypal: any;

@Component({
  selector: 'app-pay-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pay-modals.html',
  styleUrls: ['./pay-modals.css'],
})
export class PayModalComponent implements OnChanges {

  private readonly monetizationApi = inject(MonetizationApi);
  private readonly currentUser     = inject(CurrentUser);

  @Input() gemPackage: GemPackageEntity | null = null;
  @Input() visible = false;
  @Output() closed        = new EventEmitter<void>();
  @Output() paymentDone   = new EventEmitter<GemPackageEntity>();
  @Output() paymentFailed = new EventEmitter<void>();

  step: PayStep = 'method';
  errorMessage = '';

  private purchaseId: number | null = null;

  cardNumber = '';
  cardName   = '';
  cardExpiry = '';
  cardCvv    = '';
  cardEmail  = '';

  yapePhone = '';
  yapeOtp   = '';
  yapeEmail = '';

  private static paypalSdkPromise: Promise<void> | null = null;
  private paypalButtonsRendered = false;

  ngOnChanges(): void {
    if (this.visible) {
      this.step = 'method';
      this.purchaseId = null;
      this.paypalButtonsRendered = false;
      this.errorMessage = '';
      this.clearInputs();
    }
  }

  close(): void {
    this.closed.emit();
  }

  selectMethod(method: 'yape' | 'paypal' | 'card'): void {
    this.step = method;
    this.errorMessage = '';
    this.startCheckout(method);
  }

  private startCheckout(method: 'yape' | 'paypal' | 'card'): void {
    if (!this.gemPackage) return;

    this.monetizationApi
      .checkoutGemPurchase(this.currentUser.getCurrentUserId(), this.gemPackage.id, method)
      .subscribe({
        next: (purchase) => {
          this.purchaseId = purchase.id;
          if (method === 'paypal') {
            this.paypalButtonsRendered = false;
            setTimeout(() => this.renderPaypalButton(), 0);
          }
        },
        error: (err) => this.handleError(err),
      });
  }

  confirmCardPayment(): void {
    if (!this.cardFormValid || !this.purchaseId) {
      return;
    }

    this.step = 'processing';

    this.monetizationApi
      .tokenizeCulqiCard({
        card_number: this.cardNumber.replace(/\s/g, ''),
        cvv: this.cardCvv,
        expiration_month: this.cardExpiry.split('/')[0],
        expiration_year: `20${this.cardExpiry.split('/')[1]}`,
        email: this.cardEmail,
      })
      .subscribe({
        next: (token) => this.payWithToken(token.id, this.cardEmail),
        error: (err) => this.handleError(err),
      });
  }

  confirmYapePayment(): void {
    if (!this.yapeFormValid || !this.purchaseId) {
      return;
    }

    this.step = 'processing';

    this.monetizationApi
      .tokenizeCulqiYape({
        phone_number: this.yapePhone,
        otp: this.yapeOtp,
        email: this.yapeEmail,
      })
      .subscribe({
        next: (token) => this.payWithToken(token.id, this.yapeEmail),
        error: (err) => this.handleError(err),
      });
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
                    amount: { currency_code: 'USD', value: this.gemPackage!.realPrice.toFixed(2) },
                  },
                ],
              }),
            onApprove: (data: { orderID: string }) => {
              this.step = 'processing';
              this.payWithToken(data.orderID, this.cardEmail || 'buyer@ecomind.com');
            },
            onError: (err: unknown) => this.handleError(err),
          })
          .render('#paypal-button-container');
      })
      .catch((err) => this.handleError(err));
  }

  private payWithToken(sourceToken: string, email: string): void {
    if (!this.purchaseId) return;
    this.monetizationApi.payGemPurchase(this.purchaseId, sourceToken, email).subscribe({
      next: () => this.onPaid(),
      error: (err) => this.handleError(err),
    });
  }

  private onPaid(): void {
    this.step = 'success';
    if (this.gemPackage) {
      this.paymentDone.emit(this.gemPackage);
    }
  }

  private handleError(err: unknown): void {
    this.errorMessage = err instanceof Error ? err.message : 'Payment processing error';
    this.step = 'error';
    this.paymentFailed.emit();
  }

  isValidCard(n: string): boolean {
    return /^\d{16}$/.test(n.replace(/\s/g, ''));
  }

  isValidExpiry(e: string): boolean {
    return /^\d{2}\/\d{2}$/.test(e);
  }

  isValidCvv(c: string): boolean {
    return /^\d{3,4}$/.test(c);
  }

  isValidEmail(e: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  isValidPhone(p: string): boolean {
    return /^9\d{8}$/.test(p);
  }

  isValidOtp(o: string): boolean {
    return /^\d{6}$/.test(o);
  }

  get cardFormValid(): boolean {
    return (
      this.isValidCard(this.cardNumber) &&
      this.cardName.trim().length > 0 &&
      this.isValidExpiry(this.cardExpiry) &&
      this.isValidCvv(this.cardCvv) &&
      this.isValidEmail(this.cardEmail)
    );
  }

  get yapeFormValid(): boolean {
    return (
      this.isValidPhone(this.yapePhone) &&
      this.isValidOtp(this.yapeOtp) &&
      this.isValidEmail(this.yapeEmail)
    );
  }

  private clearInputs(): void {
    this.cardNumber = '';
    this.cardName   = '';
    this.cardExpiry = '';
    this.cardCvv    = '';
    this.cardEmail  = '';
    this.yapePhone  = '';
    this.yapeOtp    = '';
    this.yapeEmail  = '';
  }
}
