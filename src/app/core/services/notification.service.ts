import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ApiService } from './api.service';
import { Notification } from '../models/notification.model';
import { PageResponse } from '../models/page-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  notifications$ = new BehaviorSubject<Notification[]>([]);

  private stompClient: Client | null = null;

  constructor(private api: ApiService) {}

  listMyNotifications(page = 0): Observable<PageResponse<Notification>> {
    return this.api.get<PageResponse<Notification>>('/notifications/my', { page });
  }

  markAsRead(id: number): Observable<Notification> {
    return this.api.put<Notification>(`/notifications/${id}/read`, {}).pipe(
      tap(updated => {
        const current = this.notifications$.getValue().map(n =>
          n.id === updated.id ? updated : n
        );
        this.notifications$.next(current);
      }),
    );
  }

  connectWebSocket(userId: number): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      onConnect: () => {
        this.stompClient?.subscribe(
          `/topic/notifications/${userId}`,
          (frame: IMessage) => {
            const notification: Notification = JSON.parse(frame.body);
            this.notifications$.next([
              notification,
              ...this.notifications$.getValue(),
            ]);
          },
        );
      },
      reconnectDelay: 5000,
    });

    this.stompClient.activate();
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}