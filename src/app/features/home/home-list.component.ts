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
  templateUrl: './home-list.component.html',
  styleUrls: ['./home-list.component.scss'],
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