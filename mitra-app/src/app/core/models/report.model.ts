export interface ReportPreviewRequest {
  raw_input: string;
  project_name: string;
  employee_name: string;
  date: string;
  materials: string;
  time_entries?: ReportTimeEntry[];   // Optional: Zeiten die in den Bericht sollen
}

export interface ReportPreviewResponse {
  generated_text: string;
}

/**
 * Speichern = HERO create_document Mutation via n8n.
 * HERO übernimmt Projektdaten, Kunde etc. aus dem Projekt.
 * Wir liefern nur den KI-Text für das Feld "Kopftext".
 */
export interface ReportSaveRequest {
  project_match_id: number;
  ki_text: string;
  time_entry_ids?: string[];
  positions?: { id: string; name: string; quantity: number; unit?: string; price?: number; type: string }[];
}

export interface ReportSaveResponse {
  success: boolean;
  document_id?: string;      // HERO Dokument-ID
  document_nr?: string;      // z.B. "BB-2026-001"
  error?: string;
}

export interface ReportTimeEntry {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  net_hours: number;
  employee_name: string;
  comment?: string;
}
