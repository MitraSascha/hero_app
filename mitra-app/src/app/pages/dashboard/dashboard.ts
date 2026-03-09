import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ProjectContextService } from '../../core/services/project-context.service';
import { HeroCalendarEvent } from '../../core/models/calendar-event.model';
import { MOCK_EVENTS } from '../../core/services/mock-calendar.data';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type CalendarView = 'day' | 'week';

interface WeekDay {
  date: Date;
  label: string;       // "Mo 09"
  isToday: boolean;
  events: HeroCalendarEvent[];
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container">

      <!-- ─── TOP BAR ─── -->
      <div class="top-bar px-3 py-2 d-flex align-items-center justify-content-between border-bottom">
        <div class="fw-bold fs-5">MitraApp</div>
        <div class="d-flex align-items-center gap-2">
          <span class="text-muted small">{{ employeeName }}</span>
          <button class="btn btn-sm btn-outline-secondary" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- ─── DATUM-NAVIGATION ─── -->
      <div class="px-3 pt-2 pb-1 d-flex align-items-center justify-content-between">
        <button class="btn btn-sm btn-outline-secondary" (click)="navigate(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>

        <div class="text-center">
          <div class="fw-semibold">{{ navLabel() }}</div>
          <div class="text-muted" style="font-size:.75rem">
            <button class="btn btn-link p-0 text-muted" style="font-size:.75rem" (click)="goToToday()">Heute</button>
          </div>
        </div>

        <button class="btn btn-sm btn-outline-secondary" (click)="navigate(1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <!-- ─── VIEW TOGGLE ─── -->
      <div class="px-3 pb-2">
        <div class="btn-group w-100" role="group">
          <button type="button" class="btn btn-sm"
                  [class.btn-primary]="view() === 'day'"
                  [class.btn-outline-secondary]="view() !== 'day'"
                  (click)="setView('day')">
            <i class="bi bi-calendar-day me-1"></i>Tag
          </button>
          <button type="button" class="btn btn-sm"
                  [class.btn-primary]="view() === 'week'"
                  [class.btn-outline-secondary]="view() !== 'week'"
                  (click)="setView('week')">
            <i class="bi bi-calendar-week me-1"></i>Woche
          </button>
        </div>
      </div>

      <!-- ─── KALENDER INHALT ─── -->
      <div class="calendar-scroll flex-grow-1 overflow-auto">

        <!-- LADEINDIKATOR -->
        <div *ngIf="loading" class="text-center py-5 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Termine werden geladen...
        </div>

        <!-- ═══ TAGESANSICHT ═══ -->
        <ng-container *ngIf="!loading && view() === 'day'">
          <div class="day-grid px-3">

            <!-- Keine Termine -->
            <div *ngIf="dayEvents().length === 0" class="text-center py-5 text-muted">
              <i class="bi bi-calendar-x" style="font-size:2.5rem;opacity:.3"></i>
              <div class="mt-2">Keine Termine</div>
            </div>

            <!-- Termin-Karten -->
            <div *ngFor="let event of dayEvents()"
                 class="event-card mb-2"
                 [class.event-card--active]="selectedEvent?.id === event.id"
                 (click)="toggleEvent(event)">
              <div class="event-card__stripe" [style.background]="event.color || '#1a73e8'"></div>
              <div class="event-card__body">
                <div class="d-flex justify-content-between align-items-start">
                  <div class="fw-semibold" style="font-size:.95rem; line-height:1.2">{{ event.title }}</div>
                  <i class="bi ms-2 text-muted"
                     [class.bi-chevron-down]="selectedEvent?.id !== event.id"
                     [class.bi-chevron-up]="selectedEvent?.id === event.id"
                     style="font-size:.85rem; flex-shrink:0"></i>
                </div>
                <div class="text-muted small mt-1">
                  <i class="bi bi-clock me-1"></i>{{ formatTime(event.start) }} – {{ formatTime(event.end) }}
                  <span *ngIf="event.project?.measure_short" class="ms-2 badge bg-light text-dark border">
                    {{ event.project!.measure_short }}
                  </span>
                </div>
                <div *ngIf="event.address" class="text-muted small mt-1">
                  <i class="bi bi-geo-alt me-1"></i>{{ event.address }}
                </div>
              </div>
            </div>

