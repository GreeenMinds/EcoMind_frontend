import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-community-search-bar',
  imports: [],
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
