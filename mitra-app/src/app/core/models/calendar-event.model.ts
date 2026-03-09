export interface HeroCalendarEvent {
  id: string;
  title: string;
  start: string;        // ISO datetime "2026-03-09T08:00:00"
  end: string;          // ISO datetime
  color?: string;
  notes?: string;
  project_match_id?: number;
  project?: {
    id: number;
    name: string;
    measure_short?: string;
  };
  partners?: { full_name: string }[];
  address?: string;
  documents?: HeroDocument[];
  images?: HeroImage[];
}

export interface HeroDocument {
  id: string;
  name: string;
  url?: string;
  document_type?: string;
  created?: string;
}

export interface HeroImage {
  id: string;
  url: string;
  filename?: string;
}
