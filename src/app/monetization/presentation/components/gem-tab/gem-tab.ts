import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonetizationStoreService } from '../../../application/monetization-store.service';
import { GemPackageEntity } from '../../../domain/gem-package.entity';
import { PayModalComponent } from '../pay-modals/pay-modals';

@Component({
  selector: 'app-gems-tab',
  standalone: true,
  imports: [CommonModule, PayModalComponent],
  templateUrl: './gem-tab.html',
  styleUrls: ['./gem-tab.css'],
})
export class GemsTabComponent {

  readonly svc = inject(MonetizationStoreService);

  readonly packages = this.svc.gemPackages;
  readonly loading  = this.svc.loading;
  readonly error    = this.svc.error;

  // ─── Estado del modal ─────────────────────────────────────────────────────
  showModal        = false;
  selectedPackage: GemPackageEntity | null = null;

  // Gran paquete hardcoded (oferta especial)
  readonly granPaquete: GemPackageEntity = Object.assign(
    new GemPackageEntity(),
    { id: 5, name: 'Gran paquete', gemAmount: 10000, realPrice: 149.99, currency: 'PEN' },
  );

  // ─── Abrir modal ──────────────────────────────────────────────────────────
  openModal(pkg: GemPackageEntity): void {
    this.selectedPackage = pkg;
    this.showModal = true;
  }

  // ─── Pago confirmado (éxito) ──────────────────────────────────────────────
  onPaymentDone(pkg: GemPackageEntity): void {
    this.svc.purchaseGemPackage(pkg);
  }

  // ─── Modal cerrado ────────────────────────────────────────────────────────
  onModalClosed(): void {
    this.showModal = false;
    this.selectedPackage = null;
  }
  filteredPackages() {
    return this.packages().filter(pkg => pkg.gemAmount !== 10000);
  }
  getGemImage(amount: number): string {
    const path = '/assets/images/gem/';

    if (amount <= 500) return path + 'gem_pack_0.png';
    if (amount <= 1000) return path + 'gem_pack_1.png';
    if (amount <= 2000) return path + 'gem_pack_2.png';

    // Para 5000 o cualquier monto mayor, usamos la imagen del saco grande
    return path + 'gem_pack_3.png';
  }
}
