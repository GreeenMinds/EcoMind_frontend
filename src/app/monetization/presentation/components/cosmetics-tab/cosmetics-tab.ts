import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  CosmeticSummary,
  MonetizationStoreService,
} from '../../../application/monetization-store.service';

type CosmeticView = 'store' | 'inventory';

@Component({
  selector: 'app-cosmetics-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cosmetics-tab.html',
  styleUrls: ['./cosmetics-tab.css'],
})
export class CosmeticsTabComponent {

  readonly svc = inject(MonetizationStoreService);

  view: CosmeticView = 'store';

  readonly summaries    = this.svc.cosmeticSummaries;
  readonly inventory    = this.svc.inventorySummaries;
  readonly ownedCount   = computed(() => this.svc.inventorySummaries().length);
  readonly loading      = this.svc.loading;
  readonly error        = this.svc.error;

  constructor() {
    this.svc.refreshCosmetics();
  }

  buy(summary: CosmeticSummary): void {
    this.svc.purchaseCosmetic(summary.cosmetic);
  }

  toggleEquip(summary: CosmeticSummary): void {
    this.svc.toggleEquip(summary);
  }
}
