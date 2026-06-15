import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subject, takeUntil } from 'rxjs';

import { AnimalService } from '../../core/services/animal.service';
import { Animal } from '../../core/models/animal.model';
import { HomeFiltersComponent, HomeFilters } from './home-filters.component';
import { HomeListComponent } from './home-list.component';
import { MapComponent } from '../../shared/components/map/map.component';

const BARREIRAS_LAT = -12.1539;
const BARREIRAS_LNG = -44.9986;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, MatTabsModule, MatIconModule,
    HomeFiltersComponent, HomeListComponent, MapComponent,
  ],
  animations: [
    trigger('heroAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(24px)' }),
        animate('500ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {

  animals       = signal<Animal[]>([]);
  loading       = signal(false);
  userLat       = signal(BARREIRAS_LAT);
  userLng       = signal(BARREIRAS_LNG);
  selectedId    = signal<number | undefined>(undefined);
  currentRadius = signal(10);

  private page     = 0;
  private hasMore  = true;
  private filters: HomeFilters = { species: '', size: '', sex: '', radius: 10 };
  private destroy$ = new Subject<void>();

  constructor(private animalService: AnimalService, private router: Router) {}

  ngOnInit(): void { this.requestLocation(); }
  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private requestLocation(): void {
    if (!navigator.geolocation) { this.fetchAnimals(true); return; }
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
    if (reset) { this.page = 0; this.hasMore = true; this.animals.set([]); }
    this.loading.set(true);

    const fp: Record<string, string> = {};
    if (this.filters.species) fp['species'] = this.filters.species;
    if (this.filters.size)    fp['size']    = this.filters.size;
    if (this.filters.sex)     fp['sex']     = this.filters.sex;

    this.animalService.getNearby(
      this.userLat(), this.userLng(), this.filters.radius, fp, this.page,
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: resp => {
        this.animals.update(prev => [...prev, ...resp.content]);
        this.hasMore = this.page < resp.totalPages - 1;
        this.page++;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onFiltersChange(f: HomeFilters): void {
    this.filters = f;
    this.currentRadius.set(f.radius);
    this.fetchAnimals(true);
  }

  loadMore(): void { this.fetchAnimals(false); }

  onAnimalSelect(animal: Animal): void {
    this.selectedId.set(animal.id);
    this.router.navigate(['/animals', animal.id]);
  }
} 