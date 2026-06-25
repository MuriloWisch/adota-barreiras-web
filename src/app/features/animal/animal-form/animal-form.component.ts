import {
  Component, OnInit, signal, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { trigger, transition, style, animate } from '@angular/animations';

import { AnimalService } from '../../../core/services/animal.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Animal } from '../../../core/models/animal.model';
import { MapComponent } from '../../../shared/components/map/map.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';

interface ImagePreview {
  url:         string;
  file:        File | null;
  existing:    boolean;
  existingUrl?: string;
}

type AgeUnit = 'YEARS' | 'MONTHS';

const BARREIRAS_LAT = -12.1539;
const BARREIRAS_LNG = -44.9986;

@Component({
  selector: 'app-animal-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MapComponent,
    PageHeaderComponent,
    ScrollAnimationDirective,
  ],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  templateUrl: './animal-form.component.html',
  styleUrls: ['./animal-form.component.scss'],
})
export class AnimalFormComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form!:       FormGroup;
  isEditMode   = false;
  pageLoading  = false;
  saving       = false;
  submitted    = false;
  isDragOver   = false;
  globalError  = '';
  imageError   = '';


  previews      = signal<ImagePreview[]>([]);
  markerAnimal  = signal<Animal[]>([]);
  mapCenterLat  = signal(BARREIRAS_LAT);
  mapCenterLng  = signal(BARREIRAS_LNG);
  mapZoom       = 13;

  private editAnimalId?: number;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private animalService: AnimalService,
    private auth: AuthService,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.buildForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id && !isNaN(+id)) {
      this.isEditMode   = true;
      this.editAnimalId = +id;
      this.pageLoading  = true;
      this.loadAnimal(+id);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:        ['', Validators.required],
      species:     ['', Validators.required],
      sex:         ['', Validators.required],
      size:        ['', Validators.required],
      ageValue:    [null, [Validators.min(0), Validators.max(360)]],
      ageUnit:     ['YEARS' as AgeUnit],
      description: ['', Validators.maxLength(500)],
      address:     [''],
      latitude:    [null, Validators.required],
      longitude:   [null, Validators.required],
    });
  }

  private loadAnimal(id: number): void {
    this.animalService.getById(id).subscribe({
      next: animal => {
        const me = this.auth.currentUser$.getValue();
        if (me && me.id !== animal.owner?.id) {
          this.router.navigate(['/home']);
          return;
        }
        this.populateForm(animal);
        this.pageLoading = false;
      },
      error: () => {
        this.snackBar.open('Animal não encontrado.', 'Fechar', { duration: 3000 });
        this.router.navigate(['/home']);
      },
    });
  }

  private populateForm(animal: Animal): void {
    const ageParts = this.toAgeParts(animal.age);

    this.form.patchValue({
      name:        animal.name,
      species:     animal.species,
      sex:         animal.sex,
      size:        animal.size,
      ageValue:    ageParts.value,
      ageUnit:     ageParts.unit,
      description: animal.description,
      address:     animal.address,
      latitude:    animal.latitude,
      longitude:   animal.longitude,
    });

    if (animal.latitude && animal.longitude) {
      this.mapCenterLat.set(animal.latitude);
      this.mapCenterLng.set(animal.longitude);
      this.markerAnimal.set([{ ...animal }]);
    }

    if (animal.images?.length) {
      this.previews.set(animal.images.map(img => ({
        url:         img.imageUrl,
        file:        null,
        existing:    true,
        existingUrl: img.imageUrl,
      })));
    }
  }



  onMapClick(pos: { lat: number; lng: number }): void {
    this.form.patchValue({ latitude: pos.lat, longitude: pos.lng });
    this.mapCenterLat.set(pos.lat);
    this.mapCenterLng.set(pos.lng);
    this.markerAnimal.set([{
      id: 0, name: 'Local selecionado',
      latitude: pos.lat, longitude: pos.lng,
      status: 'AVAILABLE', images: [],
    } as any]);
  }

  useMyLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      this.form.patchValue({ latitude: lat, longitude: lng });
      this.mapCenterLat.set(lat);
      this.mapCenterLng.set(lng);
      this.markerAnimal.set([{
        id: 0, name: 'Minha localização',
        latitude: lat, longitude: lng,
        status: 'AVAILABLE', images: [],
      } as any]);
    });
  }

  

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = true;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver = false;
    const files = Array.from(e.dataTransfer?.files ?? []);
    this.addFiles(files);
  }

  onFileSelect(e: Event): void {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.addFiles(files);
    input.value = '';
  }

  private addFiles(files: File[]): void {
    this.imageError = '';
    const current = this.previews();
    const total   = current.length + files.length;

    if (total > 5) {
      this.imageError = `Máximo 5 imagens. Você já tem ${current.length} selecionada(s).`;
      return;
    }

    const newPreviews: ImagePreview[] = files.map(file => ({
      url:      URL.createObjectURL(file),
      file,
      existing: false,
    }));

    this.previews.set([...current, ...newPreviews]);
  }

  removeImage(index: number): void {
    this.previews.set(this.previews().filter((_, i) => i !== index));
    this.imageError = '';
  }



  submit(): void {
    this.submitted   = true;
    this.globalError = '';
    this.imageError  = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const newFiles = this.previews().filter(p => !p.existing).map(p => p.file!);

    if (!this.isEditMode && newFiles.length === 0) {
      this.imageError = 'Adicione pelo menos 1 imagem.';
      return;
    }

    this.saving = true;

    if (this.isEditMode) {
      this.animalService.update(this.editAnimalId!, this.buildPayload()).subscribe({
        next: animal => {
          this.snackBar.open('Animal atualizado com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/animals', animal.id]);
        },
        error: err => {
          this.globalError = err?.error?.message ?? 'Erro ao atualizar animal.';
          this.saving = false;
        },
      });
    } else {
      const fd = this.buildFormData(newFiles);
      this.animalService.create(fd).subscribe({
        next: animal => {
          this.snackBar.open('Animal cadastrado com sucesso!', 'Fechar', { duration: 3000 });
          this.router.navigate(['/animals', animal.id]);
        },
        error: err => {
          this.globalError = err?.error?.message ?? 'Erro ao cadastrar animal.';
          this.saving = false;
        },
      });
    }
  }

  private buildFormData(files: File[]): FormData {
  const fd = new FormData();
  const v = this.buildPayload();

  // obrigatórios (com validação defensiva)
  if (!v.name || !v.species || !v.sex || !v.size) {
    throw new Error('Campos obrigatórios não preenchidos');
  }

  fd.append('name', v.name);
  fd.append('species', v.species);
  fd.append('sex', v.sex);
  fd.append('size', v.size);

  // números obrigatórios convertidos com segurança
  if (v.latitude == null || v.longitude == null) {
    throw new Error('Coordenadas inválidas');
  }

  fd.append('latitude', String(v.latitude));
  fd.append('longitude', String(v.longitude));

  // opcionais
  if (v.age != null) {
    fd.append('age', String(v.age));
  }

  if (v.description?.trim()) {
    fd.append('description', v.description);
  }

  if (v.address?.trim()) {
    fd.append('address', v.address);
  }

  // arquivos (validação leve)
  if (!files?.length) {
    throw new Error('Nenhuma imagem enviada');
  }

  files.forEach(file => {
    fd.append('images', file, file.name);
  });

  return fd;
}

  private buildPayload(): Partial<Animal> {
    const v = this.form.value;
    const age = this.toStoredAge(v.ageValue, v.ageUnit);

    return {
      name: v.name,
      species: v.species,
      sex: v.sex,
      size: v.size,
      latitude: v.latitude,
      longitude: v.longitude,
      ...(age != null ? { age } : {}),
      ...(v.description ? { description: v.description } : {}),
      ...(v.address ? { address: v.address } : {}),
    };
  }

  private toStoredAge(value: number | string | null, unit: AgeUnit): number | null {
    if (value === null || value === '') return null;

    const numeric = Number(value);
    if (Number.isNaN(numeric)) return null;

    if (unit === 'MONTHS') {
      return Number((numeric / 12).toFixed(2));
    }

    return numeric;
  }

  private toAgeParts(age: number | null | undefined): { value: number | null; unit: AgeUnit } {
    if (age == null) return { value: null, unit: 'YEARS' };
    if (age > 0 && age < 1) return { value: Math.max(1, Math.round(age * 12)), unit: 'MONTHS' };
    return { value: age, unit: 'YEARS' };
  }

  cancel(): void {
    this.router.navigate(['/animals/my']);
  }
}
