import { Injectable, signal } from '@angular/core';
import { Project } from '../models/project.model';

/**
 * Hält das aktuell gewählte Projekt über alle Seiten hinweg.
 * Wird gesetzt wenn der Nutzer ein Projekt öffnet –
 * alle Aktionen (Bericht, Zeit, Aufgabe, Upload) greifen darauf zu.
 */
@Injectable({ providedIn: 'root' })
export class ProjectContextService {
  currentProject = signal<Project | null>(null);

  set(project: Project): void {
    this.currentProject.set(project);
  }

  clear(): void {
    this.currentProject.set(null);
  }
}
