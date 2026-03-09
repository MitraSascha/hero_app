import { Component, OnInit, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Project } from '../../../core/models/project.model';

@Component({
  selector: 'app-project-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => ProjectSelectComponent),
    multi: true
  }],
  template: `
    <div class="mb-3">
      <label class="form-label fw-semibold">
        <i class="bi bi-building me-1"></i>Projekt
      </label>
      <select class="form-select form-select-lg"
              [(ngModel)]="selectedId"
              (ngModelChange)="onSelect($event)"
              [disabled]="loading">
        <option value="">-- Projekt wählen --</option>
        <option *ngFor="let p of projects" [value]="p.id">
          {{ p.name }}
        </option>
      </select>
      <div *ngIf="loading" class="text-muted small mt-1">
        <span class="spinner-border spinner-border-sm me-1"></span>Projekte werden geladen...
      </div>
      <div *ngIf="error" class="text-danger small mt-1">
        <i class="bi bi-exclamation-circle me-1"></i>{{ error }}
      </div>
    </div>
  `
})
export class ProjectSelectComponent implements OnInit, ControlValueAccessor {
  projects: Project[] = [];
  selectedId: number | string = '';
  loading = true;
  error = '';

  private onChange: (v: any) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getProjects().subscribe({
      next: data => { this.projects = data; this.loading = false; },
      error: () => { this.error = 'Projekte konnten nicht geladen werden.'; this.loading = false; }
    });
  }

  onSelect(id: any): void {
    const project = this.projects.find(p => p.id == id) || null;
    this.onChange(project);
    this.onTouched();
  }

  writeValue(project: Project | null): void {
    this.selectedId = project?.id ?? '';
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
}
