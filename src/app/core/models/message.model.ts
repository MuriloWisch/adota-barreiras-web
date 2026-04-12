import { User } from './user.model';

export interface Message {
  id: number;
  content: string;
  timestamp: string;
  sender: User;
  chatId: number;
}