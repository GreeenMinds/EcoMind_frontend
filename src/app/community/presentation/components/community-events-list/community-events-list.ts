import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CommunityEventSummary } from '../../../application/community.service';
import { CommunityEventCard } from '../community-event-card/community-event-card';
import { CommunityEventsMap } from '../community-events-map/community-events-map';

@Component({
  selector: 'app-community-events-list',
  imports: [CommunityEventCard, CommunityEventsMap, TranslatePipe],
  templateUrl: './community-events-list.html',
  styleUrl: './community-events-list.css',
})
export class CommunityEventsList {
  @Input() events: CommunityEventSummary[] = [];
  @Output() createEvent = new EventEmitter<void>();
  @Output() joinEvent = new EventEmitter<CommunityEventSummary>();
  @Output() cancelRegistration = new EventEmitter<CommunityEventSummary>();
  @Output() deleteEvent = new EventEmitter<CommunityEventSummary>();
}