            <!-- ─── DETAIL-PANEL ─── -->
            <div *ngIf="selectedEvent" class="detail-panel mb-3">

              <!-- Projektnummer & Titel → klickbar -->
              <div class="detail-section">
                <div class="detail-label">Projekt</div>
                <button *ngIf="selectedEvent.project; else noProject"
                        class="project-link"
                        (click)="openProject(selectedEvent)">
                  <div class="d-flex align-items-center gap-2">
                    <span class="badge bg-primary">{{ selectedEvent.project.measure_short }}</span>
                    <span class="fw-semibold">{{ selectedEvent.project.name }}</span>
                  </div>
                  <i class="bi bi-chevron-right text-muted"></i>
                </button>
                <ng-template #noProject><span class="text-muted">–</span></ng-template>
              </div>

              <!-- Notizen -->
              <div class="detail-section" *ngIf="selectedEvent.notes">
                <div class="detail-label"><i class="bi bi-sticky me-1"></i>Notizen</div>
                <div style="white-space:pre-wrap">{{ selectedEvent.notes }}</div>
              </div>

              <!-- Monteure -->
              <div class="detail-section" *ngIf="selectedEvent.partners?.length">
                <div class="detail-label"><i class="bi bi-people me-1"></i>Monteure</div>
                <div *ngFor="let p of selectedEvent.partners">{{ p.full_name }}</div>
              </div>

              <!-- Dokumente -->
              <div class="detail-section">
                <div class="detail-label"><i class="bi bi-file-earmark-text me-1"></i>Dokumente</div>
                <div *ngIf="!selectedEvent.documents?.length" class="text-muted small">Keine Dokumente vorhanden</div>
                <a *ngFor="let doc of selectedEvent.documents"
                   [href]="doc.url || '#'"
                   target="_blank"
                   class="doc-item d-flex align-items-center text-decoration-none">
                  <i class="bi bi-file-pdf text-danger me-2"></i>
                  <div>
                    <div class="fw-semibold" style="font-size:.88rem">{{ doc.name }}</div>
                    <div class="text-muted" style="font-size:.75rem">{{ doc.document_type }} · {{ doc.created }}</div>
                  </div>
                  <i class="bi bi-download ms-auto text-muted"></i>
                </a>
              </div>

              <!-- Bilder -->
              <div class="detail-section" *ngIf="selectedEvent.images?.length">
                <div class="detail-label"><i class="bi bi-images me-1"></i>Bilder</div>
                <div class="image-grid">
                  <img *ngFor="let img of selectedEvent.images"
                       [src]="img.url"
                       [alt]="img.filename"
                       class="image-thumb"
                       (click)="openImage(img.url)">
                </div>
              </div>

              <!-- Schnellaktionen über Projekt-Kontext -->
              <div class="detail-section border-0 pb-0" *ngIf="selectedEvent.project">
                <div class="detail-label">Schnellaktionen</div>
                <div class="d-flex gap-2 flex-wrap">
                  <button class="btn btn-sm btn-outline-primary" (click)="openProject(selectedEvent)">
                    <i class="bi bi-folder2-open me-1"></i>Projekt öffnen
                  </button>
                </div>
              </div>

            </div>

          </div>
        </ng-container>

        <!-- ═══ WOCHENANSICHT ═══ -->
        <ng-container *ngIf="!loading && view() === 'week'">
          <div class="week-grid px-2 pb-3">
            <div *ngFor="let day of weekDays()" class="week-day-col" (click)="selectDay(day.date)">

              <!-- Tages-Header -->
              <div class="week-day-header text-center py-2"
                   [class.week-day-header--today]="day.isToday">
                <div class="small fw-semibold">{{ day.label }}</div>
                <div class="week-dot" *ngIf="day.events.length">{{ day.events.length }}</div>
              </div>

              <!-- Mini-Termin-Blöcke -->
              <div *ngFor="let ev of day.events"
                   class="week-event-chip"
                   [style.borderLeftColor]="ev.color || '#1a73e8'"
                   (click)="selectDayAndEvent($event, day.date, ev)">
                <div class="fw-semibold truncate" style="font-size:.72rem">{{ ev.title }}</div>
                <div class="text-muted truncate" style="font-size:.68rem">{{ formatTime(ev.start) }}</div>
              </div>

