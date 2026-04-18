import { Component, Input, Output, EventEmitter, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Chat } from '../../core/models/chat.model';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  template: `
    <div class="list-wrap">

      <div class="list-header">
        <h2>Conversas</h2>
      </div>

      <div class="search-wrap">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar conversa</mat-label>
          <input matInput [(ngModel)]="query" (ngModelChange)="applyFilter()">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <div class="chat-items">

        <div class="empty-list" *ngIf="!filtered().length">
          <mat-icon>chat_bubble_outline</mat-icon>
          <p>Nenhuma conversa encontrada</p>
        </div>

        <div
          class="chat-item"
          *ngFor="let chat of filtered()"
          [class.selected]="chat.id === selectedChatId"
          (click)="onChatSelect.emit(chat)">

          <div class="avatar">{{ getOtherUser(chat)?.name?.charAt(0)?.toUpperCase() }}</div>

          <div class="item-body">
            <div class="item-top">
              <span class="other-name">{{ getOtherUser(chat)?.name }}</span>
              <span class="item-time">{{ chat.createdAt | date:'dd/MM' }}</span>
            </div>
            <div class="item-bottom">
              <span class="animal-name">🐾 {{ chat.animal.name }}</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .list-wrap {
      display: flex; flex-direction: column;
      height: 100%; overflow: hidden;
      border-right: 1px solid #f0f0f0;
    }
    .list-header {
      padding: 20px 20px 8px;
      flex-shrink: 0;
    }
    h2 { font-size: 20px; font-weight: 700; color: #1E3A5F; }
    .search-wrap { padding: 0 12px 8px; flex-shrink: 0; }
    .search-field { width: 100%; }
    ::ng-deep .search-field .mat-mdc-form-field-infix { padding: 8px 0 !important; }

    .chat-items { flex: 1; overflow-y: auto; }

    .chat-item {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 16px;
      cursor: pointer;
      transition: background 0.2s ease;
      border-left: 3px solid transparent;
      position: relative;
    }
    .chat-item:hover    { background: #f8fafc; }
    .chat-item.selected { background: #f0fdf4; border-left-color: #4CAF50; }

    .avatar {
      width: 46px; height: 46px; border-radius: 50%;
      background: #1E3A5F; color: #fff; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 700;
    }
    .item-body { flex: 1; min-width: 0; }
    .item-top  { display: flex; justify-content: space-between; align-items: center; }
    .other-name { font-size: 14px; font-weight: 600; color: #1E3A5F; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-time  { font-size: 11px; color: #aaa; flex-shrink: 0; margin-left: 8px; }
    .item-bottom { margin-top: 3px; }
    .animal-name { font-size: 12px; color: #888; }

    .empty-list {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px 16px; color: #bbb; gap: 8px;
      text-align: center;
    }
    .empty-list mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .empty-list p { font-size: 13px; }
  `],
})
export class ChatListComponent implements OnChanges {
  @Input() chats: Chat[] = [];
  @Input() selectedChatId?: number;
  @Input() currentUserId?: number;
  @Output() onChatSelect = new EventEmitter<Chat>();

  query = '';
  filtered = signal<Chat[]>([]);

  ngOnChanges(): void { this.applyFilter(); }

  applyFilter(): void {
    const q = this.query.toLowerCase();
    this.filtered.set(
      this.chats.filter(c =>
        !q ||
        this.getOtherUser(c)?.name?.toLowerCase().includes(q) ||
        c.animal?.name?.toLowerCase().includes(q)
      )
    );
  }

  getOtherUser(chat: Chat): User | undefined {
    return chat.userOne?.id === this.currentUserId ? chat.userTwo : chat.userOne;
  }
}