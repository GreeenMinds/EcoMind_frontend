import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type CommunityTab = 'all' | 'achievements' | 'events';

@Component({
  selector: 'app-community-tabs',
  imports: [TranslatePipe],
  templateUrl: './community-tabs.html',
  styleUrl: './community-tabs.css',
})
export class CommunityTabs {
  @Input() activeTab: CommunityTab = 'all';
  @Output() tabChange = new EventEmitter<CommunityTab>();
}
