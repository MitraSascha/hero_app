export interface TimeParseRequest {
  raw_input: string;
}

export interface TimeParseResponse {
  start: string | null;       // "07:00"
  end: string | null;         // "16:00"
  break_minutes: number | null;
  net_hours: number | null;
}

export interface TimeSaveRequest {
  project_match_id: number;
  work_date: string;
  start_time: string;
  end_time: string;
  break_minutes: number;
  category_id: number;
  comment?: string;
}

export interface TimeSaveResponse {
  success: boolean;
  hero_entry_id?: string;
  error?: string;
}
