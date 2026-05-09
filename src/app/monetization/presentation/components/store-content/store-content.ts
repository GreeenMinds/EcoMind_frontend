import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MonetizationStoreService } from '../../../application/monetization-store.service';
import { CosmeticsTabComponent }   from '../cosmetics-tab/cosmetics-tab';
import { MultipliersTabComponent } from '../multiplier-tab/multiplier-tab';
import { GemsTabComponent }        from '../gem-tab/gem-tab';

type StoreTab = 'cosmetics' | 'multipliers' | 'gems';

@Component({
  selector: 'app-store-content',
  standalone: true,
  imports: [
    CommonModule,
    CosmeticsTabComponent,
    MultipliersTabComponent,
    GemsTabComponent,
  ],
  templateUrl: './store-content.html',
  styleUrls: ['./store-content.css'],
})
export class StoreContentComponent {

  private readonly svc = inject(MonetizationStoreService);

  // Señales del servicio que necesita el header
  readonly gemBalance = this.svc.gemBalance;
  readonly loading    = this.svc.loading;
  readonly error      = this.svc.error;

  // Tab activo
  activeTab: StoreTab = 'cosmetics';

  setTab(tab: StoreTab): void {
    this.activeTab = tab;
  }
}
