import { Component, computed, inject } from '@angular/core';
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

  showModal        = false;
  selectedPackage: GemPackageEntity | null = null;

  constructor() {
    this.svc.refreshGemPackages();
  }

  readonly granPaquete = computed(() =>
    this.packages().find((pkg) => pkg.gemAmount === 10000) ?? null,
  );

  openModal(pkg: GemPackageEntity | null): void {
    if (!pkg) return;
    this.selectedPackage = pkg;
    this.showModal = true;
  }

  onPaymentDone(pkg: GemPackageEntity): void {
    this.svc.finalizeGemPackagePurchase(pkg);
  }

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

    return path + 'gem_pack_3.png';
  }
}
