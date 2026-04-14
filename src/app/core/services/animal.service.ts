import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Animal } from '../models/animal.model';
import { PageResponse } from '../models/page-response.model';

export interface AnimalFilters {
  species?: string;
  size?: string;
  sex?: string;
}

@Injectable({ providedIn: 'root' })
export class AnimalService {

  constructor(private api: ApiService) {}

  getNearby(
    lat: number,
    lng: number,
    radius: number,
    filters: AnimalFilters = {},
    page = 0,
  ): Observable<PageResponse<Animal>> {
    return this.api.get<PageResponse<Animal>>('/animals/nearby', {
      lat, lng, radius, page,
      ...filters,
    });
  }

  getById(id: number): Observable<Animal> {
    return this.api.get<Animal>(`/animals/${id}`);
  }

  getMyAnimals(): Observable<Animal[]> {
    return this.api.get<Animal[]>('/animals/my');
  }

  create(formData: FormData): Observable<Animal> {
    return this.api.postFormData<Animal>('/animals', formData);
  }

  update(id: number, data: Partial<Animal>): Observable<Animal> {
    return this.api.put<Animal>(`/animals/${id}`, data);
  }

  delete(id: number): Observable<any> {
    return this.api.delete<any>(`/animals/${id}`);
  }
}