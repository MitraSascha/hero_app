import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProjectContextService } from '../../../core/services/project-context.service';
import { AiInputComponent } from '../../../shared/components/ai-input/ai-input';
import { ProjectSelectComponent } from '../../../shared/components/project-select/project-select';
import { PositionPickerComponent } from '../../../shared/components/position-picker/position-picker';
import { Project } from '../../../core/models/project.model';
import { ReportTimeEntry } from '../../../core/models/report.model';
import { MaterialItem, SelectedPosition } from '../../../core/models/material.model';
import { catchError, of } from 'rxjs';

type Step = 'form' | 'preview' | 'success' | 'error';

// Kundendienst/Baustellenmonteur – feste HERO-Position für Arbeitsstunden (ID aus HERO)
const KUNDENDIENST: MaterialItem = {
  id: '441376',
  name: 'Kundendienst/Baustellenmonteur',
  number: '',
  description: '',
  unit: 'Std.',
  type: 'leistung',
};

@Component({
  selector: 'app-report-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, AiInputComponent, ProjectSelectComponent, PositionPickerComponent],
  template: `
    <div class="app-container">

      <!-- ─── HEADER ─── -->
      <div class="px-3 py-3 d-flex align-items-center border-bottom" style="background:#fff; flex-shrink:0">
        <button class="btn btn-link ps-0 text-muted me-2" (click)="goBack()">
          <i class="bi bi-arrow-left fs-5"></i>
        </button>
        <h1 class="h5 fw-bold mb-0">Baustellenbericht</h1>
      </div>

      <!-- ─── PROJEKT-KONTEXT-BANNER ─── -->
      <div *ngIf="contextProject"
           class="px-3 py-2 d-flex align-items-center justify-content-between"
           style="background:#e8f0fe; border-bottom:1px solid #c5d8fc; flex-shrink:0">
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

      <div class="overflow-auto flex-grow-1 p-3 pb-5">

        <!-- ══════════════════════════════════════
             SCHRITT 1: FORMULAR
        ══════════════════════════════════════ -->
        <ng-container *ngIf="step() === 'form'">

          <!-- Datum -->
          <div class="mb-3">
            <label class="form-label fw-semibold"><i class="bi bi-calendar3 me-1"></i>Datum</label>
            <input type="date" class="form-control form-control-lg" [(ngModel)]="reportDate">
          </div>

          <!-- Projekt (nur wenn kein Kontext) -->
          <app-project-select *ngIf="!contextProject" [(ngModel)]="selectedProject"></app-project-select>

          <!-- ─── ZEITERFASSUNG AUSWÄHLEN ─── -->
          <div class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <label class="form-label fw-semibold mb-0">
                <i class="bi bi-clock me-1"></i>Zeiterfassung einbeziehen
              </label>
              <span class="badge bg-secondary">{{ selectedTimeEntries.length }} gewählt</span>
            </div>

            <!-- Ladeindikator -->
            <div *ngIf="loadingTimes" class="text-muted small py-2">
              <span class="spinner-border spinner-border-sm me-1"></span>Zeiten werden geladen...
            </div>

            <!-- Keine Zeiten -->
            <div *ngIf="!loadingTimes && timeEntries().length === 0"
                 class="text-muted small p-2 rounded" style="background:#f8f9fa">
              <i class="bi bi-info-circle me-1"></i>
              Noch keine Zeiterfassung für dieses Projekt heute.
              <a [routerLink]="['/time/new']" class="ms-1 text-primary">Jetzt erfassen →</a>
            </div>

            <!-- Zeiteinträge-Liste -->
            <div *ngFor="let entry of timeEntries()"
                 class="time-entry-item"
                 [class.time-entry-item--selected]="isTimeSelected(entry)"
                 (click)="toggleTime(entry)">
              <div class="d-flex align-items-center gap-2">
                <div class="time-checkbox">
                  <i class="bi" [class.bi-check-circle-fill]="isTimeSelected(entry)"
                                [class.bi-circle]="!isTimeSelected(entry)"></i>
                </div>
                <div class="flex-grow-1">
                  <div class="fw-semibold" style="font-size:.9rem">
                    {{ entry.start_time }} – {{ entry.end_time }}
                    <span class="ms-1 text-muted fw-normal">({{ entry.net_hours | number:'1.1-1' }} Std.)</span>
                  </div>
                  <div class="text-muted" style="font-size:.78rem">
                    {{ entry.employee_name }}<span *ngIf="entry.comment"> · {{ entry.comment }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── POSITIONEN ─── -->
          <div class="mb-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <label class="form-label fw-semibold mb-0">
                <i class="bi bi-list-ul me-1"></i>Positionen
              </label>
              <span class="badge bg-secondary" *ngIf="selectedPositions.length">{{ selectedPositions.length }}</span>
            </div>

            <!-- Hinzugefügte Positionen -->
            <div *ngFor="let pos of selectedPositions; let i = index; let first = first; let last = last"
                 class="position-card mb-2">
              <div class="d-flex align-items-center gap-2">

                <!-- Sortier-Buttons -->
                <div class="sort-btns">
                  <button class="sort-btn" (click)="movePosition(i, -1)" [disabled]="first" title="Nach oben">
                    <i class="bi bi-chevron-up"></i>
                  </button>
                  <button class="sort-btn" (click)="movePosition(i, 1)" [disabled]="last" title="Nach unten">
                    <i class="bi bi-chevron-down"></i>
                  </button>
                </div>

                <!-- Inhalt -->
                <div class="flex-grow-1 min-w-0">
                  <div class="d-flex align-items-start justify-content-between">
                    <div class="fw-semibold text-truncate" style="font-size:.9rem">{{ pos.item.name }}</div>
                    <button class="btn btn-link text-danger p-0 ms-2 flex-shrink-0" (click)="removePosition(i)">
                      <i class="bi bi-trash3"></i>
                    </button>
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="text-muted" style="font-size:.78rem">{{ pos.item.unit ?? 'pauschal' }}</span>
                    <div class="qty-control ms-auto">
                      <button class="qty-btn" (click)="changeQty(i, -1)">−</button>
                      <span class="qty-value">{{ pos.quantity | number:'1.1-1' }}</span>
                      <button class="qty-btn" (click)="changeQty(i, 1)">+</button>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <!-- Button -->
            <button type="button" class="btn-positionen w-100" (click)="showPicker = true">
              POSITIONEN HINZUFÜGEN
            </button>
          </div>

          <!-- ─── KI-EINGABE ─── -->
          <div class="mb-3">
            <label class="form-label fw-semibold">
              <i class="bi bi-magic me-1"></i>Was wurde gemacht?
              <span class="text-muted fw-normal small ms-1">→ wird zu Kopftext</span>
            </label>
            <div class="kopftext-hint mb-2">
              <i class="bi bi-info-circle me-1"></i>
              Der KI-Text wird in das Feld <strong>„Kopftext"</strong> der HERO-Vorlage eingefügt.
              Alle anderen Felder (Projekt, Kunde, Datum) füllt HERO automatisch aus.
            </div>
            <app-ai-input
              placeholder="Rohre verlegt, Wasser läuft, morgen Putz..."
              [isLoading]="aiLoading()"
              (textSubmit)="onAiSubmit($event)"
              (voiceResult)="rawInput = $event">
            </app-ai-input>
          </div>

          <div *ngIf="errorMsg" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMsg() }}
          </div>
        </ng-container>

        <!-- ══════════════════════════════════════
             SCHRITT 2: VORSCHAU & BEARBEITEN
        ══════════════════════════════════════ -->
        <ng-container *ngIf="step() === 'preview'">

          <!-- Dokument-Vorschau -->
          <div class="doc-preview mb-3">

            <!-- Projektinfo (von HERO automatisch befüllt) -->
            <div class="doc-meta">
              <div class="text-muted small">Projekt, Kunde, Adresse und Datum werden automatisch von HERO übernommen.</div>
            </div>

            <!-- Ausgeführte Arbeiten -->
            <div class="doc-section">
              <div class="doc-section-title">Ausgeführte Arbeiten</div>
              <textarea
                class="doc-textarea"
                rows="7"
                [ngModel]="generatedText()"
                (ngModelChange)="generatedText.set($event)"
                placeholder="KI-generierter Text erscheint hier...">
              </textarea>
            </div>

            <!-- Positionstabelle -->
            <div class="doc-section" *ngIf="selectedPositions.length">
              <div class="doc-section-title">Positionen</div>
              <table class="doc-table">
                <thead>
                  <tr>
                    <th>Pos</th>
                    <th>Menge</th>
                    <th>Bezeichnung</th>
                    <th class="text-end">Einheit</th>
                    <th class="text-end">Gesamt</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let p of selectedPositions; let i = index">
                    <td>{{ (i + 1).toString().padStart(3, '0') }}</td>
                    <td>{{ p.quantity | number:'1.1-1' }}</td>
                    <td>{{ p.item.name }}</td>
                    <td class="text-end text-muted">{{ p.item.unit ?? 'pauschal' }}</td>
                    <td class="text-end text-muted">–</td>
                  </tr>
                </tbody>
                <tfoot *ngIf="totalHours > 0">
                  <tr>
                    <td colspan="4" class="text-end fw-semibold">Gesamtdauer</td>
                    <td class="text-end fw-semibold">{{ totalHours | number:'1.1-1' }} h</td>
                  </tr>
                </tfoot>
              </table>
            </div>

          </div>

          <div *ngIf="errorMsg()" class="alert alert-danger">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ errorMsg() }}
          </div>

          <div class="d-flex gap-2 mt-3">
            <button class="btn btn-outline-secondary flex-grow-1" (click)="step.set('form')" [disabled]="saving()">
              <i class="bi bi-pencil me-1"></i>Bearbeiten
            </button>
            <button class="btn btn-primary flex-grow-1" (click)="saveReport()" [disabled]="saving()">
              <span *ngIf="saving()" class="spinner-border spinner-border-sm me-2"></span>
              <i *ngIf="!saving()" class="bi bi-send me-1"></i>
              In HERO erstellen
            </button>
          </div>
        </ng-container>

        <!-- ══════════════════════════════════════
             SCHRITT 3: ERFOLG
        ══════════════════════════════════════ -->
        <ng-container *ngIf="step() === 'success'">
          <div class="text-center py-5">
            <div style="font-size:4rem">✅</div>
            <h2 class="h4 fw-bold mt-3">Bericht erstellt!</h2>
            <p class="text-muted">Der Baustellenbericht wurde in HERO angelegt und ist dort abrufbar.</p>
            <div *ngIf="heroDocumentNr()" class="mt-2">
              <span class="badge bg-success fs-6">{{ heroDocumentNr() }}</span>
            </div>
            <div *ngIf="heroDocumentId() && !heroDocumentNr" class="text-muted small mt-1">
              HERO-ID: <code>{{ heroDocumentId }}</code>
            </div>
            <div class="d-flex gap-2 justify-content-center mt-4 flex-wrap">
              <button class="btn btn-outline-primary" (click)="reset()">
                <i class="bi bi-plus-circle me-1"></i>Neuer Bericht
              </button>
              <button class="btn btn-outline-secondary" (click)="goBack()">
                <i class="bi bi-folder2 me-1"></i>Zum Projekt
              </button>
            </div>
          </div>
        </ng-container>

        <!-- ══════════════════════════════════════
             SCHRITT 4: FEHLER
        ══════════════════════════════════════ -->
        <ng-container *ngIf="step() === 'error'">
          <div class="text-center py-5">
            <div style="font-size:4rem">❌</div>
            <h2 class="h4 fw-bold mt-3">Fehler</h2>
            <p class="text-muted">{{ errorMsg() || 'Bericht konnte nicht erstellt werden. Bitte erneut versuchen.' }}</p>
            <button class="btn btn-outline-secondary mt-3" (click)="step.set('preview')">
              <i class="bi bi-arrow-left me-1"></i>Zurück
            </button>
          </div>
        </ng-container>

      </div>
    </div>

    <!-- ─── POSITIONEN PICKER MODAL ─── -->
    <app-position-picker
      *ngIf="showPicker"
      [timeEntries]="timeEntries()"
      [preselectedTimes]="selectedTimeEntries.map(t => t.id)"
      [preselectedPositions]="selectedPositions"
      (confirmed)="onPickerConfirmed($event)"
      (cancelled)="showPicker = false">
    </app-position-picker>
  `,
  styles: [`
    .app-container {
      max-width: 600px; margin: 0 auto; background: #fff;
      min-height: 100dvh; display: flex; flex-direction: column;
    }
    .btn-positionen {
      background: #1a1a1a; color: #fff; border: none;
      padding: .85rem; font-weight: 700; font-size: .85rem;
      letter-spacing: .08em; border-radius: 4px; cursor: pointer;
      &:hover { background: #333; }
    }
    .position-card {
      border: 1px solid #e9ecef; border-radius: 10px; padding: .6rem .75rem;
    }
    .sort-btns {
      display: flex; flex-direction: column; gap: 1px; flex-shrink: 0;
    }
    .sort-btn {
      background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px;
      width: 26px; height: 26px; display: flex; align-items: center;
      justify-content: center; cursor: pointer; font-size: .75rem;
      color: #495057; padding: 0;
      &:disabled { opacity: .3; cursor: default; }
      &:not(:disabled):hover { background: #e9ecef; }
    }
    .qty-control {
      display: flex; align-items: center;
      border: 1px solid #dee2e6; border-radius: 20px; overflow: hidden;
    }
    .qty-btn {
      background: #f8f9fa; border: none; padding: .3rem .75rem;
      font-size: 1.1rem; font-weight: 600; cursor: pointer;
      &:hover { background: #e9ecef; }
    }
    .qty-value {
      padding: .3rem .75rem; font-weight: 600;
      min-width: 48px; text-align: center;
    }
    /* Dokument-Vorschau */
    .doc-preview {
      border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;
      background: #fff;
    }
    .doc-meta {
      padding: .5rem .75rem; background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    }
    .doc-section {
      padding: .75rem; border-bottom: 1px solid #eee;
      &:last-child { border-bottom: none; }
    }
    .doc-section-title {
      font-size: .75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: #6c757d; margin-bottom: .5rem;
    }
    .doc-textarea {
      width: 100%; border: 1px solid #dee2e6; border-radius: 6px;
      padding: .6rem; font-size: .9rem; line-height: 1.6;
      resize: vertical; font-family: inherit;
      &:focus { outline: none; border-color: var(--mitra-primary); }
    }
    .doc-table {
      width: 100%; border-collapse: collapse; font-size: .8rem;
      th, td { padding: .3rem .4rem; border-bottom: 1px solid #f0f0f0; }
      th { font-weight: 700; color: #495057; border-bottom: 2px solid #dee2e6; }
      tbody tr:hover { background: #fafafa; }
      tfoot td { border-top: 2px solid #dee2e6; border-bottom: none; }
    }
    .kopftext-hint {
      background: #fff8e1; border: 1px solid #ffe082;
      border-radius: 8px; padding: .5rem .75rem;
      font-size: .8rem; color: #5f4339;
    }
    .time-entry-item {
      border: 1px solid #e9ecef; border-radius: 10px;
      padding: .65rem .75rem; margin-bottom: .4rem;
      cursor: pointer; transition: all .15s;
      &:hover { border-color: var(--mitra-primary); background: #f8fbff; }
      &--selected {
        border-color: var(--mitra-primary);
        background: #e8f0fe;
      }
    }
    .time-checkbox {
      font-size: 1.2rem;
      color: #bbb;
      .time-entry-item--selected & { color: var(--mitra-primary); }
    }
  `]
})
export class ReportNewComponent implements OnInit {
  step = signal<Step>('form');
  aiLoading = signal(false);
  saving = signal(false);
  generatedText = signal('');
  heroDocumentId = signal('');
  heroDocumentNr = signal('');
  errorMsg = signal('');

