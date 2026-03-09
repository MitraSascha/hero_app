export interface Employee {
  id: number;
  name: string;
  role: 'worker' | 'foreman' | 'admin';
  hero_partner_id?: number;   // HERO partner_id – für Kalender, Zeiterfassung etc.
  hero_user_id?: number;      // HERO user_id
  email?: string;
}
