import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectContextService } from '../../../core/services/project-context.service';
import { AiInputComponent } from '../../../shared/components/ai-input/ai-input';
import { ProjectSelectComponent } from '../../../shared/components/project-select/project-select';
import { Project } from '../../../core/models/project.model';

interface TimeCategory { id: number; name: string; }

const CATEGORIES: TimeCategory[] = [
  { id: 0, name: 'Umsetzung' },
  { id: 0, name: 'Büro' },
  { id: 0, name: 'Pause' },
  { id: 0, name: 'Fahrzeit' },
  { id: 0, name: 'Notdienst' },
  { id: 0, name: 'Kundendienst' },
  { id: 0, name: 'Abnahme' },
  { id: 0, name: 'Besprechung' },
  { id: 0, name: 'Aufmaß-Termin' },
];
// TODO: IDs via HERO Query ermitteln: { tracking_times_categories { id name } }
type Step = 'form' | 'success' | 'error';

@Component({
  selector: 'app-time-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AiInputComponent, ProjectSelectComponent],
  template: `
    <div class="app-container">
      <div class="px-3 py-3 d-flex align-items-center border-bottom">
        <button class="btn btn-link ps-0 text-muted me-2" (click)="goBack()">
          <i class="bi bi-arrow-left fs-5"></i>
        </button>
        <h1 class="h5 fw-bold mb-0">Zeiterfassung</h1>
      </div>

      <!-- Projekt-Kontext-Banner -->
      <div *ngIf="contextProject" class="px-3 py-2 d-flex align-items-center justify-content-between" style="background:#e8f0fe; border-bottom:1px solid #c5d8fc">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-folder2-open text-primary"></i>
          <div>
            <div class="fw-semibold" style="font-size:.85rem">{{ contextProject.name }}</div>
            <div class="text-muted" style="font-size:.72rem">Projekt vorausgewählt</div>
          </div>
        </div>
        <button class="btn btn-link btn-sm text-muted p-0" (click)="clearContext()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <div class="p-3 pb-5">
        <ng-container *ngIf="step === 'form'">

          <!-- KI-Eingabe (oben, auffällig) -->
          <div class="card mb-4 border-0" style="background:#f0f4ff">
            <div class="card-body p-3">
              <div class="fw-semibold mb-1"><i class="bi bi-magic me-1"></i>KI-Schnelleingabe</div>
              <div class="text-muted small mb-2">Beschreibe deine Arbeitszeit, die KI füllt das Formular aus.</div>
              <app-ai-input
                placeholder="7 bis 16 Uhr, Pause 30 Min., SAN-123"
                [isLoading]="aiLoading"
                (textSubmit)="onAiParse($event)">
              </app-ai-input>
            </div>
          </div>

          <!-- Formular -->
          <div class="mb-3">
            <label class="form-label fw-semibold"><i class="bi bi-calendar3 me-1"></i>Datum</label>
            <input type="date" class="form-control form-control-lg" [(ngModel)]="workDate">
          </div>

          <app-project-select *ngIf="!contextProject" [(ngModel)]="selectedProject"></app-project-select>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label fw-semibold"><i class="bi bi-play-circle me-1"></i>Arbeitsbeginn</label>
              <input type="time" class="form-control form-control-lg" [(ngModel)]="startTime">
            </div>
            <div class="col-6">
              <label class="form-label fw-semibold"><i class="bi bi-stop-circle me-1"></i>Arbeitsende</label>
              <input type="time" class="form-control form-control-lg" [(ngModel)]="endTime">
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold"><i class="bi bi-cup-hot me-1"></i>Pause (Minuten)</label>
            <input type="number" class="form-control" min="0" step="15" [(ngModel)]="breakMinutes">
          </div>

          <!-- Netto-Arbeitszeit (live berechnet) -->
          <div class="mb-3 p-3 rounded" style="background:#f8f9fa">
            <div class="d-flex justify-content-between">
              <span class="text-muted">Netto-Arbeitszeit</span>
              <span class="fw-bold fs-5">{{ netHours | number:'1.1-2' }} Std.</span>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Kategorie</label>
            <select class="form-select" [(ngModel)]="categoryId">
              <option [value]="0">-- Bitte wählen --</option>
              <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold">Kommentar (optional)</label>
            <input type="text" class="form-control" placeholder="z.B. Überstunden wegen Wasserschaden" [(ngModel)]="comment">
          </div>

          <div *ngIf="errorMsg" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMsg }}
          </div>

          <button class="btn btn-primary w-100 btn-lg mt-2"
                  (click)="saveTime()"
                  [disabled]="saving || !canSave">
            <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!saving" class="bi bi-cloud-check me-1"></i>
            Zeit speichern
          </button>
        </ng-container>

        <!-- Erfolg -->
        <ng-container *ngIf="step === 'success'">
          <div class="text-center py-5">
            <div style="font-size:4rem">✅</div>
            <h2 class="h4 fw-bold mt-3">Zeit gespeichert!</h2>
            <p class="text-muted">{{ netHours | number:'1.1-2' }} Stunden wurden in HERO eingetragen.</p>
            <div class="d-flex gap-2 justify-content-center mt-4">
              <button class="btn btn-outline-primary" (click)="reset()">
                <i class="bi bi-plus-circle me-1"></i>Neue Zeiterfassung
              </button>
              <a routerLink="/dashboard" class="btn btn-primary">
                <i class="bi bi-house me-1"></i>Dashboard
              </a>
            </div>
          </div>
        </ng-container>

        <!-- Fehler -->
        <ng-container *ngIf="step === 'error'">
          <div class="text-center py-5">
            <div style="font-size:4rem">❌</div>
            <h2 class="h4 fw-bold mt-3">Fehler beim Speichern</h2>
            <p class="text-muted">{{ errorMsg }}</p>
            <button class="btn btn-outline-secondary mt-3" (click)="step = 'form'">
              <i class="bi bi-arrow-left me-1"></i>Zurück
            </button>
          </div>
        </ng-container>
      </div>
    </div>
  `
})
export class TimeNewComponent implements OnInit {
  step: Step = 'form';
  workDate = new Date().toISOString().split('T')[0];
  selectedProject: Project | null = null;
  contextProject: Project | null = null;
  startTime = '';
  endTime = '';
  breakMinutes = 0;
  categoryId = 0;
  comment = '';
  aiLoading = false;
  saving = false;
  errorMsg = '';

