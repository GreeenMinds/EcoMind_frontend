import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommunityEventSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-event-registration-modal',
  imports: [],
  templateUrl: './community-event-registration-modal.html',
  styleUrl: './community-event-registration-modal.css',
})
export class CommunityEventRegistrationModal {
  @Input() summary: CommunityEventSummary | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() joinIndividual = new EventEmitter<void>();
  @Output() joinFamily = new EventEmitter<void>();
}
