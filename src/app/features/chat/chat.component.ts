import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';

import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/auth/services/auth.service';
import { Chat } from '../../core/models/chat.model';
import { Message } from '../../core/models/message.model';
import { User } from '../../core/models/user.model';
import { ChatListComponent } from './chat-list.component';
import { ChatWindowComponent } from './chat-window.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, ChatListComponent, ChatWindowComponent, MatButtonModule, MatIconModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('250ms ease', style({ transform: 'translateX(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="chat-page">

      <div class="desktop-layout">

        <div class="left-panel">
          <app-chat-list
            [chats]="chats()"
            [selectedChatId]="selectedChat()?.id"
            [currentUserId]="me?.id"
            (onChatSelect)="selectChat($event)">
          </app-chat-list>
        </div>

        <div class="right-panel">
          <app-chat-window
            [chat]="selectedChat() ?? undefined"
            [messages]="messages()"
            [loading]="messagesLoading()"
            [loadingMore]="loadingMore()"
            [currentUserId]="me?.id"
            (onSend)="sendMessage($event)"
            (loadPrevPage)="loadPrevPage()">
          </app-chat-window>
        </div>

      </div>

      <div class="mobile-layout">

        <div class="mobile-list" *ngIf="!mobileShowWindow">
          <app-chat-list
            [chats]="chats()"
            [selectedChatId]="selectedChat()?.id"
            [currentUserId]="me?.id"
            (onChatSelect)="selectChat($event); mobileShowWindow = true">
          </app-chat-list>
        </div>

        <div class="mobile-window" *ngIf="mobileShowWindow" @slideIn>
          <div class="mobile-back-bar">
            <button mat-icon-button (click)="mobileShowWindow = false">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <span>Voltar</span>
          </div>
          <app-chat-window
            [chat]="selectedChat() ?? undefined"
            [messages]="messages()"
            [loading]="messagesLoading()"
            [loadingMore]="loadingMore()"
            [currentUserId]="me?.id"
            (onSend)="sendMessage($event)"
            (loadPrevPage)="loadPrevPage()">
          </app-chat-window>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .chat-page {
      height: calc(100vh - 64px);
      overflow: hidden;
      background: #fff;
    }

    .desktop-layout {
      display: flex;
      height: 100%;
    }
    .left-panel {
      width: 35%;
      border-right: 1px solid #f0f0f0;
      overflow: hidden;
    }
    .right-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .mobile-layout   { display: none; height: 100%; flex-direction: column; }
    .mobile-list     { flex: 1; overflow: hidden; }
    .mobile-window   { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
    .mobile-back-bar {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 12px; border-bottom: 1px solid #f0f0f0;
      font-size: 14px; font-weight: 600; color: #1E3A5F;
      background: #fff; flex-shrink: 0;
    }

    @media (max-width: 768px) {
      .desktop-layout { display: none; }
      .mobile-layout  { display: flex; }
    }
  `],
})
export class ChatComponent implements OnInit, OnDestroy {

  chats          = signal<Chat[]>([]);
  selectedChat   = signal<Chat | null>(null);
  messages       = signal<Message[]>([]);
  messagesLoading = signal(false);
  loadingMore    = signal(false);

  mobileShowWindow = false;

  private page     = 0;
  private hasMore  = true;
  me: User | null  = null;

  constructor(
    private chatService: ChatService,
    private auth: AuthService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.me = this.auth.currentUser$.getValue();
    this.loadChats();
  }

  ngOnDestroy(): void {
    this.chatService.disconnect();
  }

  private loadChats(): void {
    this.chatService.listMyChats().subscribe({
      next: chats => {
        this.chats.set(chats);

        const paramId = Number(this.route.snapshot.paramMap.get('chatId'));
        if (paramId) {
          const found = chats.find(c => c.id === paramId);
          if (found) this.selectChat(found);
        }
      },
    });
  }

  selectChat(chat: Chat): void {
    if (this.selectedChat()?.id === chat.id) return;

    this.chatService.disconnect();
    this.selectedChat.set(chat);
    this.messages.set([]);
    this.page    = 0;
    this.hasMore = true;

    this.loadMessages(true);
    this.connectWs(chat.id);
  }

  private loadMessages(reset = false): void {
    if (!this.selectedChat()) return;

    if (reset) {
      this.messagesLoading.set(true);
    } else {
      this.loadingMore.set(true);
    }

    this.chatService.getMessages(this.selectedChat()!.id, this.page).subscribe({
      next: resp => {
        const sorted = [...resp.content].reverse();
        if (reset) {
          this.messages.set(sorted);
        } else {
          this.messages.update(prev => [...sorted, ...prev]);
        }
        this.hasMore = this.page < resp.totalPages - 1;
        this.page++;
        this.messagesLoading.set(false);
        this.loadingMore.set(false);
      },
      error: () => {
        this.messagesLoading.set(false);
        this.loadingMore.set(false);
      },
    });
  }

  private connectWs(chatId: number): void {
    this.chatService.connectWebSocket(chatId, (msg: Message) => {
      const alreadyExists = this.messages().some(m => m.id === msg.id);
      if (!alreadyExists) {
        this.messages.update(prev => [...prev, msg]);
      }
    });
  }

  sendMessage(content: string): void {
    const chat = this.selectedChat();
    const me   = this.me;
    if (!chat || !me) return;

    const optimistic: Message = {
      id:        Date.now(),
      content,
      timestamp: new Date().toISOString(),
      sender:    me as any,
      chatId:    chat.id,
    };
    this.messages.update(prev => [...prev, optimistic]);

    this.chatService.sendWebSocketMessage(chat.id, content);
  }

  loadPrevPage(): void {
    if (!this.hasMore || this.loadingMore()) return;
    this.loadMessages(false);
  }
}