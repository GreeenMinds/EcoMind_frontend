import { Component, Input } from '@angular/core';
import { CommunityEventSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-events-map',
  imports: [],
  templateUrl: './community-events-map.html',
  styleUrl: './community-events-map.css',
})
export class CommunityEventsMap {
  @Input() events: CommunityEventSummary[] = [];
}
