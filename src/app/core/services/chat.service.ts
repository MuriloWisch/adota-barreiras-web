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
  private pendingChatId: number | null = null;

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
  this.disconnect();
  this.pendingChatId = chatId;

  const token = localStorage.getItem('adota_token');

  this.stompClient = new Client({
    webSocketFactory: () => new SockJS(environment.wsUrl),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    onConnect: () => {
      this.stompClient?.subscribe(`/topic/chat/${chatId}`, (frame: IMessage) => {
        const message: Message = JSON.parse(frame.body);
        onMessage(message);
      });
    },
    onStompError: (frame) => {
      console.error('[Chat] Erro STOMP:', frame.headers, frame.body);
    },
    onWebSocketError: (event) => {
      console.error('[Chat] Erro WebSocket:', event);
    },
    onDisconnect: () => {
      console.log('[Chat] STOMP desconectado.');
    },
  });

    this.stompClient.activate();
  }

  sendWebSocketMessage(chatId: number, content: string): void {
    if (!this.stompClient?.connected) {
      console.warn('[Chat] STOMP ainda não conectado — mensagem não enviada:', content);
      return;
    }

    const destination = `/app/chat/${chatId}/send`;
    const body = JSON.stringify({ content });

    console.log('[Chat] Enviando:', destination, body);

    this.stompClient.publish({ destination, body });
  }

  disconnect(): void {
    if (this.stompClient?.active) {
      this.stompClient.deactivate();
    }
    this.stompClient = null;
    this.pendingChatId = null;
  }
}