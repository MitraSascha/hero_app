import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ProjectContextService } from '../../core/services/project-context.service';
import { ApiService } from '../../core/services/api.service';
import { Project } from '../../core/models/project.model';
import { HeroDocument, HeroImage } from '../../core/models/calendar-event.model';
import { catchError, of } from 'rxjs';

// Mock-Projektdaten für Entwicklung

type DetailTab = 'dokumente' | 'bilder';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container">

      <!-- ─── HEADER ─── -->
      <div class="px-3 py-3 d-flex align-items-center border-bottom" style="background:#fff; flex-shrink:0">
        <button class="btn btn-link ps-0 text-muted me-2" (click)="goBack()">
          <i class="bi bi-arrow-left fs-5"></i>
        </button>
        <div class="min-w-0">
          <div class="fw-bold text-truncate" style="font-size:1rem; max-width:240px">
            {{ project?.name ?? 'Projekt' }}
          </div>
          <div class="text-muted small">{{ project?.measure_short }}</div>
        </div>
      </div>

      <div class="overflow-auto flex-grow-1">

        <!-- ─── LADE-INDIKATOR ─── -->
        <div *ngIf="loading" class="text-center py-5 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Projektdaten werden geladen...
        </div>

        <ng-container *ngIf="!loading && project">

          <!-- ─── PROJEKT-INFO KARTE ─── -->
          <div class="mx-3 mt-3 mb-3 card p-0 overflow-hidden">
            <div class="project-banner px-3 py-3"
                 [style.background]="bannerColor">
              <div class="fw-bold text-white" style="font-size:1.1rem">{{ project.measure_short }}</div>
              <div class="text-white opacity-75 small">{{ project.name }}</div>
            </div>
            <div class="px-3 py-2">
              <div class="row g-0 text-center">
                <div class="col-4 border-end py-2">
                  <div class="text-muted" style="font-size:.7rem; text-transform:uppercase; letter-spacing:.04em">Dokumente</div>
                  <div class="fw-bold fs-5">{{ documents().length }}</div>
                </div>
                <div class="col-4 border-end py-2">
                  <div class="text-muted" style="font-size:.7rem; text-transform:uppercase; letter-spacing:.04em">Bilder</div>
                  <div class="fw-bold fs-5">{{ images().length }}</div>
                </div>
                <div class="col-4 py-2">
                  <div class="text-muted" style="font-size:.7rem; text-transform:uppercase; letter-spacing:.04em">Status</div>
                  <div class="fw-bold" style="font-size:.85rem; color:#34a853">Aktiv</div>
                </div>
              </div>
            </div>
          </div>

          <!-- ─── AKTIONEN ─── -->
          <div class="px-3 mb-3">
            <div class="section-label">Aktionen</div>
            <div class="action-grid">

              <button class="action-tile" (click)="goTo('report')">
                <div class="action-tile__icon" style="background:#e8f0fe; color:#1a73e8">
                  <i class="bi bi-file-earmark-text"></i>
                </div>
                <span>Bericht</span>
              </button>

              <button class="action-tile" (click)="goTo('time')">
                <div class="action-tile__icon" style="background:#e6f4ea; color:#34a853">
                  <i class="bi bi-clock-history"></i>
                </div>
                <span>Zeit erfassen</span>
              </button>

              <button class="action-tile" (click)="goTo('task')">
                <div class="action-tile__icon" style="background:#fef7e0; color:#f9ab00">
                  <i class="bi bi-check2-square"></i>
                </div>
                <span>Aufgabe</span>
              </button>

              <button class="action-tile" (click)="triggerImageUpload()">
                <div class="action-tile__icon" style="background:#fce8e6; color:#ea4335">
                  <i class="bi bi-camera"></i>
                </div>
                <span>Foto</span>
              </button>

            </div>

            <!-- Hidden File Input für Kamera/Galerie -->
            <input #imageInput type="file" accept="image/*" capture="environment"
                   class="d-none" (change)="onImageSelected($event)">
          </div>

          <!-- ─── UPLOAD-FORTSCHRITT ─── -->
          <div *ngIf="uploading" class="mx-3 mb-3">
            <div class="alert alert-info d-flex align-items-center py-2 mb-0">
              <span class="spinner-border spinner-border-sm me-2"></span>
              Bild wird hochgeladen...
            </div>
          </div>
          <div *ngIf="uploadSuccess" class="mx-3 mb-3">
            <div class="alert alert-success d-flex align-items-center py-2 mb-0">
              <i class="bi bi-check-circle me-2"></i>Bild hochgeladen!
            </div>
          </div>

          <!-- ─── TABS ─── -->
          <div class="px-3 mb-2">
            <div class="section-label">Inhalte</div>
            <div class="tab-bar mb-3">
              <button class="tab-btn" [class.active]="activeTab === 'dokumente'" (click)="activeTab = 'dokumente'">
                <i class="bi bi-file-earmark-text me-1"></i>Dokumente
                <span class="tab-badge" *ngIf="documents().length">{{ documents().length }}</span>
              </button>
              <button class="tab-btn" [class.active]="activeTab === 'bilder'" (click)="activeTab = 'bilder'">
                <i class="bi bi-images me-1"></i>Bilder
                <span class="tab-badge" *ngIf="images().length">{{ images().length }}</span>
              </button>
            </div>

            <!-- Dokumente -->
            <ng-container *ngIf="activeTab === 'dokumente'">
              <div *ngIf="documents().length === 0" class="empty-state">
                <i class="bi bi-file-earmark-x"></i>
                <div>Keine Dokumente vorhanden</div>
              </div>
              <a *ngFor="let doc of documents()"
                 [href]="doc.url || '#'"
                 target="_blank"
                 class="doc-item text-decoration-none">
                <div class="doc-icon">
                  <i class="bi bi-file-pdf text-danger"></i>
                </div>
                <div class="flex-grow-1 min-w-0">
                  <div class="fw-semibold text-truncate" style="font-size:.9rem; color:#212529">{{ doc.name }}</div>
                  <div class="text-muted" style="font-size:.75rem">
                    {{ doc.document_type }}
                    <span *ngIf="doc.created"> · {{ doc.created | date:'dd.MM.yyyy' }}</span>
                  </div>
                </div>
                <i class="bi bi-download text-muted ms-2"></i>
              </a>
            </ng-container>

            <!-- Bilder -->
            <ng-container *ngIf="activeTab === 'bilder'">
              <div *ngIf="images().length === 0" class="empty-state">
                <i class="bi bi-image-alt"></i>
                <div>Keine Bilder vorhanden</div>
                <button class="btn btn-outline-primary btn-sm mt-2" (click)="triggerImageUpload()">
                  <i class="bi bi-camera me-1"></i>Foto aufnehmen
                </button>
              </div>
              <div class="image-grid" *ngIf="images().length">
                <div *ngFor="let img of images()" class="image-item" (click)="openImage(img.url)">
                  <img [src]="img.url" [alt]="img.filename" class="image-thumb">
                  <div class="image-overlay">
                    <i class="bi bi-zoom-in text-white"></i>
                  </div>
                </div>
              </div>
            </ng-container>

          </div>

        </ng-container>

        <!-- Kein Projekt gewählt -->
        <div *ngIf="!loading && !project" class="text-center py-5 text-muted px-4">
          <i class="bi bi-building-x" style="font-size:2.5rem; opacity:.3"></i>
          <div class="mt-2">Kein Projekt ausgewählt</div>
          <button class="btn btn-outline-primary btn-sm mt-3" (click)="goBack()">Zurück</button>
        </div>

      </div>

      <!-- ─── BOTTOM NAV ─── -->
      <nav class="bottom-nav border-top">
        <a routerLink="/dashboard" class="bottom-nav__item">
          <i class="bi bi-calendar3"></i><span>Kalender</span>
        </a>
        <button class="bottom-nav__item" (click)="goTo('report')">
          <i class="bi bi-file-earmark-plus"></i><span>Bericht</span>
        </button>
        <button class="bottom-nav__item" (click)="goTo('time')">
          <i class="bi bi-clock-history"></i><span>Zeit</span>
        </button>
        <button class="bottom-nav__item" (click)="goTo('task')">
          <i class="bi bi-check2-square"></i><span>Aufgabe</span>
        </button>
      </nav>

    </div>
  `,
  styles: [`
    :host { display: contents; }

    .app-container {
      display: flex; flex-direction: column;
      height: 100dvh; max-width: 600px; margin: 0 auto; background: #f4f6f9;
    }

    .project-banner { min-height: 70px; }

    .section-label {
      font-size: .72rem; text-transform: uppercase;
      letter-spacing: .06em; color: #6c757d;
      font-weight: 700; margin-bottom: .5rem;
    }

    /* ── Aktionen-Grid ── */
    .action-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: .5rem;
    }
    .action-tile {
      background: #fff;
      border: 1px solid #e9ecef;
      border-radius: 10px;
      padding: .75rem .25rem .5rem;
      display: flex; flex-direction: column;
      align-items: center; gap: .35rem;
      cursor: pointer;
      transition: transform .12s, box-shadow .12s;
      font-size: .72rem; font-weight: 600; color: #343a40;
      &:hover { transform: translateY(-2px); box-shadow: 0 3px 10px rgba(0,0,0,.1); }
      &:active { transform: scale(.96); }
    }
    .action-tile__icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem;
    }

    /* ── Tabs ── */
    .tab-bar {
      display: flex; gap: .5rem;
    }
    .tab-btn {
      flex: 1; padding: .5rem;
      border: 1px solid #dee2e6; border-radius: 8px;
      background: #fff; font-size: .85rem; font-weight: 600;
      color: #6c757d; cursor: pointer;
      transition: all .15s;
      &.active {
        background: var(--mitra-primary); color: #fff;
        border-color: var(--mitra-primary);
      }
    }
    .tab-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      background: rgba(255,255,255,.3); font-size: .65rem; font-weight: 700;
      margin-left: .25rem;
    }

    /* ── Dokumente ── */
    .doc-item {
      display: flex; align-items: center;
      background: #fff; border-radius: 10px;
      border: 1px solid #e9ecef;
      padding: .65rem .75rem;
      margin-bottom: .5rem;
      color: inherit;
      &:hover { background: #f0f4ff; }
    }
    .doc-icon {
      width: 36px; height: 36px;
      background: #fce8e6; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.1rem; flex-shrink: 0; margin-right: .75rem;
    }

    /* ── Bilder ── */
    .image-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem;
    }
    .image-item {
      position: relative; border-radius: 8px; overflow: hidden;
      aspect-ratio: 1; cursor: pointer;
      &:hover .image-overlay { opacity: 1; }
    }
    .image-thumb {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .image-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .15s;
    }

    /* ── Empty State ── */
    .empty-state {
      text-align: center; padding: 2rem 1rem;
      color: #6c757d;
      i { font-size: 2.5rem; opacity: .3; display: block; margin-bottom: .5rem; }
    }

    /* ── Bottom Nav ── */
    .bottom-nav {
      display: flex; background: #fff; flex-shrink: 0;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    .bottom-nav__item {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      padding: .5rem .25rem;
      text-decoration: none; color: #6c757d;
      font-size: .68rem; gap: 2px;
      background: none; border: none; cursor: pointer;
      transition: color .15s;
      i { font-size: 1.3rem; }
      &:hover, &.active { color: var(--mitra-primary); }
    }
  `]
})
export class ProjectDetailComponent implements OnInit {
  project: Project | null = null;
  documents = signal<HeroDocument[]>([]);
  images = signal<HeroImage[]>([]);
  loading = false;
  uploading = false;
  uploadSuccess = false;
  activeTab: DetailTab = 'dokumente';
  bannerColor = '#1a73e8';

  private readonly BANNER_COLORS = ['#1a73e8', '#34a853', '#ea4335', '#fbbc05', '#9c27b0', '#00897b'];

  constructor(
    private ctx: ProjectContextService,
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.project = this.ctx.currentProject();
    if (!this.project) { this.router.navigate(['/dashboard']); return; }

    // Konsistente Farbe pro Projekt-ID
    this.bannerColor = this.BANNER_COLORS[this.project.id % this.BANNER_COLORS.length];

    this.loadProjectData();
  }

  private loadProjectData(): void {
    if (!this.project) return;
    // Kein eigener Webhook für Projektdetails vorhanden –
    // Dokumente/Bilder werden geladen sobald der Webhook existiert
    this.documents.set([]);
    this.images.set([]);
    this.loading = false;
  }


  goTo(action: 'report' | 'time' | 'task'): void {
    const routes: Record<string, string> = {
      report: '/report/new',
      time: '/time/new',
      task: '/tasks/new'
    };
    this.router.navigate([routes[action]]);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  triggerImageUpload(): void {
    const input = document.querySelector('input[type=file]') as HTMLInputElement;
    input?.click();
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !this.project) return;

    this.uploading = true;
    this.uploadSuccess = false;

    this.api.uploadProjectImage(this.project.id, file).pipe(
      catchError(() => of({ success: false }))
    ).subscribe((res: any) => {
      this.uploading = false;
      if (res.success && res.url) {
        this.images.update(imgs => [...imgs, { id: res.image_id ?? Date.now().toString(), url: res.url }]);
        this.activeTab = 'bilder';
        this.uploadSuccess = true;
        setTimeout(() => this.uploadSuccess = false, 3000);
      }
    });
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }
}
