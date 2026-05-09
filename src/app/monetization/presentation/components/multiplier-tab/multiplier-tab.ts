import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  MultiplierSummary,
  MonetizationStoreService,
} from '../../../application/monetization-store.service';

@Component({
  selector: 'app-multipliers-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './multiplier-tab.html',
  styleUrls: ['./multiplier-tab.css'],
})
export class MultipliersTabComponent {

  readonly svc = inject(MonetizationStoreService);

  readonly summaries = this.svc.multiplierSummaries;
  readonly loading   = this.svc.loading;
  readonly error     = this.svc.error;

  buy(summary: MultiplierSummary): void {
    this.svc.purchaseMultiplier(summary.multiplier);
  }

  /* ── Estilos por índice ── */
  cardBg(index: number): string {
    return ['#ffffff', '#f0faf0', '#2e7d32'][index] ?? '#ffffff';
  }

  titleColor(index: number): string {
    return index === 2 ? 'white' : '#1a1a1a';
  }

  descColor(index: number): string {
    return index === 2 ? 'rgba(255,255,255,0.88)' : '#555';
  }

  priceColor(index: number): string {
    return index === 2 ? 'white' : '#29b6e8';
  }

  /** Imagen principal del planeta según la card */
  planetImg(index: number): string {
    const imgs = ['world_happy', 'world_run', 'world_trophy'];
    return `assets/images/multiplier/${imgs[index] ?? 'world_happy'}.png`;
  }

  /** La primera card incluye también el cohete como imagen secundaria */
  showRocket(index: number): boolean {
    return index === 0;
  }
}
