import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { Employee } from '../../core/models/employee.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-container">
      <div class="d-flex flex-column align-items-center justify-content-center min-vh-100 p-4">
        <!-- Logo / Header -->
        <div class="text-center mb-4">
          <div class="mb-2" style="font-size: 3rem;">🔧</div>
          <h1 class="h3 fw-bold mb-0">MitraApp</h1>
          <p class="text-muted small">Mitra Sanitär – Mitarbeiter-Portal</p>
        </div>

        <div class="card w-100 p-4" style="max-width: 400px">
          <!-- Fehlermeldung -->
          <div *ngIf="errorMsg" class="alert alert-danger d-flex align-items-center mb-3" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            <span>{{ errorMsg }}</span>
          </div>

          <!-- Schritt 1: Mitarbeiter wählen -->
          <div *ngIf="step === 1">
            <h2 class="h5 fw-semibold mb-3">Wer bist du?</h2>
            <div *ngIf="loadingEmployees" class="text-center py-3">
              <span class="spinner-border spinner-border-sm me-2"></span>Lädt...
            </div>
            <div class="list-group" *ngIf="!loadingEmployees">
              <button type="button"
                      class="list-group-item list-group-item-action d-flex align-items-center py-3"
                      *ngFor="let emp of employees"
                      (click)="selectEmployee(emp)">
                <div class="avatar-circle me-3">{{ emp.name[0] }}</div>
                <div>
                  <div class="fw-semibold">{{ emp.name }}</div>
                  <div class="text-muted small">{{ roleLabel(emp.role) }}</div>
                </div>
              </button>
            </div>
          </div>

          <!-- Schritt 2: PIN eingeben -->
          <div *ngIf="step === 2">
            <button class="btn btn-link ps-0 mb-3 text-muted" (click)="step = 1; errorMsg = ''">
              <i class="bi bi-arrow-left me-1"></i>Zurück
            </button>
            <h2 class="h5 fw-semibold mb-1">Hallo, {{ selectedEmployee?.name }}!</h2>
            <p class="text-muted small mb-3">Bitte gib deine PIN ein.</p>

            <!-- PIN-Anzeige -->
            <div class="pin-dots d-flex justify-content-center gap-3 mb-4">
              <div *ngFor="let i of [0,1,2,3,4,5]"
                   class="pin-dot"
                   [class.filled]="pin.length > i"
                   [class.d-none]="i >= maxPinLength">
              </div>
            </div>

            <!-- Numpad -->
            <div class="numpad">
              <div class="row g-2">
                <div class="col-4" *ngFor="let key of numpadKeys">
                  <button type="button"
                          class="btn btn-outline-secondary w-100 numpad-btn"
                          (click)="numpadInput(key)"
                          [disabled]="loading">
                    <span *ngIf="key !== 'del'">{{ key }}</span>
                    <i *ngIf="key === 'del'" class="bi bi-backspace"></i>
                  </button>
                </div>
              </div>
            </div>

            <button type="button"
                    class="btn btn-primary w-100 mt-3"
                    [disabled]="pin.length < 4 || loading"
                    (click)="doLogin()">
              <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
              <i *ngIf="!loading" class="bi bi-unlock me-1"></i>
              Anmelden
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .avatar-circle {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: var(--mitra-primary);
      color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1.1rem;
      flex-shrink: 0;
    }
    .pin-dot {
      width: 16px; height: 16px;
      border-radius: 50%;
      border: 2px solid var(--mitra-primary);
      transition: background .15s;
      &.filled { background: var(--mitra-primary); }
    }
    .numpad-btn {
      height: 56px;
      font-size: 1.25rem;
      font-weight: 600;
      border-radius: 10px;
    }
  `]
})
export class LoginComponent implements OnInit {
  step = 1;
  employees: Employee[] = [];
  selectedEmployee: Employee | null = null;
  pin = '';
  maxPinLength = 6;
  loading = false;
  loadingEmployees = true;
  errorMsg = '';

  numpadKeys = ['1','2','3','4','5','6','7','8','9','del','0',''];

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.api.getEmployees().subscribe({
      next: data => { this.employees = data; this.loadingEmployees = false; },
      error: () => { this.loadingEmployees = false; this.errorMsg = 'Mitarbeiterliste konnte nicht geladen werden.'; }
    });
  }

  selectEmployee(emp: Employee): void {
    this.selectedEmployee = emp;
    this.pin = '';
    this.errorMsg = '';
    this.step = 2;
  }

  numpadInput(key: string): void {
    if (key === 'del') {
      this.pin = this.pin.slice(0, -1);
    } else if (key === '') {
      // leer – kein Input
    } else if (this.pin.length < this.maxPinLength) {
      this.pin += key;
    }
  }

  doLogin(): void {
    if (!this.selectedEmployee) return;
    this.loading = true;
    this.errorMsg = '';
    this.auth.login(this.selectedEmployee.id, this.pin).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => {
        this.loading = false;
        this.errorMsg = 'Falsche PIN. Bitte erneut versuchen.';
        this.pin = '';
      }
    });
  }

  roleLabel(role: string): string {
    const map: Record<string, string> = { worker: 'Monteur', foreman: 'Vorarbeiter', admin: 'Admin' };
    return map[role] ?? role;
  }
}
