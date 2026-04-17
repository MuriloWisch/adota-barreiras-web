import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GoogleMapsModule } from '@angular/google-maps';
import { Animal } from '../../../core/models/animal.model';
import { environment } from '../../../../environments/environment';

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:  '#4CAF50',
  EM_ANALISE: '#FF9800',
  IN_PROCESS: '#2196F3',
  ADOPTED:    '#9E9E9E',
};

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, GoogleMapsModule],
  template: `
    <google-map
      [center]="center"
      [zoom]="zoom"
      width="100%"
      height="100%"
      [options]="mapOptions">

      <map-circle
        [center]="center"
        [radius]="radiusMeters"
        [options]="circleOptions">
      </map-circle>

      <map-marker [position]="center" [options]="userMarkerOptions"></map-marker>

      <ng-container *ngFor="let animal of animals; let i = index">
  <map-marker
    *ngIf="animal.latitude && animal.longitude"
    [position]="{ lat: animal.latitude, lng: animal.longitude }"
    [options]="getMarkerOptions(animal)">

    <map-info-window>
      <div class="info-window">
        <img
          *ngIf="animal.images?.[0]"
          [src]="animal.images[0].imageUrl"
          class="info-img"
        />
        <div class="info-body">
          <strong>{{ animal.name }}</strong>
          <span>{{ animal.species }}</span>
          <button class="info-btn" (click)="onAnimalSelect.emit(animal)">
            Ver detalhes
          </button>
        </div>
      </div>
    </map-info-window>

  </map-marker>
</ng-container>

    </google-map>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .info-window { display: flex; gap: 10px; align-items: center; min-width: 180px; }
    .info-img { width: 56px; height: 56px; border-radius: 8px; object-fit: cover; }
    .info-body { display: flex; flex-direction: column; gap: 4px; }
    .info-body strong { font-size: 14px; color: #1E3A5F; }
    .info-body span { font-size: 12px; color: #888; }
    .info-btn {
      margin-top: 6px; background: #4CAF50; color: #fff;
      border: none; border-radius: 8px; padding: 4px 10px;
      font-size: 12px; cursor: pointer; font-weight: 600;
      transition: background 0.3s ease;
    }
    .info-btn:hover { background: #43A047; }
  `],
})
export class MapComponent implements OnChanges {
  @Input() animals: Animal[] = [];
  @Input() centerLat = -12.1534;
  @Input() centerLng = -44.9901;
  @Input() radius = 10;
  @Output() onAnimalSelect = new EventEmitter<Animal>();

  center: google.maps.LatLngLiteral = { lat: this.centerLat, lng: this.centerLng };
  zoom = 12;

  get radiusMeters() { return this.radius * 1000; }

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }],
  };

  circleOptions: google.maps.CircleOptions = {
    strokeColor: '#4CAF50',
    strokeOpacity: 0.6,
    strokeWeight: 2,
    fillColor: '#4CAF50',
    fillOpacity: 0.07,
  };

  userMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#1E3A5F',
      fillOpacity: 1,
      strokeColor: '#fff',
      strokeWeight: 2,
    },
    title: 'Você',
  };

  ngOnChanges(): void {
    this.center = { lat: this.centerLat, lng: this.centerLng };
  }

  getMarkerOptions(animal: Animal): google.maps.MarkerOptions {
    const color = STATUS_COLOR[animal.status] ?? '#4CAF50';
    return {
      icon: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 1.5,
        scale: 1.6,
        anchor: new google.maps.Point(12, 22),
      },
      title: animal.name,
    };
  }

  openInfo(index: number): void {
    // InfoWindow management via template reference if needed
  }
}