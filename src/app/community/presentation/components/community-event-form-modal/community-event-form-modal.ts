import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import * as L from 'leaflet';

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
  imports: [FormsModule, TranslatePipe],
  templateUrl: './community-event-form-modal.html',
  styleUrl: './community-event-form-modal.css',
})
export class CommunityEventFormModal implements AfterViewInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() create = new EventEmitter<EventFormValue>();
  @ViewChild('locationMap', { static: true }) private locationMapContainer?: ElementRef<HTMLDivElement>;

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

  private locationMap?: L.Map;
  private locationMarker?: L.Marker;
  private readonly locationMarkerIcon = L.divIcon({
    className: 'event-location-marker',
    html: '<span></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  constructor(
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly ngZone: NgZone,
    private readonly translate: TranslateService,
  ) {}

  ngAfterViewInit(): void {
    this.initializeLocationMap();
  }

  ngOnDestroy(): void {
    this.locationMap?.remove();
  }

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

  syncMarkerWithCoordinates(): void {
    if (!this.hasValidCoordinates()) {
      return;
    }

    this.updateLocationMarker(this.latitude, this.longitude, true);
  }

  private initializeLocationMap(): void {
    if (!this.locationMapContainer || this.locationMap) {
      return;
    }

    const initialPosition: L.LatLngExpression = [this.latitude, this.longitude];

    this.locationMap = L.map(this.locationMapContainer.nativeElement, {
      center: initialPosition,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.locationMap);

    this.locationMarker = L.marker(initialPosition, {
      draggable: true,
      icon: this.locationMarkerIcon,
      title: this.translate.instant('community.eventForm.eventLocation'),
    }).addTo(this.locationMap);

    this.locationMap.on('click', (event: L.LeafletMouseEvent) => {
      this.ngZone.run(() => this.updateLocationFromMap(event.latlng));
    });

    this.locationMarker.on('dragend', () => {
      const markerPosition = this.locationMarker?.getLatLng();

      if (markerPosition) {
        this.ngZone.run(() => this.updateLocationFromMap(markerPosition));
      }
    });

    setTimeout(() => this.locationMap?.invalidateSize());
  }

  private updateLocationFromMap(position: L.LatLng): void {
    this.latitude = this.roundCoordinate(position.lat);
    this.longitude = this.roundCoordinate(position.lng);
    this.updateLocationMarker(this.latitude, this.longitude, false);
    this.changeDetectorRef.detectChanges();
  }

  private updateLocationMarker(latitude: number, longitude: number, panToMarker: boolean): void {
    const position: L.LatLngExpression = [latitude, longitude];
    this.locationMarker?.setLatLng(position);

    if (panToMarker) {
      this.locationMap?.setView(position, this.locationMap.getZoom());
    }
  }

  private hasValidCoordinates(): boolean {
    return Number.isFinite(this.latitude) && Number.isFinite(this.longitude);
  }

  private roundCoordinate(value: number): number {
    return Number(value.toFixed(6));
  }
}