  reportDate = new Date().toISOString().split('T')[0];
  selectedProject: Project | null = null;
  contextProject: Project | null = null;
  rawInput = '';
  timeEntries = signal<ReportTimeEntry[]>([]);
  selectedTimeEntries: ReportTimeEntry[] = [];
  selectedPositions: SelectedPosition[] = [];
  showPicker = false;
  loadingTimes = false;

  // document_type_id 622742 wird fest im n8n Workflow eingetragen – nicht nötig im Frontend

  get totalHours(): number {
    return this.selectedTimeEntries.reduce((s, e) => s + e.net_hours, 0);
  }

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private ctx: ProjectContextService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const p = this.ctx.currentProject();
    console.log('[Report] contextProject:', p);
    if (p) {
      this.contextProject = p;
      this.selectedProject = p;
      this.loadTimeEntries(p.id);
    }
  }

  private loadTimeEntries(projectId: number): void {
    this.loadingTimes = true;
    this.api.getProjectTimeEntries(projectId).pipe(
      catchError(() => of([]))
    ).subscribe((data: any) => {
      console.log('[Times] raw:', JSON.stringify(data));
      // n8n gibt zurück: [{ times: [...], count, ... }]
      const wrapper = Array.isArray(data) ? data[0] : data;
      const raw = wrapper?.times ?? wrapper?.tracking_times ?? (Array.isArray(data) ? data : []);
      const mapped = raw.map((t: any) => {
        const net = t.duration_seconds ? t.duration_seconds / 3600
          : t.duration_in_seconds ? t.duration_in_seconds / 3600
          : (t.start && t.end) ? (new Date(t.end).getTime() - new Date(t.start).getTime()) / 3600000
          : 0;
        return {
          id: t.id ?? String(Math.random()),
          date: t.date ?? (t.start ? new Date(t.start).toLocaleDateString('sv') : ''),
          start_time: t.start ? new Date(t.start).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          end_time: t.end ? new Date(t.end).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '',
          net_hours: Math.round(net * 100) / 100,
          employee_name: t.employee ?? t.partner?.full_name ?? t.employee_name ?? '',
          comment: t.comment ?? '',
        };
      });
      this.timeEntries.set(mapped);
      console.log('[Times] mapped:', this.timeEntries());
      this.loadingTimes = false;
    });
  }

  isTimeSelected(entry: ReportTimeEntry): boolean {
    return this.selectedTimeEntries.some(e => e.id === entry.id);
  }

  toggleTime(entry: ReportTimeEntry): void {
    if (this.isTimeSelected(entry)) {
      this.selectedTimeEntries = this.selectedTimeEntries.filter(e => e.id !== entry.id);
    } else {
      this.selectedTimeEntries = [...this.selectedTimeEntries, entry];
    }
  }

  onPickerConfirmed(result: { positions: SelectedPosition[]; timeIds: string[] }): void {
    // Neue Positionen hinzufügen, vorhandene beibehalten (keine Duplikate)
    const existingIds = new Set(this.selectedPositions.map(p => p.item.id));
    const newPositions = result.positions.filter(p => !existingIds.has(p.item.id));
    this.selectedPositions = [...this.selectedPositions, ...newPositions];
    // Zeiten setzen
    this.selectedTimeEntries = this.timeEntries().filter(t => result.timeIds.includes(t.id));
    // Kundendienst-Position automatisch aktualisieren
    this.syncKundendienstPosition();
    this.showPicker = false;
  }

  /**
   * Kundendienst/Baustellenmonteur automatisch als Position eintragen.
   * Menge = Summe aller ausgewählten Zeiteinträge in Stunden.
   * Wird automatisch entfernt wenn keine Zeiten gewählt sind.
   */
  private syncKundendienstPosition(): void {
    const totalH = this.selectedTimeEntries.reduce((s, t) => s + t.net_hours, 0);
    // Bestehende Kundendienst-Position entfernen
    this.selectedPositions = this.selectedPositions.filter(p => p.item.id !== KUNDENDIENST.id);
    // Neu einfügen wenn Stunden vorhanden – immer an erster Stelle
    if (totalH > 0) {
      this.selectedPositions = [
        { item: KUNDENDIENST, quantity: Math.round(totalH * 100) / 100 },
        ...this.selectedPositions,
      ];
    }
  }

  removePosition(index: number): void {
    this.selectedPositions = this.selectedPositions.filter((_, i) => i !== index);
  }

  movePosition(index: number, dir: -1 | 1): void {
    const arr = [...this.selectedPositions];
    const target = index + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[index], arr[target]] = [arr[target], arr[index]];
    this.selectedPositions = arr;
  }

  changeQty(index: number, delta: number): void {
    const pos = this.selectedPositions[index];
    const newQty = Math.max(0.5, pos.quantity + delta * 0.5);
    this.selectedPositions = this.selectedPositions.map((p, i) =>
      i === index ? { ...p, quantity: Math.round(newQty * 10) / 10 } : p
    );
  }

  onAiSubmit(raw: string): void {
    this.rawInput = raw;
    const project = this.contextProject ?? this.selectedProject;
    if (!project) { this.errorMsg.set('Bitte zuerst ein Projekt auswählen.'); return; }
    this.errorMsg.set('');
    this.aiLoading.set(true);

    this.api.previewReport({
      raw_input: raw,
      project_name: project.name,
      employee_name: this.auth.currentEmployee()?.name ?? '',
      date: this.reportDate,
      materials: '',
      time_entries: this.selectedTimeEntries
    }).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res[0] : res;
        const text = data?.generated_text ?? data?.text ?? data?.kopftext ?? '';
        this.generatedText.set(text);
        this.aiLoading.set(false);
        this.step.set(text ? 'preview' : 'form');
        if (!text) this.errorMsg.set('KI hat keinen Text zurückgegeben.');
      },
      error: () => {
        this.aiLoading.set(false);
        this.errorMsg.set('KI-Vorschau fehlgeschlagen. Bitte erneut versuchen.');
      }
    });
  }

  saveReport(): void {
    const project = this.contextProject ?? this.selectedProject;
    if (!project) return;
    this.saving.set(true);
    this.errorMsg.set('');

    this.api.saveReport({
      project_match_id: project.id,
      ki_text: this.generatedText(),
      time_entry_ids: this.selectedTimeEntries.map(e => e.id),
      positions: this.selectedPositions.map(p => ({
        id: p.item.id, name: p.item.name, quantity: p.quantity,
        unit: p.item.unit, price: p.item.price, type: p.item.type,
      })),
    }).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.success) {
          this.heroDocumentId.set(res.document_id ?? '');
          this.heroDocumentNr.set(res.document_nr ?? '');
          this.step.set('success');
        } else {
          this.errorMsg.set(res.error ?? 'Unbekannter Fehler.');
          this.step.set('error');
        }
      },
      error: () => {
        this.saving.set(false);
        this.errorMsg.set('Bericht konnte nicht in HERO erstellt werden. Bitte erneut versuchen.');
        this.step.set('error');
      }
    });
  }

  goBack(): void {
    this.contextProject ? this.router.navigate(['/project']) : this.router.navigate(['/dashboard']);
  }

  clearContext(): void {
    this.contextProject = null;
    this.selectedProject = null;
    this.timeEntries.set([]);
    this.selectedTimeEntries = [];
  }

  reset(): void {
    this.step.set('form');
    this.rawInput = '';
    this.generatedText.set('');
    this.heroDocumentId.set('');
    this.heroDocumentNr.set('');
    this.errorMsg.set('');
    this.selectedTimeEntries = [];
    this.selectedPositions = [];
    this.showPicker = false;
    this.reportDate = new Date().toISOString().split('T')[0];
    this.timeEntries.set([]);
    if (this.contextProject) this.loadTimeEntries(this.contextProject.id);
  }
}
