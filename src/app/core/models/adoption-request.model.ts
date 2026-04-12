import { Animal } from './animal.model';
import { User } from './user.model';

export type AdoptionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface AdoptionRequest {
  id: number;
  status: AdoptionStatus;
  animal: Animal;
  requester: User;
  createdAt: string;
}