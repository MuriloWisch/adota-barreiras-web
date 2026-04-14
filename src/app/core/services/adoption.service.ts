import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { AdoptionRequest } from '../models/adoption-request.model';

@Injectable({ providedIn: 'root' })
export class AdoptionService {

  constructor(private api: ApiService) {}

  request(animalId: number): Observable<AdoptionRequest> {
    return this.api.post<AdoptionRequest>('/adoptions/request', { animalId });
  }

  accept(id: number): Observable<AdoptionRequest> {
    return this.api.put<AdoptionRequest>(`/adoptions/${id}/accept`, {});
  }

  reject(id: number): Observable<AdoptionRequest> {
    return this.api.put<AdoptionRequest>(`/adoptions/${id}/reject`, {});
  }

  confirm(id: number): Observable<AdoptionRequest> {
    return this.api.put<AdoptionRequest>(`/adoptions/${id}/confirm`, {});
  }

  listByAnimal(animalId: number): Observable<AdoptionRequest[]> {
    return this.api.get<AdoptionRequest[]>(`/adoptions/animal/${animalId}`);
  }

  listMyRequests(): Observable<AdoptionRequest[]> {
    return this.api.get<AdoptionRequest[]>('/adoptions/my');
  }
}