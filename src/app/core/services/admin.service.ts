import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Animal } from '../models/animal.model';
import { User } from '../models/user.model';
import { PageResponse } from '../models/page-response.model';

@Injectable({ providedIn: 'root' })
export class AdminService {

  constructor(private api: ApiService) {}

  listSuspectAnimals(page = 0): Observable<PageResponse<Animal>> {
    return this.api.get<PageResponse<Animal>>('/admin/animals/suspect', { page });
  }

  approveAnimal(id: number): Observable<Animal> {
    return this.api.put<Animal>(`/admin/animals/${id}/approve`, {});
  }

  removeAnimal(id: number): Observable<any> {
    return this.api.delete<any>(`/admin/animals/${id}`);
  }

  blockUser(id: number): Observable<any> {
    return this.api.put<any>(`/admin/users/${id}/block`, {});
  }

  listUsers(page = 0): Observable<PageResponse<User>> {
    return this.api.get<PageResponse<User>>('/admin/users', { page });
  }
}