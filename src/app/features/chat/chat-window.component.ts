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
  templateUrl: './chat-window.component.html',
  styleUrls: ['./chat-window.component.scss'],
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
    this.inputText    = '';
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
  const msgs = this.messages ?? [];

  for (const msg of msgs) {
    if (!msg?.timestamp) continue;
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