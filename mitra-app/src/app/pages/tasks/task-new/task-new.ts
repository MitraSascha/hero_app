import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ProjectContextService } from '../../../core/services/project-context.service';
import { ProjectSelectComponent } from '../../../shared/components/project-select/project-select';
import { Project } from '../../../core/models/project.model';

type Step = 'form' | 'success' | 'error';

@Component({
  selector: 'app-task-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ProjectSelectComponent],
  template: `
    <div class="app-container">
      <div class="px-3 py-3 d-flex align-items-center border-bottom">
        <button class="btn btn-link ps-0 text-muted me-2" (click)="goBack()">
          <i class="bi bi-arrow-left fs-5"></i>
        </button>
        <h1 class="h5 fw-bold mb-0">Aufgabe erstellen</h1>
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

          <div class="mb-3">
            <label class="form-label fw-semibold"><i class="bi bi-card-heading me-1"></i>Titel</label>
            <input type="text" class="form-control form-control-lg"
                   placeholder="Kurze Beschreibung der Aufgabe"
                   [(ngModel)]="title">
          </div>

          <app-project-select *ngIf="!contextProject" [(ngModel)]="selectedProject"></app-project-select>

          <div class="mb-3">
            <label class="form-label fw-semibold"><i class="bi bi-text-left me-1"></i>Beschreibung (optional)</label>
            <textarea class="form-control" rows="3"
                      placeholder="Details zur Aufgabe..."
                      [(ngModel)]="description">
            </textarea>
          </div>

          <div class="mb-3">
            <label class="form-label fw-semibold"><i class="bi bi-calendar-event me-1"></i>Fälligkeitsdatum</label>
            <input type="date" class="form-control" [(ngModel)]="dueDate">
          </div>

          <div *ngIf="errorMsg" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMsg }}
          </div>

          <button class="btn btn-primary w-100 btn-lg mt-2"
                  (click)="createTask()"
                  [disabled]="saving || !title.trim() || !selectedProject">
            <span *ngIf="saving" class="spinner-border spinner-border-sm me-2"></span>
            <i *ngIf="!saving" class="bi bi-plus-circle me-1"></i>
            Aufgabe erstellen
          </button>
        </ng-container>

        <ng-container *ngIf="step === 'success'">
          <div class="text-center py-5">
            <div style="font-size:4rem">✅</div>
            <h2 class="h4 fw-bold mt-3">Aufgabe erstellt!</h2>
            <p class="text-muted">Die Aufgabe wurde in HERO angelegt.</p>
            <div class="d-flex gap-2 justify-content-center mt-4">
              <button class="btn btn-outline-primary" (click)="reset()">
                <i class="bi bi-plus-circle me-1"></i>Neue Aufgabe
              </button>
              <a routerLink="/dashboard" class="btn btn-primary">
                <i class="bi bi-house me-1"></i>Dashboard
              </a>
            </div>
          </div>
        </ng-container>

        <ng-container *ngIf="step === 'error'">
          <div class="text-center py-5">
            <div style="font-size:4rem">❌</div>
            <h2 class="h4 fw-bold mt-3">Fehler</h2>
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
export class TaskNewComponent implements OnInit {
  step: Step = 'form';
  title = '';
  description = '';
  dueDate = '';
  selectedProject: Project | null = null;
  contextProject: Project | null = null;
  saving = false;
  errorMsg = '';

  constructor(
    private api: ApiService,
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

  createTask(): void {
    if (!this.selectedProject || !this.title.trim()) return;
    this.saving = true;
    this.errorMsg = '';
    this.api.createTask({
      title: this.title.trim(),
      description: this.description || undefined,
      project_match_id: this.selectedProject.id,
      due_date: this.dueDate || undefined
    }).subscribe({
      next: res => {
        this.saving = false;
        if (res.success) this.step = 'success';
        else { this.errorMsg = 'Aufgabe konnte nicht erstellt werden.'; this.step = 'error'; }
      },
      error: () => {
        this.saving = false;
        this.errorMsg = 'Aufgabe konnte nicht erstellt werden. Bitte erneut versuchen.';
        this.step = 'error';
      }
    });
  }

  reset(): void {
    this.step = 'form';
    this.title = '';
    this.description = '';
    this.dueDate = '';
    this.selectedProject = null;
    this.errorMsg = '';
  }
}
