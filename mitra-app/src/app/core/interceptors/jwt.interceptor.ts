import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  // Nur für eigene Backend-Calls – n8n-Webhooks brauchen keinen internen JWT
  const isN8n = req.url.includes('n8n.tech-artist.de');
  if (token && !isN8n) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
