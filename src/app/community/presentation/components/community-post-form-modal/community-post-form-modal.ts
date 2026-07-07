import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { CommunityPostFormValue } from '../../../application/community.service';

@Component({
  selector: 'app-community-post-form-modal',
  imports: [FormsModule, TranslatePipe],
  templateUrl: './community-post-form-modal.html',
  styleUrl: './community-post-form-modal.css',
})
export class CommunityPostFormModal {
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<CommunityPostFormValue>();

  content = '';
  imageUrl = '';

  submit(): void {
    const content = this.content.trim();

    if (!content) {
      return;
    }

    this.create.emit({
      content,
      points: 0,
      image_url: this.imageUrl.trim() || null,
    });
  }
}
