import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Subject, debounceTime, takeUntil } from 'rxjs';

export interface HomeFilters {
  species: string;
  size:    string;
  sex:     string;
  radius:  number;
}

@Component({
  selector: 'app-home-filters',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonToggleModule,
    MatSliderModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './home-filters.component.html',
  styleUrl: './home-filters.component.scss',
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

  clear(): void {
    this.form.setValue({
      species: '',
      size:    '',
      sex:     '',
      radius:  10,
    });
  }
}
