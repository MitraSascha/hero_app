import { HeroCalendarEvent } from '../models/calendar-event.model';

// Hilfsfunktion: Datum relativ zu heute erzeugen
function today(h: number, m = 0): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString().slice(0, 16);
}
function dayOffset(offset: number, h: number, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d.toISOString().slice(0, 16);
}

export const MOCK_EVENTS: HeroCalendarEvent[] = [
  {
    id: '1',
    title: 'Heizungsinspektion – Musterstraße 12',
    start: today(7, 30),
    end: today(10, 0),
    color: '#1a73e8',
    notes: 'Jahresinspektion der Gasheizung. Kunden bitte vorher anrufen.',
    address: 'Musterstraße 12, 10115 Berlin',
    project: { id: 12958, name: 'SAN-564 Musterstraße', measure_short: 'SAN-564' },
    partners: [{ full_name: 'Ahmed Yilmaz' }],
    documents: [
      { id: 'd1', name: 'Wartungsprotokoll 2025.pdf', document_type: 'Protokoll', created: '2025-03-10' },
      { id: 'd2', name: 'Angebot_Heizung.pdf', document_type: 'Angebot', created: '2026-01-15' }
    ],
    images: [
      { id: 'i1', url: 'https://placehold.co/300x200?text=Heizungsraum', filename: 'heizungsraum.jpg' },
      { id: 'i2', url: 'https://placehold.co/300x200?text=Brenner', filename: 'brenner.jpg' }
    ]
  },
  {
    id: '2',
    title: 'Badezimmer-Sanierung – Karlstraße 5',
    start: today(11, 0),
    end: today(16, 0),
    color: '#34a853',
    notes: 'Komplette Demontage Altbad, Neuverlegung Fliesen durch Subunternehmer bereits erledigt.',
    address: 'Karlstraße 5, 10623 Berlin',
    project: { id: 13001, name: 'SAN-601 Karlstraße Bad', measure_short: 'SAN-601' },
    partners: [{ full_name: 'Max Mustermann' }],
    documents: [
      { id: 'd3', name: 'Aufmaß_Bad.pdf', document_type: 'Aufmaß', created: '2026-02-20' }
    ],
    images: []
  },
  {
    id: '3',
    title: 'Notfall: Rohrbruch – Hauptstraße 88',
    start: today(17, 0),
    end: today(19, 0),
    color: '#ea4335',
    notes: 'Wasserrohrbruch im Keller. Material: Kupferrohr 22mm mitbringen.',
    address: 'Hauptstraße 88, 10827 Berlin',
    project: { id: 13042, name: 'SAN-612 Notfall Hauptstr.', measure_short: 'SAN-612' },
    partners: [{ full_name: 'Ahmed Yilmaz' }],
    documents: [],
    images: []
  },
  // Morgen
  {
    id: '4',
    title: 'Klimaanlage Wartung – Bürogebäude Mitte',
    start: dayOffset(1, 8, 0),
    end: dayOffset(1, 12, 0),
    color: '#1a73e8',
    notes: 'Filter wechseln, Kühlmittel prüfen. Zugang über Hausmeister Hr. Schmidt.',
    address: 'Friedrichstraße 100, 10117 Berlin',
    project: { id: 13099, name: 'KLI-045 Bürogebäude Mitte', measure_short: 'KLI-045' },
    partners: [{ full_name: 'Ahmed Yilmaz' }, { full_name: 'Klaus Weber' }],
    documents: [
      { id: 'd4', name: 'Wartungsvertrag_2026.pdf', document_type: 'Vertrag', created: '2026-01-01' }
    ],
    images: [
      { id: 'i3', url: 'https://placehold.co/300x200?text=Klimaanlage', filename: 'klimaanlage_dach.jpg' }
    ]
  },
  {
    id: '5',
    title: 'Abnahme Neubau – Wohnpark Nord',
    start: dayOffset(1, 14, 0),
    end: dayOffset(1, 16, 30),
    color: '#34a853',
    notes: 'Abnahme aller Sanitäranlagen in 12 Einheiten. Checkliste liegt im Fahrzeug.',
    address: 'Parkstraße 1-3, 13156 Berlin',
    project: { id: 12800, name: 'SAN-502 Wohnpark Nord', measure_short: 'SAN-502' },
    partners: [{ full_name: 'Max Mustermann' }],
    documents: [],
    images: []
  },
  // Übermorgen
  {
    id: '6',
    title: 'Heizkörper tauschen – Privathaushalt',
    start: dayOffset(2, 9, 0),
    end: dayOffset(2, 13, 0),
    color: '#fbbc05',
    notes: '3x Heizkörper OG, Material bereits vor Ort.',
    address: 'Bergstraße 22, 12099 Berlin',
    project: { id: 13110, name: 'HZG-087 Bergstraße', measure_short: 'HZG-087' },
    partners: [{ full_name: 'Klaus Weber' }],
    documents: [],
    images: []
  }
];
