import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-community-search-bar',
  imports: [TranslatePipe],
  templateUrl: './community-search-bar.html',
  styleUrl: './community-search-bar.css',
})
export class CommunitySearchBar {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  onInput(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }
}
