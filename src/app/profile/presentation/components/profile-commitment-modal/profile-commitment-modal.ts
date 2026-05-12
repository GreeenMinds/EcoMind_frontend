import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-profile-commitment-modal',
  imports: [TranslatePipe],
  templateUrl: './profile-commitment-modal.html',
  styleUrl: './profile-commitment-modal.css',
})
export class ProfileCommitmentModal {
  @Input() title = 'Mi Compromiso';
  @Input() placeholder = 'Escribe aqui el compromiso sostenible que quieres mostrar en tu perfil';
  @Input() commitmentDraft = '';
  @Input() saving = false;

  @Output() draftChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<void>();
  @Output() clear = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();
}
