import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, takeUntil } from 'rxjs';

export interface HomeFilters {
  species: string;
  size:    string;
  sex:     string;
  radius:  number;
}

type FilterField = 'species' | 'size' | 'sex';

@Component({
  selector: 'app-home-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatSliderModule,
    MatIconModule,
  ],
  templateUrl: './home-filters.component.html',
  styleUrls: ['./home-filters.component.scss'],
})
export class HomeFiltersComponent implements OnInit, OnDestroy {

  @Output() filtersChange = new EventEmitter<HomeFilters>();

  form: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      species: [''],
      size:    [''],
      sex:     [''],
      radius:  [10],
    });
  }

  ngOnInit(): void {
    this.form.valueChanges.pipe(
      debounceTime(400),
      takeUntil(this.destroy$),
    ).subscribe(values => this.filtersChange.emit(values as HomeFilters));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilter(field: FilterField, value: string): void {
    this.form.patchValue({ [field]: value });
  }

  isActive(field: FilterField, value: string): boolean {
    return this.form.get(field)?.value === value;
  }

  get hasActiveFilters(): boolean {
    const v = this.form.value;
    return !!(v.species || v.size || v.sex || v.radius !== 10);
  }

  clear(): void {
    this.form.setValue({
      species: '',
      size:    '',
      sex:     '',
      radius:  10,
    });
  }
}
