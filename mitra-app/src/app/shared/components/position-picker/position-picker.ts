import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { MaterialItem, MaterialType, SelectedPosition } from '../../../core/models/material.model';
import { ReportTimeEntry } from '../../../core/models/report.model';

type PickerTab = 'artikel' | 'leistung' | 'zeiten';

@Component({
  selector: 'app-position-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="picker-overlay">
      <div class="picker-sheet">

        <!-- ─── HEADER ─── -->
        <div class="picker-header">
          <button class="btn btn-link text-white p-0" (click)="cancel()">
            <i class="bi bi-x-lg fs-5"></i>
          </button>
          <span class="fw-bold">Positionen hinzufügen</span>
          <button class="btn btn-link text-white p-0" (click)="confirm()">
            <i class="bi bi-check-lg fs-5"></i>
          </button>
        </div>

        <!-- ─── TABS ─── -->
        <div class="picker-tabs">
          <button class="picker-tab" [class.active]="tab === 'artikel'" (click)="setTab('artikel')">
            ARTIKEL
          </button>
          <button class="picker-tab" [class.active]="tab === 'leistung'" (click)="setTab('leistung')">
            LEISTUNGEN
          </button>
          <button class="picker-tab" [class.active]="tab === 'zeiten'" (click)="setTab('zeiten')">
            ZEITEN
          </button>
        </div>

        <!-- ─── SUCHFELD (Artikel & Leistungen) ─── -->
        <div *ngIf="tab !== 'zeiten'" class="search-bar">
          <div class="search-input-wrap">
            <i class="bi bi-search search-icon"></i>
            <input #searchInput
                   type="search"
                   class="search-input"
                   [placeholder]="tab === 'artikel' ? 'Artikel suchen...' : 'Leistung suchen...'"
                   [(ngModel)]="searchQuery"
                   (ngModelChange)="onSearch($event)"
                   autocomplete="off">
            <button *ngIf="searchQuery" class="clear-btn" (click)="clearSearch()">
              <i class="bi bi-x-circle-fill"></i>
            </button>
          </div>
        </div>

        <!-- ─── LISTE ─── -->
        <div class="picker-list">

          <!-- ARTIKEL / LEISTUNGEN -->
          <ng-container *ngIf="tab !== 'zeiten'">

            <!-- Starthinweis -->
            <div *ngIf="!searchQuery && !loading" class="empty-hint">
              <i class="bi bi-search" style="font-size:2rem;opacity:.2"></i>
              <div class="mt-2">Suchbegriff eingeben</div>
              <div class="text-muted small">mind. 2 Zeichen</div>
            </div>

            <!-- Laden -->
            <div *ngIf="loading" class="text-center py-5 text-muted">
              <span class="spinner-border spinner-border-sm me-2"></span>Suche läuft...
            </div>

            <!-- Keine Ergebnisse -->
            <div *ngIf="!loading && searchQuery && items.length === 0" class="empty-hint">
              <i class="bi bi-inbox" style="font-size:2rem;opacity:.2"></i>
              <div class="mt-2">Keine Ergebnisse für „{{ searchQuery }}"</div>
            </div>

            <!-- Ergebnisliste -->
            <div *ngFor="let item of items"
                 class="picker-item"
                 [class.picker-item--selected]="isSelected(item.id)"
                 (click)="toggleItem(item)">
              <div class="picker-checkbox" [class.checked]="isSelected(item.id)">
                <i class="bi bi-check" *ngIf="isSelected(item.id)"></i>
              </div>
              <div class="flex-grow-1 min-w-0">
                <div class="fw-semibold text-truncate">{{ item.name }}</div>
                <div class="picker-meta">
                  <span *ngIf="item.number" class="me-2 text-muted">{{ item.number }}</span>
                  <span *ngIf="item.description" class="text-muted d-block text-truncate">{{ item.description }}</span>
                </div>
              </div>
            </div>

          </ng-container>

          <!-- ZEITEN -->
          <ng-container *ngIf="tab === 'zeiten'">
            <div *ngIf="timeEntries.length === 0" class="empty-hint">
              <i class="bi bi-clock" style="font-size:2rem;opacity:.2"></i>
              <div class="mt-2">Keine Zeiteinträge für dieses Projekt</div>
            </div>
            <div *ngFor="let t of timeEntries"
                 class="picker-item"
                 [class.picker-item--selected]="isTimeSelected(t.id)"
                 (click)="toggleTime(t)">
              <div class="picker-checkbox" [class.checked]="isTimeSelected(t.id)">
                <i class="bi bi-check" *ngIf="isTimeSelected(t.id)"></i>
              </div>
              <div class="flex-grow-1">
                <div class="fw-semibold">{{ t.start_time }} – {{ t.end_time }}
                  <span class="fw-normal text-muted">({{ t.net_hours | number:'1.1-1' }} Std.)</span>
                </div>
                <div class="picker-meta text-muted">
                  {{ t.employee_name }}<span *ngIf="t.comment"> · {{ t.comment }}</span>
                </div>
              </div>
            </div>
          </ng-container>

        </div>

        <!-- ─── FOOTER mit Auswahl-Zusammenfassung ─── -->
        <div class="picker-footer" *ngIf="totalSelected > 0">
          <span class="text-white">{{ totalSelected }} ausgewählt</span>
          <button class="btn btn-warning btn-sm fw-bold" (click)="confirm()">
            Übernehmen <i class="bi bi-check-lg ms-1"></i>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .picker-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,.5);
      display: flex; align-items: flex-end;
    }
    .picker-sheet {
      width: 100%; max-width: 600px; margin: 0 auto;
      height: 92dvh; background: #fff;
      border-radius: 16px 16px 0 0;
      display: flex; flex-direction: column; overflow: hidden;
    }
    .picker-header {
      background: #1a1a1a; color: #fff;
      padding: .75rem 1rem;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .picker-tabs {
      display: flex; background: #1a1a1a; flex-shrink: 0;
    }
    .picker-tab {
      flex: 1; padding: .6rem; background: none; border: none;
      color: #aaa; font-size: .8rem; font-weight: 700;
      letter-spacing: .05em; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all .15s;
      &.active { color: #f5c518; border-bottom-color: #f5c518; }
    }
    .search-bar {
      padding: .6rem .75rem; background: #f8f9fa;
      border-bottom: 1px solid #e9ecef; flex-shrink: 0;
    }
    .search-input-wrap {
      display: flex; align-items: center;
      background: #fff; border: 1px solid #dee2e6;
      border-radius: 8px; padding: 0 .6rem;
    }
    .search-icon { color: #aaa; margin-right: .4rem; }
    .search-input {
      flex: 1; border: none; outline: none;
      padding: .55rem 0; font-size: .95rem; background: transparent;
    }
    .clear-btn {
      background: none; border: none; color: #aaa; cursor: pointer; padding: 0;
      &:hover { color: #666; }
    }
    .picker-list {
      flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
    }
    .empty-hint {
      text-align: center; padding: 3rem 1rem; color: #6c757d;
    }
    .picker-item {
      display: flex; align-items: flex-start;
      padding: .75rem 1rem; border-bottom: 1px solid #f0f0f0;
      cursor: pointer; gap: .75rem; transition: background .1s;
      &:hover { background: #fafafa; }
      &--selected { background: #fffbe6; }
    }
    .picker-checkbox {
      width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px;
      border: 2px solid #ccc; border-radius: 4px;
      display: flex; align-items: center; justify-content: center;
      font-size: .9rem; font-weight: 700; transition: all .15s;
      &.checked { background: #f5c518; border-color: #f5c518; color: #000; }
    }
    .picker-meta { font-size: .78rem; }
    .picker-footer {
      background: #1a1a1a; padding: .75rem 1rem;
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
  `]
})
export class PositionPickerComponent implements OnInit, OnDestroy {
  @Input() timeEntries: ReportTimeEntry[] = [];
  @Input() preselectedTimes: string[] = [];
  @Input() preselectedPositions: SelectedPosition[] = [];
  @Output() confirmed = new EventEmitter<{ positions: SelectedPosition[]; timeIds: string[] }>();
  @Output() cancelled = new EventEmitter<void>();

  tab: PickerTab = 'artikel';
  searchQuery = '';
  loading = false;
  items: MaterialItem[] = [];

  private selectedMap = new Map<string, MaterialItem>();
  private selectedTimeIds = new Set<string>();
  private search$ = new Subject<string>();
  private sub: any;

  get totalSelected(): number {
    return this.selectedMap.size + this.selectedTimeIds.size;
  }

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    // Bereits gewählte Positionen vorbelegen
    this.preselectedPositions.forEach(p => this.selectedMap.set(p.item.id, p.item));
    this.preselectedTimes.forEach(id => this.selectedTimeIds.add(id));

    this.sub = this.search$.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.items = []; this.loading = false; return of(null); }
        this.loading = true;
        const type = this.tab === 'artikel' ? 'product' : 'service';
        return this.api.searchMaterials(q, type).pipe(catchError(() => of(null)));
      })
    ).subscribe(res => {
      if (res === null) { this.loading = false; return; }
      const wrapper = Array.isArray(res) ? res[0] : res;
      const raw: any[] = wrapper?.items ?? [];
      const type = this.tab === 'artikel' ? 'product' : 'service';
      this.items = raw
        .filter((i: any) => i.type === type)
        .map((i: any) => ({
          id: String(i.id),
          name: (i.name ?? '').trim(),
          number: i.nr ?? '',
          description: this.stripHtml(i.description ?? ''),
          price: i.price ?? null,
          unit: i.unit ?? 'pauschal',
          type: (this.tab === 'artikel' ? 'artikel' : 'leistung') as MaterialType,
        }));
      this.loading = false;
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  setTab(t: PickerTab): void {
    this.tab = t;
    this.items = [];
    this.searchQuery = '';
    this.loading = false;
  }

  onSearch(q: string): void { this.search$.next(q); }

  clearSearch(): void { this.searchQuery = ''; this.items = []; }

  isSelected(id: string): boolean { return this.selectedMap.has(id); }
  isTimeSelected(id: string): boolean { return this.selectedTimeIds.has(id); }

  toggleItem(item: MaterialItem): void {
    this.selectedMap.has(item.id) ? this.selectedMap.delete(item.id) : this.selectedMap.set(item.id, item);
  }

  toggleTime(t: ReportTimeEntry): void {
    this.selectedTimeIds.has(t.id) ? this.selectedTimeIds.delete(t.id) : this.selectedTimeIds.add(t.id);
  }

  confirm(): void {
    const positions: SelectedPosition[] = Array.from(this.selectedMap.values()).map(item => ({ item, quantity: 1 }));
    this.confirmed.emit({ positions, timeIds: Array.from(this.selectedTimeIds) });
  }

  cancel(): void { this.cancelled.emit(); }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);
  }
}