  categories: TimeCategory[] = CATEGORIES;

  get netHours(): number {
    if (!this.startTime || !this.endTime) return 0;
    const [sh, sm] = this.startTime.split(':').map(Number);
    const [eh, em] = this.endTime.split(':').map(Number);
    const total = (eh * 60 + em) - (sh * 60 + sm) - (this.breakMinutes || 0);
    return Math.max(0, total / 60);
  }

  get canSave(): boolean {
    return !!this.selectedProject && !!this.startTime && !!this.endTime && this.netHours > 0;
  }

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ctx: ProjectContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const p = this.ctx.currentProject();
    if (p) { this.contextProject = p; this.selectedProject = p; }
  }

  goBack(): void {
    this.contextProject ? this.router.navigate(['/project']) : this.router.navigate(['/dashboard']);
  }

  clearContext(): void {
    this.contextProject = null;
    this.selectedProject = null;
  }

  onAiParse(raw: string): void {
    this.aiLoading = true;
    this.errorMsg = '';
    this.api.parseTime({ raw_input: raw }).subscribe({
      next: res => {
        if (res.start) this.startTime = res.start;
        if (res.end) this.endTime = res.end;
        if (res.break_minutes != null) this.breakMinutes = res.break_minutes;
        this.aiLoading = false;
      },
      error: () => {
        this.aiLoading = false;
        this.errorMsg = 'KI-Parsing fehlgeschlagen. Bitte manuell ausfüllen.';
      }
    });
  }

  saveTime(): void {
    if (!this.selectedProject) return;
    this.saving = true;
    this.errorMsg = '';
    this.api.saveTime({
      project_match_id: this.selectedProject.id,
      work_date: this.workDate,
      start_time: this.startTime,
      end_time: this.endTime,
      break_minutes: this.breakMinutes,
      category_id: this.categoryId,
      comment: this.comment
    }).subscribe({
      next: res => {
        this.saving = false;
        if (res.success) {
          this.step = 'success';
        } else {
          this.errorMsg = res.error ?? 'Unbekannter Fehler.';
          this.step = 'error';
        }
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'Zeit konnte nicht gespeichert werden. Bitte erneut versuchen.';
        this.step = 'error';
      }
    });
  }

  reset(): void {
    this.step = 'form';
    this.startTime = '';
    this.endTime = '';
    this.breakMinutes = 0;
    this.comment = '';
    this.errorMsg = '';
    this.workDate = new Date().toISOString().split('T')[0];
  }
}
