import {
  Component, Input, Output, EventEmitter,
  OnChanges, AfterViewInit, OnDestroy,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { Animal } from '../../../core/models/animal.model';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl:       'assets/marker-icon.png',
  shadowUrl:     'assets/marker-shadow.png',
});

const BARREIRAS_LAT = -12.1539;
const BARREIRAS_LNG = -44.9986;

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE:  '#4CAF50',
  IN_PROCESS: '#FF9800',
  EM_ANALISE: '#9E9E9E',
  ADOPTED:    '#9E9E9E',
};

function makeIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
        <path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 26 14 26S28 23.625 28 14C28 6.27 21.73 0 14 0z"
              fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.9"/>
      </svg>`,
    iconSize:    [28, 40],
    iconAnchor:  [14, 40],
    popupAnchor: [0, -40],
  });
}

let mapIdCounter = 0;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div [id]="mapId" class="map-container"></div>`,
  styles: [`
    .map-container {
      width: 100%;
      height: 100%;
      min-height: 200px;
      border-radius: inherit;
      z-index: 0;
    }
  `],
})
export class MapComponent implements AfterViewInit, OnChanges, OnDestroy {

  @Input() animals:     Animal[] = [];
  @Input() centerLat:   number   = BARREIRAS_LAT;
  @Input() centerLng:   number   = BARREIRAS_LNG;
  @Input() radius:      number   = 10;
  @Input() interactive: boolean  = true;
  @Input() zoom:        number   = 13;

  @Output() onAnimalSelect = new EventEmitter<Animal>();
  @Output() onMapClick     = new EventEmitter<{ lat: number; lng: number }>();

  mapId = `leaflet-map-${mapIdCounter++}`;

  private map!:    L.Map;
  private markers: L.Layer[] = [];
  private circle?: L.Circle;
  private ready    = false;

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 50);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) return;

    if (changes['centerLat'] || changes['centerLng'] || changes['zoom']) {
      this.map.setView([this.centerLat, this.centerLng], this.zoom);
      this.updateCircle();
    }

    if (changes['animals']) {
      this.renderMarkers();
    }

    if (changes['radius']) {
      this.updateCircle();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const el = document.getElementById(this.mapId);
    if (!el) return;

    this.map = L.map(this.mapId, {
      center:          [this.centerLat, this.centerLng],
      zoom:            this.zoom,
      zoomControl:     this.interactive,
      scrollWheelZoom: this.interactive,
      dragging:        this.interactive,
      touchZoom:       this.interactive,
      doubleClickZoom: this.interactive,
      boxZoom:         this.interactive,
      keyboard:        this.interactive,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.interactive) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick.emit({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    this.updateCircle();
    this.renderMarkers();
    this.ready = true;
  }

  private renderMarkers(): void {
    this.markers.forEach(m => m.remove());
    this.markers = [];

    for (const animal of this.animals) {
      if (animal.latitude == null || animal.longitude == null) continue;

      const color  = STATUS_COLOR[animal.status] ?? '#9E9E9E';
      const icon   = makeIcon(color);
      const marker = L.marker([animal.latitude, animal.longitude], { icon });

      const popupId = `popup-btn-${this.mapId}-${animal.id}`;

      const popup = L.popup({ closeButton: false, maxWidth: 200 }).setContent(`
        <div style="font-family:'Inter',sans-serif;padding:4px">
          <strong style="color:#1E3A5F;font-size:14px">${animal.name}</strong><br>
          <span style="font-size:12px;color:#888">${animal.species}</span><br>
          <button
            id="${popupId}"
            style="margin-top:8px;background:#4CAF50;color:#fff;border:none;
                   border-radius:8px;padding:5px 12px;cursor:pointer;font-size:12px;
                   font-weight:600;width:100%">
            Ver detalhes
          </button>
        </div>
      `);

      marker.bindPopup(popup);

      marker.on('popupopen', () => {
        const btn = document.getElementById(popupId);
        if (btn) {
          btn.onclick = () => {
            this.onAnimalSelect.emit(animal);
            this.map.closePopup();
          };
        }
      });

      marker.addTo(this.map);
      this.markers.push(marker);
    }
  }

  private updateCircle(): void {
    if (this.circle) {
      this.circle.remove();
      this.circle = undefined;
    }

    if (this.radius > 0) {
      this.circle = L.circle([this.centerLat, this.centerLng], {
        radius:      this.radius * 1000,
        color:       '#4CAF50',
        fillColor:   '#4CAF50',
        fillOpacity: 0.07,
        weight:      2,
        opacity:     0.5,
      }).addTo(this.map);
    }
  }

  setCenter(lat: number, lng: number, zoomLevel?: number): void {
    if (!this.ready) return;
    this.map.setView([lat, lng], zoomLevel ?? this.zoom);
  }
}