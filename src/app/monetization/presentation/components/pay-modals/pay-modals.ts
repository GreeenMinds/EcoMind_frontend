import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GemPackageEntity } from '../../../domain/gem-package.entity';
export type PayStep = 'method' | 'yape' | 'paypal' | 'card' | 'processing' | 'success' | 'error';

@Component({
  selector: 'app-pay-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pay-modals.html',
  styleUrls: ['./pay-modals.css'],
})
export class PayModalComponent implements OnChanges {

  @Input() gemPackage: GemPackageEntity | null = null;
  @Input() visible = false;
  @Output() closed        = new EventEmitter<void>();
  @Output() paymentDone   = new EventEmitter<GemPackageEntity>();
  @Output() paymentFailed = new EventEmitter<void>();

  step: PayStep = 'method';

  // Campos de formulario
  cardNumber = '';
  cardName   = '';
  cardExpiry = '';
  cardCvv    = '';
  paypalEmail = '';

  ngOnChanges(): void {
    if (this.visible) {
      this.step = 'method';
      this.clearInputs();
    }
  }

  close(): void {
    this.closed.emit();
  }

  selectMethod(method: 'yape' | 'paypal' | 'card'): void {
    this.step = method;
  }

  confirmPayment(): void {
    // Validaciones según método
    if (this.step === 'card') {
      if (!this.isValidCard(this.cardNumber)) {
        return;
      }
      if (!this.isValidExpiry(this.cardExpiry)) {
        return;
      }
      if (!this.isValidCvv(this.cardCvv)) {
        return;
      }
    }
    if (this.step === 'paypal' && !this.isValidEmail(this.paypalEmail)) {
      return;
    }

    this.step = 'processing';

    // Simula procesamiento de pago (1.5 s)
    setTimeout(() => {
      if (this.gemPackage) {
        this.step = 'success';
        this.paymentDone.emit(this.gemPackage);
      } else {
        this.step = 'error';
        this.paymentFailed.emit();
      }
    }, 1500);
  }

  // ─── Validadores ─────────────────────────────────────────────────────────

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

  get cardFormValid(): boolean {
    return (
      this.isValidCard(this.cardNumber) &&
      this.cardName.trim().length > 0 &&
      this.isValidExpiry(this.cardExpiry) &&
      this.isValidCvv(this.cardCvv)
    );
  }

  get paypalFormValid(): boolean {
    return this.isValidEmail(this.paypalEmail);
  }

  private clearInputs(): void {
    this.cardNumber  = '';
    this.cardName    = '';
    this.cardExpiry  = '';
    this.cardCvv     = '';
    this.paypalEmail = '';
  }
}
