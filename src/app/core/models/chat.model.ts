import { User } from './user.model';
import { Animal } from './animal.model';

export interface Chat {
  id: number;
  userOne: User;
  userTwo: User;
  animal: Animal;
  createdAt: string;
}