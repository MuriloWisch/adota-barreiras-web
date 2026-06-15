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
  templateUrl: './chat-list.component.html',
  styleUrls: ['./chat-list.component.scss'],
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