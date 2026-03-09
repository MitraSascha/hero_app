import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Project } from '../models/project.model';
import { Employee } from '../models/employee.model';
import { HeroCalendarEvent } from '../models/calendar-event.model';
import {
  ReportPreviewRequest, ReportPreviewResponse,
  ReportSaveRequest, ReportSaveResponse
} from '../models/report.model';
import {
  TimeParseRequest, TimeParseResponse,
  TimeSaveRequest, TimeSaveResponse
} from '../models/time-entry.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiBase;

  constructor(private http: HttpClient) {}

  // --- Kalender ---
  getCalendarEvents(start: string, end: string, partnerId?: number): Observable<HeroCalendarEvent[]> {
    const params: Record<string, string> = { start, end };
    if (partnerId) params['partner_id'] = String(partnerId);
    return this.http.get<any>(`${this.base}/calendar-events`, { params }).pipe(
      map(res => {
        // n8n gibt zurück: [{ events: [...], count }] oder { events: [...] }
        const wrapper = Array.isArray(res) ? res[0] : res;
        const raw = wrapper?.events;
        if (!Array.isArray(raw)) return [];
        return raw.map((e: any, i: number) => ({
          ...e,
          id: e.id ?? `${e.start}-${i}`,
          // partners: String → Array
          partners: Array.isArray(e.partners)
            ? e.partners
            : typeof e.partners === 'string'
              ? e.partners.split(',').map((n: string) => ({ full_name: n.trim() }))
              : [],
          // project: flache Felder → Objekt
          project: e.project_id ? {
            id: e.project_id,
            name: e.project_name,
            measure_short: e.project_measure,
          } : null,
        })) as HeroCalendarEvent[];
      })
    );
  }

  // --- Stammdaten ---
  getProjects(): Observable<Project[]> {
    return this.http.get<any>(`${this.base}/projects-list`).pipe(
      map(res => {
        const raw = Array.isArray(res) ? res
          : res?.projects ?? res?.data?.project_matches ?? res?.project_matches ?? [];
        return raw.map((p: any) => ({
          id: p.id ?? p.project_match_id,
          name: p.name,
          measure_short: p.measure_short ?? p.measure?.short ?? '',
        })) as Project[];
      })
    );
  }

  getEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.base}/employees-list`);
  }

  // --- Baustellenbericht ---
  // Pfade entsprechen exakt den n8n Webhook-Pfaden
  previewReport(payload: ReportPreviewRequest): Observable<ReportPreviewResponse> {
    return this.http.post<ReportPreviewResponse>(`${this.base}/report-preview`, payload);
  }

  saveReport(payload: ReportSaveRequest): Observable<ReportSaveResponse> {
    return this.http.post<ReportSaveResponse>(`${this.base}/report-save`, payload);
  }

  // --- Zeiterfassung ---
  parseTime(payload: TimeParseRequest): Observable<TimeParseResponse> {
    return this.http.post<TimeParseResponse>(`${this.base}/time/parse`, payload);
  }

  saveTime(payload: TimeSaveRequest): Observable<TimeSaveResponse> {
    return this.http.post<any>(`${this.base}/time/save`, payload).pipe(
      map(res => {
        const data = Array.isArray(res) ? res[0] : res;
        return {
          success: data?.success ?? true,
          hero_entry_id: data?.id,
        } as TimeSaveResponse;
      })
    );
  }

  // --- Projekt-Details ---
  getProjectDetail(projectMatchId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/projects/${projectMatchId}`);
  }

  getProjectTimeEntries(projectMatchId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/project-times`, { params: { project_match_id: String(projectMatchId) } });
  }

  uploadProjectImage(projectMatchId: number, file: File): Observable<{ success: boolean; image_id?: string; url?: string }> {
    const form = new FormData();
    form.append('file', file);
    form.append('project_match_id', String(projectMatchId));
    return this.http.post<any>(`${this.base}/projects/upload-image`, form);
  }

  // --- Materialien & Leistungen ---
  searchMaterials(query: string, type?: 'product' | 'service'): Observable<any> {
    const params: Record<string, string> = { search: query };
    if (type) params['type'] = type;
    return this.http.get<any>(`${this.base}/materials-list`, { params });
  }

  // --- Aufgaben ---
  createTask(payload: { title: string; description?: string; project_match_id: number; due_date?: string; assigned_employee_id?: number }): Observable<{ success: boolean; task_id?: string }> {
    return this.http.post<{ success: boolean; task_id?: string }>(`${this.base}/tasks/create`, payload);
  }
}
