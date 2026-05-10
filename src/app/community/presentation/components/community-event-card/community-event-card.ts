import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommunityEventSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-event-card',
  imports: [],
  templateUrl: './community-event-card.html',
  styleUrl: './community-event-card.css',
})
export class CommunityEventCard {
  @Input() summary!: CommunityEventSummary;
  @Output() join = new EventEmitter<CommunityEventSummary>();
  @Output() cancel = new EventEmitter<CommunityEventSummary>();
}
