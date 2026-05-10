import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as L from 'leaflet';
import { CommunityEventSummary } from '../../../application/community.service';

@Component({
  selector: 'app-community-events-map',
  imports: [],
  templateUrl: './community-events-map.html',
  styleUrl: './community-events-map.css',
})
export class CommunityEventsMap implements AfterViewInit, OnChanges, OnDestroy {
  @Input() events: CommunityEventSummary[] = [];

  @ViewChild('map', { static: true }) private mapContainer?: ElementRef<HTMLDivElement>;

  private map?: L.Map;
  private readonly markersLayer = L.layerGroup();
  private readonly defaultCenter: L.LatLngExpression = [-12.0464, -77.0428];
  private readonly eventIcon = L.divIcon({
    className: 'event-map-marker',
    html: '<span></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  get previewEvents(): CommunityEventSummary[] {
    return this.mappedEvents.slice(0, 3);
  }

  ngAfterViewInit(): void {
    this.initializeMap();
    this.renderMarkers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['events'] && this.map) {
      this.renderMarkers();
    }
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initializeMap(): void {
    if (!this.mapContainer || this.map) {
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement, {
      center: this.defaultCenter,
      zoom: 12,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
  }

  private renderMarkers(): void {
    if (!this.map) {
      return;
    }

    this.markersLayer.clearLayers();

    const bounds = L.latLngBounds([]);

    this.mappedEvents.forEach((summary) => {
      const position: L.LatLngExpression = [summary.event.latitude, summary.event.longitude];

      L.marker(position, {
        icon: this.eventIcon,
        title: summary.event.name,
      })
        .bindPopup(this.buildPopupContent(summary))
        .addTo(this.markersLayer);

      bounds.extend(position);
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [28, 28], maxZoom: 15 });
      return;
    }

    this.map.setView(this.defaultCenter, 12);
  }

  private get mappedEvents(): CommunityEventSummary[] {
    return this.events.filter((summary) => this.hasValidCoordinates(summary));
  }

  private hasValidCoordinates(summary: CommunityEventSummary): boolean {
    const { latitude, longitude } = summary.event;
    return Number.isFinite(latitude) && Number.isFinite(longitude);
  }

  private buildPopupContent(summary: CommunityEventSummary): string {
    const event = summary.event;
    const time = event.start_time.slice(11, 16);

    return `
      <strong>${this.escapeHtml(event.name)}</strong>
      <span>${this.escapeHtml(event.location)}</span>
      <small>${this.escapeHtml(event.date)} - ${this.escapeHtml(time)}</small>
    `;
  }

  private escapeHtml(value: string): string {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };

    return value.replace(/[&<>"']/g, (character) => entities[character]);
  }
}
