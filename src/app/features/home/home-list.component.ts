import { Component, Input, Output, EventEmitter, OnChanges, AfterViewInit,
         ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { AnimalCardComponent } from '../../shared/components/animal-card/animal-card.component';
import { ScrollAnimationDirective } from '../../shared/directives/scroll-animation.directive';
import { Animal } from '../../core/models/animal.model';

@Component({
  selector: 'app-home-list',
  standalone: true,
  imports: [CommonModule, AnimalCardComponent, ScrollAnimationDirective],
  animations: [
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(60, [
            animate('350ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
          ]),
        ], { optional: true }),
      ]),
    ]),
  ],
  template: `
    <div class="list-wrap">

      <!-- Skeleton -->
      <div class="grid" *ngIf="loading && !animals.length">
        <div class="skeleton-card" *ngFor="let s of skeletons">
          <div class="skel skel-img"></div>
          <div class="skel-body">
            <div class="skel skel-title"></div>
            <div class="skel skel-tag"></div>
            <div class="skel skel-btn"></div>
          </div>
        </div>
      </div>

      <!-- Lista -->
      <div class="grid" [@listAnim]="animals.length" *ngIf="!loading || animals.length">
        <div
          *ngFor="let animal of animals; let i = index"
          appScrollAnimation
          [style.animation-delay]="(i % 6) * 60 + 'ms'">
          <app-animal-card
            [animal]="animal"
            [class.highlighted]="selectedId === animal.id"
            (onSelect)="onSelect.emit(animal)">
          </app-animal-card>
        </div>
      </div>

      <!-- Empty -->
      <div class="empty" *ngIf="!loading && !animals.length">
        <span>🔍</span>
        <p>Nenhum animal encontrado neste raio</p>
        <small>Tente aumentar o raio de busca ou mudar os filtros</small>
      </div>

      <!-- Loading more -->
      <div class="load-more-spinner" *ngIf="loading && animals.length">
        <div class="spinner-ring"></div>
      </div>

      <!-- Sentinel para scroll infinito -->
      <div #sentinel class="sentinel"></div>

    </div>
  `,
  styles: [`
    .list-wrap { width: 100%; }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 480px) {
      .grid { grid-template-columns: 1fr; }
    }

    /* Highlight */
    :host ::ng-deep .highlighted .card {
      outline: 2px solid #4CAF50;
      box-shadow: 0 0 0 4px rgba(76,175,80,0.15) !important;
    }

    /* Skeleton */
    .skeleton-card {
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .skel {
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 6px;
    }
    .skel-img  { height: 180px; border-radius: 0; }
    .skel-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
    .skel-title { height: 18px; width: 60%; }
    .skel-tag   { height: 14px; width: 80%; }
    .skel-btn   { height: 38px; margin-top: 8px; border-radius: 10px; }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      padding: 56px 24px; gap: 8px; text-align: center;
    }
    .empty span { font-size: 48px; }
    .empty p    { font-size: 16px; font-weight: 600; color: #1E3A5F; }
    .empty small { font-size: 13px; color: #999; }

    /* Load more */
    .load-more-spinner {
      display: flex; justify-content: center; padding: 24px;
    }
    .spinner-ring {
      width: 36px; height: 36px; border-radius: 50%;
      border: 3px solid #e0e0e0;
      border-top-color: #4CAF50;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .sentinel { height: 1px; }
  `],
})
export class HomeListComponent implements AfterViewInit, OnDestroy {
  @Input() animals: Animal[] = [];
  @Input() loading = false;
  @Input() selectedId?: number;
  @Output() onSelect     = new EventEmitter<Animal>();
  @Output() loadNextPage = new EventEmitter<void>();

  @ViewChild('sentinel') sentinel!: ElementRef;

  skeletons = Array(4);
  private observer!: IntersectionObserver;

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.loading) {
        this.loadNextPage.emit();
      }
    }, { threshold: 0.1 });

    if (this.sentinel) {
      this.observer.observe(this.sentinel.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}