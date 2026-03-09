import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, tap } from 'rxjs';
import { Employee } from '../models/employee.model';
import { environment } from '../../../environments/environment';

interface LoginResponse {
  token: string;
  employee: Employee;
}

// ─── Dev-Mock-User ────────────────────────────────────────────────
// Wird nur in Dev verwendet (environment.production === false).
// hero_partner_id muss mit HERO übereinstimmen – Kalender, Zeiten etc.
// werden mit dieser ID gefiltert.
const DEV_USER: Employee = {
  id: 1,
  name: 'Sascha Richter',
  role: 'admin',
  hero_partner_id: 130793,
  hero_user_id: 282590,
  email: 'sascha@mitra-sanitaer.de',
};
const DEV_TOKEN = 'dev-token-sascha';
// ─────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'mitra_token';
  private readonly EMPLOYEE_KEY = 'mitra_employee';

  currentEmployee = signal<Employee | null>(this.loadEmployee());
  isLoggedIn = signal<boolean>(!!this.getToken());

  constructor(private http: HttpClient, private router: Router) {
    if (!environment.production) {
      this.setDevUser();
    }
  }

  login(employeeId: number, pin: string): Observable<LoginResponse> {
    if (!environment.production) {
      // Im Dev-Modus immer als Sascha einloggen
      const res: LoginResponse = { token: DEV_TOKEN, employee: DEV_USER };
      this.persist(res);
      return of(res);
    }
    return this.http.post<LoginResponse>(`${environment.apiBase}/auth/login`, { employee_id: employeeId, pin }).pipe(
      tap(res => this.persist(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.EMPLOYEE_KEY);
    this.currentEmployee.set(null);
    this.isLoggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setDevUser(): void {
    if (!this.getToken()) {
      localStorage.setItem(this.TOKEN_KEY, DEV_TOKEN);
      localStorage.setItem(this.EMPLOYEE_KEY, JSON.stringify(DEV_USER));
      this.currentEmployee.set(DEV_USER);
      this.isLoggedIn.set(true);
    }
  }

  private persist(res: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.EMPLOYEE_KEY, JSON.stringify(res.employee));
    this.currentEmployee.set(res.employee);
    this.isLoggedIn.set(true);
  }

  private loadEmployee(): Employee | null {
    const raw = localStorage.getItem(this.EMPLOYEE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
