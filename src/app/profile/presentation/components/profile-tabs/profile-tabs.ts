import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export type ProfileTab = 'summary' | 'family' | 'progress' | 'friends';

@Component({
  selector: 'app-profile-tabs',
  imports: [TranslatePipe],
  templateUrl: './profile-tabs.html',
  styleUrl: './profile-tabs.css',
})
export class ProfileTabs {
  @Input() activeTab: ProfileTab = 'summary';
  @Output() tabChange = new EventEmitter<ProfileTab>();
}