              <div *ngIf="day.events.length === 0" class="text-center text-muted py-2" style="font-size:.75rem">–</div>
            </div>
          </div>
        </ng-container>

      </div>

      <!-- ─── BOTTOM NAV ─── -->
      <nav class="bottom-nav border-top">
        <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="bottom-nav__item">
          <i class="bi bi-calendar3"></i>
          <span>Kalender</span>
        </a>
        <a routerLink="/report/new" routerLinkActive="active" class="bottom-nav__item">
          <i class="bi bi-file-earmark-plus"></i>
          <span>Bericht</span>
        </a>
        <a routerLink="/time/new" routerLinkActive="active" class="bottom-nav__item">
          <i class="bi bi-clock-history"></i>
          <span>Zeit</span>
        </a>
        <a routerLink="/tasks/new" routerLinkActive="active" class="bottom-nav__item">
          <i class="bi bi-check2-square"></i>
          <span>Aufgabe</span>
        </a>
      </nav>

    </div>
  `,
  styles: [`
    :host { display: contents; }

    .app-container {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      max-width: 600px;
      margin: 0 auto;
      background: #fff;
    }

    .top-bar { background: #fff; flex-shrink: 0; }

    .calendar-scroll {
      flex: 1 1 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* ── Tagesansicht ── */
    .day-grid { padding-top: .75rem; }

    .event-card {
      display: flex;
      border-radius: 10px;
      border: 1px solid #e9ecef;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow .15s;
      &:hover { box-shadow: 0 2px 8px rgba(0,0,0,.1); }
      &--active { border-color: var(--mitra-primary); box-shadow: 0 2px 12px rgba(26,115,232,.15); }
    }
    .event-card__stripe { width: 5px; flex-shrink: 0; }
    .event-card__body { padding: .65rem .75rem; flex: 1; min-width: 0; }

    /* ── Detail-Panel ── */
    .detail-panel {
      border: 1px solid #e9ecef;
      border-radius: 10px;
      overflow: hidden;
      background: #fafbfc;
    }
    .detail-section {
      padding: .75rem 1rem;
      border-bottom: 1px solid #e9ecef;
    }
    .detail-label {
      font-size: .72rem;
      text-transform: uppercase;
      letter-spacing: .05em;
      color: #6c757d;
      font-weight: 600;
      margin-bottom: .3rem;
    }
    .doc-item {
      padding: .4rem .5rem;
      border-radius: 6px;
      color: inherit;
      &:hover { background: #f0f4ff; }
    }
    .image-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: .4rem;
    }
    .image-thumb {
      width: 100%; aspect-ratio: 1;
      object-fit: cover;
      border-radius: 6px;
      cursor: pointer;
    }

    .project-link {
      width: 100%;
      display: flex; align-items: center; justify-content: space-between;
      background: #f0f4ff; border: 1px solid #c5d8fc;
      border-radius: 8px; padding: .5rem .75rem;
      cursor: pointer; transition: background .15s;
      &:hover { background: #dce8fd; }
    }

    /* ── Wochenansicht ── */
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: .25rem;
      padding-top: .5rem;
    }
    .week-day-col { cursor: pointer; }
    .week-day-header {
      border-radius: 8px;
      &--today { background: var(--mitra-primary); color: #fff; }
    }
    .week-dot {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      background: #ea4335; color: #fff; font-size: .65rem; font-weight: 700;
      margin: 0 auto;
    }
    .week-event-chip {
      border-left: 3px solid;
      padding: .2rem .3rem;
      border-radius: 4px;
      background: #f8f9fa;
      margin-bottom: .2rem;
      cursor: pointer;
      &:hover { background: #e8f0fe; }
    }
    .truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ── Bottom Nav ── */
    .bottom-nav {
      display: flex;
      background: #fff;
      flex-shrink: 0;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
    .bottom-nav__item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: .5rem .25rem;
      text-decoration: none;
      color: #6c757d;
      font-size: .68rem;
      gap: 2px;
      transition: color .15s;
      i { font-size: 1.3rem; }
      &.active, &:hover { color: var(--mitra-primary); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  view = signal<CalendarView>('day');
  currentDate = signal<Date>(new Date());
  events = signal<HeroCalendarEvent[]>([]);
  loading = false;
  selectedEvent: HeroCalendarEvent | null = null;

  employeeName = 'Mitarbeiter';

  constructor(
    private auth: AuthService,
    private api: ApiService,
    private ctx: ProjectContextService,
    private router: Router
  ) {
    const emp = this.auth.currentEmployee();
    if (emp) this.employeeName = emp.name;
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  // ── Computed ────────────────────────────────────────────

  dayEvents = computed(() => {
    const d = this.currentDate();
    return this.events().filter(e => this.sameDay(new Date(e.start), d))
      .sort((a, b) => a.start.localeCompare(b.start));
  });

  weekDays = computed((): WeekDay[] => {
    const monday = this.getMonday(this.currentDate());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        date,
        label: date.toLocaleDateString('de-DE', { weekday: 'short' }).slice(0, 2)
               + ' ' + String(date.getDate()).padStart(2, '0'),
        isToday: this.sameDay(date, new Date()),
        events: this.events()
          .filter(e => this.sameDay(new Date(e.start), date))
          .sort((a, b) => a.start.localeCompare(b.start))
      };
    });
  });

  navLabel = computed(() => {
    const d = this.currentDate();
    if (this.view() === 'day') {
      if (this.sameDay(d, new Date())) return 'Heute';
      return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    const mon = this.getMonday(d);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return `${mon.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – `
         + sun.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
  });

  // ── Actions ─────────────────────────────────────────────

  setView(v: CalendarView): void {
    this.view.set(v);
    this.selectedEvent = null;
  }

  navigate(dir: -1 | 1): void {
    const d = new Date(this.currentDate());
    if (this.view() === 'day') {
      d.setDate(d.getDate() + dir);
    } else {
      d.setDate(d.getDate() + dir * 7);
    }
    this.currentDate.set(d);
    this.selectedEvent = null;
    this.loadEvents();
  }

  goToToday(): void {
    this.currentDate.set(new Date());
    this.selectedEvent = null;
    this.loadEvents();
  }

  toggleEvent(event: HeroCalendarEvent): void {
    this.selectedEvent = this.selectedEvent?.id === event.id ? null : event;
  }

  selectDay(date: Date): void {
    this.currentDate.set(new Date(date));
    this.view.set('day');
    this.selectedEvent = null;
  }

  selectDayAndEvent(mouseEvent: MouseEvent, date: Date, event: HeroCalendarEvent): void {
    mouseEvent.stopPropagation();
    this.currentDate.set(new Date(date));
    this.view.set('day');
    this.selectedEvent = event;
  }

  openProject(event: HeroCalendarEvent): void {
    if (!event.project) return;
    this.ctx.set({ id: event.project.id, name: event.project.name, measure_short: event.project.measure_short });
    this.router.navigate(['/project']);
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }

  logout(): void {
    this.auth.logout();
  }

  // ── Daten laden ─────────────────────────────────────────

  private loadEvents(): void {
    this.loading = true;
    // Immer die ganze Woche laden – Tag/Woche wird nur clientseitig gefiltert
    const mon = this.getMonday(this.currentDate());
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 0);
    const start = mon.toISOString();
    const end = sun.toISOString();

    const partnerId = this.auth.currentEmployee()?.hero_partner_id;
    this.api.getCalendarEvents(start, end, partnerId).pipe(
      catchError(() => of(MOCK_EVENTS))
    ).subscribe(data => {
      this.events.set(Array.isArray(data) ? data : []);
      this.loading = false;
    });
  }

  // ── Hilfsfunktionen ─────────────────────────────────────

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  private sameDay(a: Date, b: Date): boolean {
    // Lokales Datum vergleichen (nicht UTC) – HERO liefert ISO mit Timezone-Offset
    const fmt = (d: Date) => d.toLocaleDateString('sv'); // "2026-03-09"
    return fmt(a) === fmt(b);
  }

  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
