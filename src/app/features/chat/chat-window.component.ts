import {
  Component, Input, Output, EventEmitter, OnChanges, AfterViewChecked,
  ViewChild, ElementRef, signal, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate } from '@angular/animations';
import { Chat } from '../../core/models/chat.model';
import { Message } from '../../core/models/message.model';
import { User } from '../../core/models/user.model';

interface MessageGroup {
  dateLabel: string;
  messages: Message[];
}

@Component({
  selector: 'app-chat-window',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatIconModule, MatButtonModule, MatProgressSpinnerModule,
  ],
  animations: [
    trigger('msgAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('200ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="empty-state" *ngIf="!chat">
      <div class="empty-inner">
        <span class="empty-icon">💬</span>
        <h3>Suas conversas</h3>
        <p>Selecione uma conversa para começar</p>
      </div>
    </div>

    <div class="window-wrap" *ngIf="chat">

      <div class="win-header">
        <div class="avatar">{{ otherUser?.name?.charAt(0)?.toUpperCase() }}</div>
        <div class="header-info">
          <span class="other-name">{{ otherUser?.name }}</span>
          <span class="animal-sub">🐾 {{ chat.animal.name }}</span>
        </div>
        <a mat-stroked-button class="see-animal-btn" [routerLink]="['/animals', chat.animal.id]">
          <mat-icon>visibility</mat-icon> Ver Animal
        </a>
      </div>

      <div class="messages-area" #messagesArea (scroll)="onScroll()">

        <div class="load-prev" *ngIf="loadingMore">
          <mat-spinner diameter="24"></mat-spinner>
        </div>

        <ng-container *ngIf="loading && !messages.length">
          <div class="skel-msg right"  *ngFor="let s of skeletons.slice(0,2)"></div>
          <div class="skel-msg left"   *ngFor="let s of skeletons.slice(0,3)"></div>
          <div class="skel-msg right"  *ngFor="let s of skeletons.slice(0,1)"></div>
        </ng-container>

        <ng-container *ngFor="let group of groups()">
          <div class="date-separator">
            <span>{{ group.dateLabel }}</span>
          </div>
          <div
            class="msg-row"
            *ngFor="let msg of group.messages"
            [class.mine]="msg.sender.id === currentUserId"
            @msgAnim>
            <div class="bubble" [class.bubble-mine]="msg.sender.id === currentUserId">
              <p>{{ msg.content }}</p>
              <span class="msg-time">{{ msg.timestamp | date:'HH:mm' }}</span>
            </div>
          </div>
        </ng-container>

      </div>

      <div class="win-footer">
        <input
          class="msg-input"
          [(ngModel)]="inputText"
          placeholder="Digite uma mensagem..."
          [disabled]="sending"
          (keydown.enter)="send()">
        <button class="send-btn" [disabled]="!inputText.trim() || sending" (click)="send()">
          <mat-spinner diameter="18" *ngIf="sending"></mat-spinner>
          <mat-icon *ngIf="!sending">send</mat-icon>
        </button>
      </div>

    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    /* Empty */
    .empty-state {
      flex: 1; display: flex; align-items: center; justify-content: center;
      background: #f8fafc;
    }
    .empty-inner { text-align: center; }
    .empty-icon  { font-size: 64px; }
    h3 { font-size: 20px; font-weight: 700; color: #1E3A5F; margin: 12px 0 6px; }
    .empty-inner p { font-size: 14px; color: #999; }

    /* Window */
    .window-wrap { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

    /* Header */
    .win-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 20px;
      background: #fff;
      border-bottom: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
    .avatar {
      width: 42px; height: 42px; border-radius: 50%;
      background: #1E3A5F; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px; font-weight: 700; flex-shrink: 0;
    }
    .header-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .other-name  { font-size: 15px; font-weight: 700; color: #1E3A5F; }
    .animal-sub  { font-size: 12px; color: #888; }
    .see-animal-btn {
      border-color: #1E3A5F !important; color: #1E3A5F !important;
      border-radius: 10px !important; font-size: 13px !important;
      height: 36px; display: flex; align-items: center; gap: 4px;
      transition: all 0.3s ease !important;
    }
    .see-animal-btn:hover { background: #f0f4ff !important; }

    /* Messages */
    .messages-area {
      flex: 1; overflow-y: auto;
      padding: 16px 20px; display: flex;
      flex-direction: column; gap: 4px;
      background: #f8fafc;
    }
    .load-prev { display: flex; justify-content: center; padding: 8px; }

    /* Skeleton */
    .skel-msg {
      height: 40px; border-radius: 12px; margin: 4px 0;
      background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      max-width: 60%;
    }
    .skel-msg.right { align-self: flex-end; }
    .skel-msg.left  { align-self: flex-start; }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Date separator */
    .date-separator {
      display: flex; align-items: center; gap: 12px;
      margin: 12px 0 8px; color: #aaa; font-size: 12px;
      text-align: center;
    }
    .date-separator span {
      background: #ececec; padding: 3px 12px;
      border-radius: 20px; white-space: nowrap;
    }

    /* Messages */
    .msg-row { display: flex; }
    .msg-row.mine { justify-content: flex-end; }

    .bubble {
      max-width: 65%; padding: 10px 14px;
      border-radius: 18px 18px 18px 4px;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      display: flex; flex-direction: column; gap: 4px;
    }
    .bubble-mine {
      background: #dcf8e1;
      border-radius: 18px 18px 4px 18px;
    }
    .bubble p       { font-size: 14px; color: #222; line-height: 1.5; word-break: break-word; }
    .msg-time       { font-size: 10px; color: #aaa; align-self: flex-end; }

    /* Footer */
    .win-footer {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 20px;
      background: #fff;
      border-top: 1px solid #f0f0f0;
      flex-shrink: 0;
    }
    .msg-input {
      flex: 1; height: 44px;
      border: 1.5px solid #e2e8f0; border-radius: 22px;
      padding: 0 18px; font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none; transition: border-color 0.3s ease;
      background: #f8fafc;
    }
    .msg-input:focus { border-color: #4CAF50; background: #fff; }
    .msg-input:disabled { opacity: 0.6; cursor: not-allowed; }
    .send-btn {
      width: 44px; height: 44px; border-radius: 50%;
      background: #4CAF50; color: #fff; border: none;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; flex-shrink: 0;
      transition: all 0.3s ease;
    }
    .send-btn:hover:not([disabled]) {
      background: #43A047;
      box-shadow: 0 4px 14px rgba(76,175,80,0.4);
      transform: scale(1.05);
    }
    .send-btn[disabled] { background: #ccc; cursor: not-allowed; }

    @media (max-width: 768px) {
      .see-animal-btn span { display: none; }
      .bubble { max-width: 80%; }
    }
  `],
})
export class ChatWindowComponent implements OnChanges, AfterViewChecked {
  @Input() chat?: Chat;
  @Input() messages: Message[] = [];
  @Input() loading = false;
  @Input() loadingMore = false;
  @Input() currentUserId?: number;
  @Output() onSend        = new EventEmitter<string>();
  @Output() loadPrevPage  = new EventEmitter<void>();

  @ViewChild('messagesArea') messagesArea!: ElementRef<HTMLDivElement>;

  inputText = '';
  sending   = false;
  skeletons = Array(3);

  private shouldScroll = true;
  groups = signal<MessageGroup[]>([]);

  get otherUser(): User | undefined {
    if (!this.chat) return undefined;
    return this.chat.userOne?.id === this.currentUserId
      ? this.chat.userTwo
      : this.chat.userOne;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['messages']) {
      this.buildGroups();
      this.shouldScroll = true;
    }
    if (changes['chat']) {
      this.inputText  = '';
      this.shouldScroll = true;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  private scrollToBottom(): void {
    const el = this.messagesArea?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  onScroll(): void {
    const el = this.messagesArea?.nativeElement;
    if (el && el.scrollTop === 0 && !this.loadingMore) {
      this.loadPrevPage.emit();
    }
  }

  send(): void {
    const text = this.inputText.trim();
    if (!text) return;
    this.inputText = '';
    this.onSend.emit(text);
  }

  private buildGroups(): void {
    const map = new Map<string, Message[]>();

    for (const msg of this.messages) {
      const label = this.dateLabel(msg.timestamp);
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(msg);
    }

    this.groups.set(
      Array.from(map.entries()).map(([dateLabel, messages]) => ({ dateLabel, messages }))
    );
  }

  private dateLabel(ts: string): string {
    const d     = new Date(ts);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d.toDateString() === today.toDateString())     return 'Hoje';
    if (d.toDateString() === yesterday.toDateString()) return 'Ontem';
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}