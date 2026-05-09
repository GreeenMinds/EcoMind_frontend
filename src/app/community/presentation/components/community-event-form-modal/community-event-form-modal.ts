import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface EventFormValue {
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  latitude: number;
  longitude: number;
  capacity: number;
  image_url: string | null;
}

@Component({
  selector: 'app-community-event-form-modal',
  imports: [FormsModule],
  templateUrl: './community-event-form-modal.html',
  styleUrl: './community-event-form-modal.css',
})
export class CommunityEventFormModal {
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<EventFormValue>();

  name = '';
  date = '';
  startTime = '';
  endTime = '';
  location = '';
  description = '';
  capacity = 30;
  latitude = -12.0464;
  longitude = -77.0428;
  imageUrl = '';

  submit(): void {
    if (!this.name || !this.date || !this.startTime || !this.location || !this.description) {
      return;
    }

    this.create.emit({
      name: this.name,
      description: this.description,
      date: this.date,
      start_time: `${this.date}T${this.startTime}:00`,
      end_time: `${this.date}T${this.endTime || this.startTime}:00`,
      location: this.location,
      latitude: this.latitude,
      longitude: this.longitude,
      capacity: this.capacity,
      image_url: this.imageUrl.trim() || null,
    });
  }
}
