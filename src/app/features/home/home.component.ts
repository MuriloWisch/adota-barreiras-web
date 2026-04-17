import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';

import { AnimalService } from '../../core/services/animal.service';
import { Animal } from '../../core/models/animal.model';
import { HomeFiltersComponent } from './home-filters.component';
import { HomeFilters } from './home-filter.model';
import { HomeListComponent } from './home-list.component';
import { MapComponent } from '../../shared/components/map/map.component';

const BARREIRAS_LAT = -12.1539;
const BARREIRAS_LNG = -44.9986;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatIconModule,
    HomeFiltersComponent,
    HomeListComponent,
    MapComponent,
  ],
  animations: [
    trigger('heroAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="home-wrap">

      <!-- ══ DESKTOP LAYOUT ══ -->
      <div class="desktop-layout">

        <!-- Left column -->
        <div class="left-col">

          <!-- Hero -->
          <div class="hero" @heroAnim>
            <h1>Encontre seu novo<br><span class="highlight">melhor amigo</span> em Barreiras</h1>
            <p *ngIf="animals().length > 0">
              🐾 <strong>{{ animals().length }}+</strong> animais disponíveis perto de você
            </p>
            <p *ngIf="!animals().length && !loading()">
              Buscando animais na sua região...
            </p>
          </div>

          <app-home-filters (filtersChange)="onFiltersChange($event)"></app-home-filters>

          <!-- List -->
          <div class="list-scroll">
            <app-home-list
              [animals]="animals()"
              [loading]="loading()"
              [selectedId]="selectedId()"
              (onSelect)="onAnimalSelect($event)"
              (loadNextPage)="loadMore()">
            </app-home-list>
          </div>

        </div>

        <div class="right-col">
          <app-map
            [animals]="animals()"
            [centerLat]="userLat()"
            [centerLng]="userLng()"
            [radius]="currentRadius()"
            (onAnimalSelect)="onAnimalSelect($event)">
          </app-map>
        </div>

      </div>

      <div class="mobile-layout">

        <div class="hero hero-mobile" @heroAnim>
          <h1>Encontre seu novo <span class="highlight">melhor amigo</span></h1>
        </div>

        <app-home-filters (filtersChange)="onFiltersChange($event)"></app-home-filters>

        <mat-tab-group class="mobile-tabs" animationDuration="200ms">

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>view_list</mat-icon>&nbsp; Lista
            </ng-template>
            <app-home-list
              [animals]="animals()"
              [loading]="loading()"
              [selectedId]="selectedId()"
              (onSelect)="onAnimalSelect($event)"
              (loadNextPage)="loadMore()">
            </app-home-list>
          </mat-tab>

          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>map</mat-icon>&nbsp; Mapa
            </ng-template>
            <div class="mobile-map">
              <app-map
                [animals]="animals()"
                [centerLat]="userLat()"
                [centerLng]="userLng()"
                [radius]="currentRadius()"
                (onAnimalSelect)="onAnimalSelect($event)">
              </app-map>
            </div>
          </mat-tab>

        </mat-tab-group>

      </div>

    </div>
  `,
  styles: [`
    .home-wrap {
      min-height: 100vh;
      background: #f8fafc;
    }

    /* ── Desktop ── */
    .desktop-layout {
      display: flex;
      height: calc(100vh - 64px);
    }

    .left-col {
      width: 42%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 24px 24px 0;
      border-right: 1px solid #f0f0f0;
    }

    .list-scroll {
      flex: 1;
      overflow-y: auto;
      padding-bottom: 24px;
      padding-right: 4px;
    }

    .right-col {
      flex: 1;
      position: sticky;
      top: 64px;
      height: calc(100vh - 64px);
    }

    /* ── Hero ── */
    .hero {
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1E3A5F;
      line-height: 1.3;
    }
    .highlight { color: #4CAF50; }
    .hero p    { font-size: 14px; color: #666; margin-top: 8px; }
    .hero p strong { color: #4CAF50; }

    /* ── Mobile ── */
    .mobile-layout { display: none; padding: 16px; }
    .hero-mobile { margin-bottom: 16px; }
    .hero-mobile h1 { font-size: 20px; }
    .mobile-tabs { margin-top: 8px; }
    .mobile-map { height: calc(100vh - 260px); }

    @media (max-width: 768px) {
      .desktop-layout { display: none; }
      .mobile-layout  { display: block; }
    }
  `],
})
export class HomeComponent implements OnInit, OnDestroy {

  animals    = signal<Animal[]>([]);
  loading    = signal(false);
  userLat    = signal(BARREIRAS_LAT);
  userLng    = signal(BARREIRAS_LNG);
  selectedId = signal<number | undefined>(undefined);
  currentRadius = signal(10);

  private page    = 0;
  private hasMore = true;
  private filters: HomeFilters = { species: '', size: '', sex: '', radius: 10 };
  private destroy$ = new Subject<void>();

  constructor(private animalService: AnimalService, private router: Router) {}

  ngOnInit(): void {
    this.requestLocation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private requestLocation(): void {
    if (!navigator.geolocation) {
      this.fetchAnimals(true);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userLat.set(pos.coords.latitude);
        this.userLng.set(pos.coords.longitude);
        this.fetchAnimals(true);
      },
      () => this.fetchAnimals(true),
      { timeout: 6000 },
    );
  }

  private fetchAnimals(reset = false): void {
    if (this.loading() || (!reset && !this.hasMore)) return;

    if (reset) {
      this.page = 0;
      this.hasMore = true;
      this.animals.set([]);
    }

    this.loading.set(true);

    const filterParams: Record<string, string> = {};
    if (this.filters.species) filterParams['species'] = this.filters.species;
    if (this.filters.size)    filterParams['size']    = this.filters.size;
    if (this.filters.sex)     filterParams['sex']     = this.filters.sex;

    this.animalService.getNearby(
      this.userLat(),
      this.userLng(),
      this.filters.radius,
      filterParams,
      this.page,
    ).pipe(takeUntil(this.destroy$))
     .subscribe({
      next: resp => {
        this.animals.update(prev => [...prev, ...resp.content]);
        this.hasMore = this.page < resp.totalPages - 1;
        this.page++;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFiltersChange(filters: HomeFilters): void {
    this.filters = filters;
    this.currentRadius.set(filters.radius);
    this.fetchAnimals(true);
  }

  loadMore(): void {
    this.fetchAnimals(false);
  }

  onAnimalSelect(animal: Animal): void {
    this.selectedId.set(animal.id);
    this.router.navigate(['/animals', animal.id]);
  }
}