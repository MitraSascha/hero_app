import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
  { path: 'report/new', loadComponent: () => import('./pages/report/report-new/report-new').then(m => m.ReportNewComponent) },
  { path: 'time/new', loadComponent: () => import('./pages/time/time-new/time-new').then(m => m.TimeNewComponent) },
  { path: 'tasks/new', loadComponent: () => import('./pages/tasks/task-new/task-new').then(m => m.TaskNewComponent) },
  { path: 'project', loadComponent: () => import('./pages/project/project-detail').then(m => m.ProjectDetailComponent) },
  { path: '**', redirectTo: 'dashboard' }
];
