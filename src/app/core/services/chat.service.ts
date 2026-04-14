import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ApiService } from './api.service';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { PageResponse } from '../models/page-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChatService {

  private stompClient: Client | null = null;

  constructor(private api: ApiService) {}

  startChat(animalId: number): Observable<Chat> {
    return this.api.post<Chat>(`/chat/start/${animalId}`, {});
  }

  getMessages(chatId: number, page = 0): Observable<PageResponse<Message>> {
    return this.api.get<PageResponse<Message>>(`/chat/${chatId}/messages`, { page });
  }

  listMyChats(): Observable<Chat[]> {
    return this.api.get<Chat[]>('/chat/my');
  }

  connectWebSocket(chatId: number, onMessage: (msg: Message) => void): void {
    this.stompClient = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      onConnect: () => {
        this.stompClient?.subscribe(`/topic/chat/${chatId}`, (frame: IMessage) => {
          const message: Message = JSON.parse(frame.body);
          onMessage(message);
        });
      },
      reconnectDelay: 5000,
    });

    this.stompClient.activate();
  }

  sendWebSocketMessage(chatId: number, content: string): void {
    if (this.stompClient?.connected) {
      this.stompClient.publish({
        destination: `/app/chat/${chatId}/send`,
        body: JSON.stringify({ content }),
      });
    }
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
      this.stompClient = null;
    }
  }
}