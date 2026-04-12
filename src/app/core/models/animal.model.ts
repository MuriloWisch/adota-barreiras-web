import { User } from './user.model';
import { AnimalImage } from './animal-image.model';

export type Species    = 'DOG' | 'CAT' | 'OTHER';
export type AnimalSize = 'SMALL' | 'MEDIUM' | 'LARGE';
export type Sex        = 'MALE' | 'FEMALE';
export type AnimalStatus = 'EM_ANALISE' | 'AVAILABLE' | 'IN_PROCESS' | 'ADOPTED';

export interface Animal {
  id: number;
  name: string;
  species: Species;
  age: number;
  size: AnimalSize;
  sex: Sex;
  description: string;
  status: AnimalStatus;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  owner: User;
  images: AnimalImage[];
}