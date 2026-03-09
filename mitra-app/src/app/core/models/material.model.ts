export type MaterialType = 'artikel' | 'leistung';

export interface MaterialItem {
  id: string;
  name: string;
  number?: string;
  description?: string;
  price?: number;
  unit?: string;
  type: MaterialType;
}

export interface SelectedPosition {
  item: MaterialItem;
  quantity: number;
}
