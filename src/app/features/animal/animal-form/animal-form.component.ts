import {
  Component, OnInit, signal, ElementRef, ViewChild, HostListener
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
import { GoogleMapsModule } from '@angular/google-maps';
import { trigger, transition, style, animate } from '@angular/animations';

import { AnimalService } from '../../../core/services/animal.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { Animal } from '../../../core/models/animal.model';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { ScrollAnimationDirective } from '../../../shared/directives/scroll-animation.directive';

interface ImagePreview {
  url: string;
  file: File | null;
  existing: boolean;
  existingUrl?: string;
}

const BARREIRAS_LAT = -12.1539;
const BARREIRAS_LNG = -44.9986;

@Component({
  selector: 'app-animal-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatButtonToggleModule,
    MatFormFieldModule, MatInputModule,
    MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, GoogleMapsModule,
    PageHeaderComponent, LoadingSpinnerComponent, ScrollAnimationDirective,
  ],
  animations: [
    trigger('fadeSlideUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <div class="page-wrap">

      <app-page-header
        [title]="isEditMode ? 'Editar Animal' : 'Cadastrar Animal'"
        [subtitle]="isEditMode ? 'Atualize as informações do seu animal' : 'Preencha os dados para cadastrar um animal para adoção'">
      </app-page-header>

      <!-- Skeleton -->
      <div class="skeleton-card" *ngIf="pageLoading">
        <div class="skel skel-title"></div>
        <div class="skel skel-field"></div>
        <div class="skel skel-field"></div>
        <div class="skel skel-field short"></div>
      </div>

      <!-- Form Card -->
      <div class="form-card" *ngIf="!pageLoading" @fadeSlideUp>

        <!-- Global error -->
        <div class="form-error" *ngIf="globalError">
          <mat-icon>error_outline</mat-icon>
          <span>{{ globalError }}</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()">

          <!-- ══ SEÇÃO 1: Informações básicas ══ -->
          <div class="form-section" appScrollAnimation>
            <h2 class="section-title">
              <span class="section-num">1</span> Informações básicas
            </h2>

            <div class="field-grid">

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nome do animal</mat-label>
                <input matInput formControlName="name" placeholder="Ex: Rex, Mimi...">
                <mat-icon matSuffix>pets</mat-icon>
                <mat-error>Nome é obrigatório</mat-error>
              </mat-form-field>

              <div class="toggle-field">
                <span class="toggle-label">Espécie *</span>
                <mat-button-toggle-group formControlName="species" class="toggle-group">
                  <mat-button-toggle value="DOG">🐶 Cachorro</mat-button-toggle>
                  <mat-button-toggle value="CAT">🐱 Gato</mat-button-toggle>
                  <mat-button-toggle value="OTHER">🐾 Outro</mat-button-toggle>
                </mat-button-toggle-group>
                <span class="toggle-error" *ngIf="form.get('species')?.invalid && form.get('species')?.touched">
                  Espécie é obrigatória
                </span>
              </div>

              <div class="toggle-field">
                <span class="toggle-label">Sexo *</span>
                <mat-button-toggle-group formControlName="sex" class="toggle-group">
                  <mat-button-toggle value="MALE">♂ Macho</mat-button-toggle>
                  <mat-button-toggle value="FEMALE">♀ Fêmea</mat-button-toggle>
                </mat-button-toggle-group>
                <span class="toggle-error" *ngIf="form.get('sex')?.invalid && form.get('sex')?.touched">
                  Sexo é obrigatório
                </span>
              </div>

              <div class="toggle-field">
                <span class="toggle-label">Porte *</span>
                <mat-button-toggle-group formControlName="size" class="toggle-group">
                  <mat-button-toggle value="SMALL">Pequeno</mat-button-toggle>
                  <mat-button-toggle value="MEDIUM">Médio</mat-button-toggle>
                  <mat-button-toggle value="LARGE">Grande</mat-button-toggle>
                </mat-button-toggle-group>
                <span class="toggle-error" *ngIf="form.get('size')?.invalid && form.get('size')?.touched">
                  Porte é obrigatório
                </span>
              </div>

              <mat-form-field appearance="outline" style="max-width:180px">
                <mat-label>Idade</mat-label>
                <input matInput formControlName="age" type="number" min="0" max="30">
                <span matSuffix class="suffix-text">anos</span>
                <mat-error>Idade inválida</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Descrição</mat-label>
                <textarea
                  matInput
                  formControlName="description"
                  rows="4"
                  maxlength="500"
                  placeholder="Conte sobre a personalidade, hábitos e necessidades do animal...">
                </textarea>
                <mat-hint align="end">{{ form.get('description')?.value?.length ?? 0 }}/500</mat-hint>
              </mat-form-field>

            </div>
          </div>

          <mat-divider class="section-divider"></mat-divider>

          <!-- ══ SEÇÃO 2: Imagens ══ -->
          <div class="form-section" appScrollAnimation>
            <h2 class="section-title">
              <span class="section-num">2</span> Fotos do animal
            </h2>

            <!-- Drop zone -->
            <div
              class="drop-zone"
              [class.drag-over]="isDragOver"
              [class.has-error]="imageError"
              (dragover)="onDragOver($event)"
              (dragleave)="isDragOver = false"
              (drop)="onDrop($event)"
              (click)="fileInput.click()">
              <input
                #fileInput
                type="file"
                accept="image/*"
                multiple
                hidden
                (change)="onFileSelect($event)">
              <mat-icon class="upload-icon">cloud_upload</mat-icon>
              <p class="upload-title">Arraste as fotos aqui ou clique para selecionar</p>
              <p class="upload-sub">Mínimo 1, máximo 5 imagens • JPG, PNG, WEBP</p>
            </div>

            <p class="image-error" *ngIf="imageError">{{ imageError }}</p>

            <!-- Previews -->
            <div class="preview-grid" *ngIf="previews().length">
              <div class="preview-item" *ngFor="let p of previews(); let i = index">
                <img [src]="p.url" [alt]="'Foto ' + (i+1)">
                <button class="remove-btn" type="button" (click)="removeImage(i)">
                  <mat-icon>close</mat-icon>
                </button>
                <span class="existing-badge" *ngIf="p.existing">Atual</span>
              </div>
            </div>

          </div>

          <mat-divider class="section-divider"></mat-divider>

          <!-- ══ SEÇÃO 3: Localização ══ -->
          <div class="form-section" appScrollAnimation>
            <h2 class="section-title">
              <span class="section-num">3</span> Localização
            </h2>

            <div class="location-hint">
              <mat-icon>touch_app</mat-icon>
              <span>Clique no mapa para definir a localização exata do animal</span>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Endereço</mat-label>
              <input matInput formControlName="address" placeholder="Ex: Rua das Flores, 123 — Centro">
              <mat-icon matSuffix>place</mat-icon>
            </mat-form-field>

            <div class="map-container">
              <google-map
                width="100%"
                height="300px"
                [center]="mapCenter()"
                [zoom]="mapZoom"
                [options]="mapOptions"
                (mapClick)="onMapClick($event)">
                <map-marker
                  *ngIf="markerPos()"
                  [position]="markerPos()!"
                  [options]="markerOptions">
                </map-marker>
              </google-map>
            </div>

            <div class="coord-row">
              <mat-form-field appearance="outline">
                <mat-label>Latitude</mat-label>
                <input matInput formControlName="latitude" readonly>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Longitude</mat-label>
                <input matInput formControlName="longitude" readonly>
              </mat-form-field>
              <button mat-stroked-button type="button" class="geo-btn" (click)="useMyLocation()">
                <mat-icon>my_location</mat-icon> Minha localização
              </button>
            </div>

            <span class="coord-error" *ngIf="form.get('latitude')?.invalid && submitted">
              Localização no mapa é obrigatória
            </span>

          </div>

          <!-- ══ Footer Actions ══ -->
          <div class="form-footer">
            <button mat-stroked-button type="button" class="btn-cancel" (click)="cancel()">
              Cancelar
            </button>
            <button mat-raised-button type="submit" class="btn-save" [disabled]="saving">
              <mat-spinner diameter="18" *ngIf="saving"></mat-spinner>
              <mat-icon *ngIf="!saving">save</mat-icon>
              <span>{{ saving ? 'Salvando...' : 'Salvar' }}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-wrap {
      max-width: 820px;
      margin: 32px auto;
      padding: 0 24px 64px;
    }

    /* Skeleton */
    .skeleton-card {
      background: #fff; border-radius: 20px;
      padding: 32px; display: flex; flex-direction: column; gap: 16px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    }
    .skel {
      background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: 8px;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .skel-title { height:28px; width:40%; }
    .skel-field { height:56px; }
    .skel-field.short { width:50%; }

    /* Card */
    .form-card {
      background: #fff;
      border-radius: 20px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.07);
      overflow: hidden;
    }

    /* Global error */
    .form-error {
      display: flex; align-items: center; gap: 10px;
      background: #fef2f2; color: #dc2626;
      padding: 14px 24px; font-size: 14px;
      border-bottom: 1px solid #fecaca;
    }

    /* Section */
    .form-section { padding: 32px 32px 24px; }
    .section-title {
      display: flex; align-items: center; gap: 12px;
      font-size: 18px; font-weight: 700;
      color: #1E3A5F; margin-bottom: 24px;
    }
    .section-num {
      width: 30px; height: 30px; border-radius: 50%;
      background: #4CAF50; color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    .section-divider { margin: 0 !important; }

    /* Fields */
    .field-grid { display: flex; flex-direction: column; gap: 16px; }
    .full-width  { width: 100%; }
    .suffix-text { font-size: 13px; color: #888; padding-right: 4px; }

    /* Toggles */
    .toggle-field { display: flex; flex-direction: column; gap: 6px; }
    .toggle-label { font-size: 12px; font-weight: 600; color: #666; text-transform: uppercase; letter-spacing: 0.4px; }
    .toggle-group { border-radius: 10px !important; overflow: hidden; }
    ::ng-deep .mat-button-toggle { font-size: 13px !important; font-family: 'Inter',sans-serif !important; }
    ::ng-deep .mat-button-toggle-checked { background: #4CAF50 !important; color: #fff !important; }
    .toggle-error { font-size: 12px; color: #f44336; margin-top: 2px; }

    /* Drop zone */
    .drop-zone {
      border: 2px dashed #d1d5db;
      border-radius: 16px;
      padding: 40px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
      margin-bottom: 16px;
    }
    .drop-zone:hover, .drop-zone.drag-over {
      border-color: #4CAF50;
      background: #f0fdf4;
    }
    .drop-zone.has-error { border-color: #ef4444; background: #fef2f2; }
    .upload-icon { font-size: 48px !important; width: 48px !important; height: 48px !important; color: #4CAF50; }
    .upload-title { font-size: 15px; font-weight: 600; color: #1E3A5F; margin: 10px 0 4px; }
    .upload-sub   { font-size: 12px; color: #999; }
    .image-error  { font-size: 13px; color: #ef4444; margin-bottom: 12px; }

    /* Previews */
    .preview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
    }
    .preview-item {
      position: relative; border-radius: 12px; overflow: hidden;
      aspect-ratio: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .preview-item img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .remove-btn {
      position: absolute; top: 4px; right: 4px;
      background: rgba(0,0,0,0.55); border: none; border-radius: 50%;
      width: 26px; height: 26px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #fff; transition: background 0.2s ease;
      padding: 0;
    }
    .remove-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .remove-btn:hover { background: rgba(239,68,68,0.85); }
    .existing-badge {
      position: absolute; bottom: 4px; left: 4px;
      background: rgba(76,175,80,0.85); color: #fff;
      font-size: 10px; font-weight: 700;
      padding: 2px 8px; border-radius: 20px;
    }

    /* Location */
    .location-hint {
      display: flex; align-items: center; gap: 8px;
      background: #eff6ff; color: #1d4ed8;
      padding: 10px 14px; border-radius: 10px;
      font-size: 13px; margin-bottom: 16px;
    }
    .location-hint mat-icon { font-size: 18px; }
    .map-container {
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      margin-bottom: 16px;
    }
    .coord-row {
      display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-start;
    }
    .coord-row mat-form-field { flex: 1; min-width: 140px; }
    .coord-error { font-size: 12px; color: #ef4444; margin-top: 4px; display: block; }
    .geo-btn {
      border-color: #1E3A5F !important; color: #1E3A5F !important;
      border-radius: 10px !important; height: 56px;
      font-size: 13px !important; white-space: nowrap;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease !important;
    }
    .geo-btn:hover { background: #f0f4ff !important; }

    /* Footer */
    .form-footer {
      display: flex; justify-content: flex-end; gap: 12px;
      padding: 20px 32px;
      background: #f8fafc;
      border-top: 1px solid #f0f0f0;
    }
    .btn-cancel {
      border-color: #d1d5db !important; color: #666 !important;
      border-radius: 12px !important; height: 46px;
      padding: 0 24px !important;
      transition: all 0.3s ease !important;
    }
    .btn-cancel:hover { background: #f1f5f9 !important; }
    .btn-save {
      background: #4CAF50 !important; color: #fff !important;
      border-radius: 12px !important; height: 46px;
      font-size: 15px !important; font-weight: 700 !important;
      padding: 0 28px !important;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.3s ease !important;
    }
    .btn-save:hover:not([disabled]) {
      background: #43A047 !important;
      box-shadow: 0 6px 20px rgba(76,175,80,0.35) !important;
    }

    /* Responsive */
    @media (max-width: 600px) {
      .form-section { padding: 24px 16px; }
      .form-footer  { padding: 16px; }
      .coord-row    { flex-direction: column; }
      .geo-btn      { width: 100%; justify-content: center; }
    }
  `],
})
export class AnimalFormComponent implements OnInit {

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  form!: FormGroup;
  isEditMode   = false;
  pageLoading  = false;
  saving       = false;
  submitted    = false;
  isDragOver   = false;
  globalError  = '';
  imageError   = '';

  previews     = signal<ImagePreview[]>([]);
  markerPos    = signal<google.maps.LatLngLiteral | null>(null);
  mapCenter    = signal<google.maps.LatLngLiteral>({ lat: BARREIRAS_LAT, lng: BARREIRAS_LNG });
  mapZoom      = 13;

  private editAnimalId?: number;

  mapOptions: google.maps.MapOptions = {
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
  };

  markerOptions: google.maps.MarkerOptions = {
    draggable: true,
    animation: google.maps.Animation.DROP,
  };

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
      age:         [null, [Validators.min(0), Validators.max(30)]],
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
    this.form.patchValue({
      name:        animal.name,
      species:     animal.species,
      sex:         animal.sex,
      size:        animal.size,
      age:         animal.age,
      description: animal.description,
      address:     animal.address,
      latitude:    animal.latitude,
      longitude:   animal.longitude,
    });

    if (animal.latitude && animal.longitude) {
      const pos = { lat: animal.latitude, lng: animal.longitude };
      this.markerPos.set(pos);
      this.mapCenter.set(pos);
    }

    if (animal.images?.length) {
      this.previews.set(animal.images.map(img => ({
        url: img.imageUrl,
        file: null,
        existing: true,
        existingUrl: img.imageUrl,
      })));
    }
  }

  // ── Map ────────────────────────────────────────────────────────────────────

  onMapClick(event: google.maps.MapMouseEvent): void {
    if (!event.latLng) return;
    const pos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
    this.markerPos.set(pos);
    this.form.patchValue({ latitude: pos.lat, longitude: pos.lng });
  }

  useMyLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      this.markerPos.set(p);
      this.mapCenter.set(p);
      this.form.patchValue({ latitude: p.lat, longitude: p.lng });
    });
  }

  // ── Images ─────────────────────────────────────────────────────────────────

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
      url: URL.createObjectURL(file),
      file,
      existing: false,
    }));

    this.previews.set([...current, ...newPreviews]);
  }

  removeImage(index: number): void {
    const updated = this.previews().filter((_, i) => i !== index);
    this.previews.set(updated);
    this.imageError = '';
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

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
      this.animalService.update(this.editAnimalId!, this.form.value).subscribe({
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
    const v  = this.form.value;

    fd.append('name',        v.name);
    fd.append('species',     v.species);
    fd.append('sex',         v.sex);
    fd.append('size',        v.size);
    fd.append('latitude',    String(v.latitude));
    fd.append('longitude',   String(v.longitude));
    if (v.age        != null) fd.append('age',         String(v.age));
    if (v.description)        fd.append('description', v.description);
    if (v.address)            fd.append('address',     v.address);
    files.forEach(f => fd.append('images', f, f.name));

    return fd;
  }

  cancel(): void {
    this.router.navigate(['/animals/my']);
  }
}