# MitraApp – Projektspezifikation

> **Dokument-Zweck:** Diese Spezifikation beschreibt das Vorhaben vollständig und dient als Arbeitsgrundlage für KI-gestützte Entwicklungsunterstützung. Jede KI, die dieses Dokument liest, soll den Kontext, die Ziele, den Stack und den aktuellen Stand verstehen und direkt weiterhelfen können.

---

## 1. Unternehmenskontext

**Unternehmen:** Mitra Sanitär – SHK-Betrieb (Sanitär, Heizung, Klima) in Berlin  
**Branche:** Handwerk / Gebäudetechnik  
**Besonderheit der Belegschaft:** Mehrsprachiges Team. Einige Mitarbeiter sprechen nicht fließend Deutsch, was das Verfassen von Berichten oder das korrekte Ausfüllen von Formularen erschwert.

**Verwendetes CRM:** [HERO Software](https://hero-software.de)  
- GraphQL API (v7): `https://login.hero-software.de/api/external/v7/graphql`  
- REST API für Datei-Uploads  
- Authentifizierung: Bearer Token (API-Key vorhanden)  
- Vollständige API-Dokumentation liegt als separate Datei `HERO_API_Dokumentation.md` vor

---

## 2. Projektziel

Entwicklung einer **mobil-optimierten Progressive Web App (PWA)** sowie einer **Desktop-Webanwendung**, die ausgewählte Prozesse aus dem HERO CRM für Mitarbeiter vereinfacht – insbesondere durch **KI-Unterstützung bei der Texteingabe**.

### Kernproblem das gelöst wird

Mitarbeiter auf der Baustelle sollen Berichte schreiben, Zeiten erfassen und Aufgaben erstellen – aber:
- Das CRM-Interface ist komplex und nicht mobil-optimiert
- Sprachbarrieren erschweren das Verfassen korrekter deutscher Texte
- Mitarbeiter holen das Handy nur heraus, wenn es wirklich schnell geht

### Lösung

Eine schlanke App, in der Mitarbeiter **in einfachen Worten (oder per Spracheingabe) sagen**, was sie gemacht haben – und die KI übernimmt die Formulierung, Strukturierung und Übermittlung an HERO.

**Beispiel Zeiterfassung:**
> Mitarbeiter tippt/spricht: *„Arbeitsbeginn 7 Uhr, Pause 12 bis 13, Feierabend 16 Uhr, Projekt SAN-564"*  
> KI extrahiert: Start 07:00, Ende 16:00, Pause 60 min, Netto 8h, Projekt SAN-564  
> Mitarbeiter bestätigt → Eintrag geht direkt in HERO

**Beispiel Baustellenbericht:**
> Mitarbeiter tippt/spricht: *„Rohre verlegt, Wasser läuft, morgen Putz"*  
> KI generiert: *„Am heutigen Tag wurden die Rohrleitungen erfolgreich verlegt und in Betrieb genommen. Die Wasserführung funktioniert einwandfrei. Für den kommenden Arbeitstag ist das Verputzen der Wände geplant."*  
> Mitarbeiter kann Text bearbeiten → Als PDF in HERO hochladen

---

## 3. Technologie-Stack

### Frontend

| Technologie | Zweck |
|-------------|-------|
| **Angular** (aktuell) | Framework für Web + PWA |
| **PWA** (Service Worker + Manifest) | Mobile-App-Feeling ohne App Store, Offline-Fähigkeit |
| **Bootstrap** oder Angular Material | UI-Komponenten |
| **Browser Speech API** | Spracheingabe direkt im Browser (kein externer Dienst) |

### Backend / Middleware

| Technologie | Zweck |
|-------------|-------|
| **n8n** (self-hosted) | Alle Backend-Workflows, API-Gateway, Logik |
| **Python** | PDF-Generierung (ReportLab), Hilfsskripte |
| **PostgreSQL** | Eigene Datenhaltung (User, Cache, Logs) |

### KI

| Technologie | Zweck |
|-------------|-------|
| **Ollama** (self-hosted, lokal) | LLM-Inference ohne Cloud-Abhängigkeit |
| **qwen2.5:7b** | Texterstellung, Zeiterfassungs-Parser |
| **qwen2.5:14b** | Komplexere Aufgaben (z.B. strukturierte Datenextraktion) |

### Externes System

| System | Zweck |
|--------|-------|
| **HERO CRM** | Zieldatenbank – alle Einträge landen hier |
| GraphQL API | Lesen und Schreiben von Projekten, Zeiterfassung, Dokumenten |
| REST API | Datei-Upload (PDFs) |

### Architekturprinzip

```
Angular PWA  ←→  n8n (Webhooks)  ←→  HERO CRM API
                      ↕                    
                 PostgreSQL          
                      ↕                    
                   Ollama (KI)       
                      ↕                    
                 Python Scripts      
                 (PDF-Generierung)   
```

> **Wichtig:** Angular kommuniziert **ausschließlich mit n8n-Webhooks**. Niemals direkt mit HERO oder Ollama. n8n ist das einzige Backend.

---

## 4. Funktionsbereiche (Module)

### Phase 1 – MVP (aktuelle Priorität)

#### 4.1 Modul: Baustellenbericht ✅ In Entwicklung

**Zweck:** Mitarbeiter erstellt einen Baustellenbericht auf der Baustelle per Handy. KI formuliert den Text professionell auf Deutsch. Ergebnis wird als PDF in HERO hochgeladen und dem Projekt zugeordnet.

**Felder des Berichts:**
- Datum (automatisch, editierbar)
- Projekt (Dropdown aus HERO `project_matches`)
- Mitarbeiter (aus Session / Login)
- Tätigkeitsbeschreibung (KI-generiert aus Freitext oder Spracheingabe)
- Eingesetzte Materialien (Freitext)

**Eingabemodi:**
- Text tippen
- Spracheingabe via Browser Speech API → wandelt zu Text → KI verarbeitet

**Ablauf:**
1. Projekt wählen
2. Rohtext eingeben (tippen oder sprechen)
3. Materialien eingeben
4. „KI-Vorschau" → KI generiert formatierten Berichtstext
5. Mitarbeiter liest, ggf. editiert manuell
6. „Speichern" → PDF wird generiert → In HERO hochgeladen
7. Erfolgsmeldung mit HERO-Dokument-ID

**HERO-Anbindung:**
- Dokument-Upload via REST API (gibt `file_upload_uuid` zurück)
- Verknüpfung via GraphQL Mutation `upload_document`
- `target: project_match`, `target_id: <project_match_id>`
- `document_type_id`: festgelegter Wert für Baustellenberichte (aus `document_types` Query ermitteln)

**PDF-Format (ReportLab, Python):**
- Kopfzeile: „BAUSTELLENBERICHT" + Firmenname
- Metadaten: Projekt, Datum, Mitarbeiter
- Abschnitt: Tätigkeitsbeschreibung
- Abschnitt: Materialien
- Fußzeile: Seitenzahl + Datum

---

#### 4.2 Modul: Zeiterfassung (Phase 1, nach Baustellenbericht)

**Zweck:** Mitarbeiter erfasst Arbeitszeiten schnell per Freitext oder Sprache. KI parst die Eingabe und füllt das Formular aus. Mitarbeiter bestätigt.

**Felder:**
- Datum
- Projekt (Dropdown)
- Arbeitsbeginn (Zeit)
- Arbeitsende (Zeit)
- Pause (Minuten)
- Netto-Arbeitszeit (automatisch berechnet)
- Kategorie (aus HERO `tracking_times_categories`)
- Kommentar (optional)

**KI-Parser Beispieleingaben:**
- „7 bis 16 Uhr, Pause 30 Minuten, SAN-123"
- „Arbeitsbeginn halb 8, Feierabend um 5, keine Pause"
- „8-17 Uhr mit einer Stunde Mittagspause"

**Ablauf:**
1. Freitext-/Spracheingabe
2. KI extrahiert strukturierte Daten (JSON)
3. Formular wird automatisch befüllt
4. Mitarbeiter prüft und korrigiert ggf.
5. „Speichern" → HERO `tracking_times` Mutation (oder Update)

**HERO-Anbindung:**
- Mutation: `update_tracking_time` mit Feldern `start`, `end`, `comment`, `project_match_id`, `tracking_times_category_id`

---

#### 4.3 Modul: Aufgaben erstellen (Phase 1)

**Zweck:** Mitarbeiter oder Vorarbeiter erstellt schnell eine Aufgabe in HERO.

**Felder:**
- Titel
- Beschreibung (optional KI-formuliert)
- Projekt
- Fälligkeitsdatum
- Zugewiesener Mitarbeiter

**HERO-Anbindung:**
- Mutation: `update_task` oder `add_logbook_entry`

---

### Phase 2 – Erweiterungen (geplant, noch nicht in Entwicklung)

| Modul | Beschreibung |
|-------|-------------|
| **Projekteübersicht** | Liste aller eigenen Projekte mit Status, Terminen, letzten Aktivitäten |
| **Kalender** | Eigene Termine aus HERO anzeigen und erstellen |
| **Abwesenheiten** | Urlaubsanträge stellen, Abwesenheitssaldo einsehen |
| **Außendienst-Jobs** | `field_service_jobs` anzeigen und Checklisten abhaken |
| **Admin-Bereich** | Mitarbeiterverwaltung, Projektübersicht für Büro |
| **Vollständiges CRM-Frontend** | Langfristig: vollständige HERO-Abdeckung über diese App |

---

## 5. Authentifizierung & Benutzerverwaltung

**Konzept:** Eigene, schlanke Auth – kein HERO-Login für Mitarbeiter.

**PostgreSQL Tabelle `employees`:**
```sql
CREATE TABLE employees (
  id          SERIAL PRIMARY KEY,
  hero_partner_id  INT,           -- Verknüpfung zu HERO partner
  name        VARCHAR(100),
  pin         VARCHAR(6),         -- 4-6 stellige PIN (gehasht)
  role        VARCHAR(20),        -- 'worker', 'foreman', 'admin'
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMP DEFAULT NOW()
);
```

**Login-Flow:**
1. Mitarbeiter wählt seinen Namen aus Liste oder gibt Mitarbeiter-ID ein
2. Gibt PIN ein (4–6 Stellen)
3. n8n prüft gegen PostgreSQL
4. Bei Erfolg: JWT-Token zurück (24h gültig)
5. Angular speichert Token im localStorage

**Rollen:**
- `worker` → eigene Berichte, eigene Zeiterfassung, Aufgaben erstellen
- `foreman` → alle Berichte des Teams einsehen, Aufgaben zuweisen
- `admin` → alles + Benutzerverwaltung

---

## 6. n8n Workflow-Struktur

Alle n8n-Workflows sind **Webhook-basiert**. Angular sendet HTTP-Requests an n8n-Endpunkte.

### Namenskonvention

`[Modul]-[Aktion]` – z.B. `report-preview`, `time-save`, `auth-login`

### Endpunkte (Webhook-URLs)

| Methode | Pfad | Workflow | Beschreibung |
|---------|------|----------|-------------|
| POST | `/api/auth/login` | `auth-login` | Login mit Name + PIN |
| GET | `/api/projects` | `projects-list` | Projektliste aus HERO |
| GET | `/api/employees` | `employees-list` | Mitarbeiterliste |
| POST | `/api/report/preview` | `report-preview` | KI-Textgenerierung (kein Speichern) |
| POST | `/api/report/save` | `report-save` | PDF erstellen + HERO Upload |
| POST | `/api/time/parse` | `time-parse` | KI-Parsing der Zeiterfassungseingabe |
| POST | `/api/time/save` | `time-save` | Zeiterfassung in HERO speichern |
| POST | `/api/tasks/create` | `tasks-create` | Aufgabe in HERO erstellen |

### Workflow: `report-preview`

**Input (JSON Body):**
```json
{
  "raw_input": "Rohre verlegt, Wasser läuft, morgen Putz",
  "project_name": "SAN-564 Musterstraße",
  "employee_name": "Ahmed Yilmaz",
  "date": "2026-03-09",
  "materials": "5m Kupferrohr DN15, 2x Eckventil"
}
```

**Ollama Prompt:**
```
Du bist ein Assistent für eine SHK-Firma (Sanitär, Heizung, Klima).
Schreibe einen professionellen Baustellenbericht auf Deutsch.

Projekt: {project_name}
Datum: {date}
Mitarbeiter: {employee_name}
Materialien: {materials}
Tätigkeit (Rohinfo): {raw_input}

Schreibe einen sachlichen, vollständigen Bericht in 3-5 Sätzen.
Nur den Berichtstext, keine Überschriften, keine Erklärungen.
```

**Output:**
```json
{
  "generated_text": "Am 09.03.2026 wurden die Rohrleitungen..."
}
```

### Workflow: `report-save`

> **Architektur-Entscheidung:** Kein eigenes PDF. HERO besitzt eine eigene Baustellenbericht-Vorlage
> mit vordefinierten Feldern (Projektname, Kunde, Datum werden automatisch aus dem Projekt übernommen).
> Wir füllen **nur das Feld „Kopftext"** mit dem KI-generierten Text via `create_document` Mutation.

**Input:**
```json
{
  "project_match_id": 12958,
  "document_type_id": 26,
  "kopftext": "Am 09.03.2026 wurden die Rohrleitungen erfolgreich verlegt...",
  "materials": "5m Kupferrohr DN15",
  "time_entry_ids": ["t1", "t2"]
}
```

**Schritte im Workflow:**
1. HTTP Request → HERO GraphQL `create_document` Mutation
   - `document_type_id`: Baustellenbericht-Typ (via `document_types` Query ermitteln)
   - `project_match_id`: Projekt-Verknüpfung
   - Feld „Kopftext": KI-generierter Text
2. Respond to Webhook → `{ success: true, document_id: "..." }`

**HERO GraphQL Mutation (final, bestätigt):**
```graphql
mutation {
  create_document(
    input: { document_type_id: 622742, project_match_id: 12958 },
    actions: [{ add_text: { text: "Am heutigen Tag wurden die Rohrleitungen..." } }]
  ) { id nr }
}
```

**Documents_CreateDocumentInput Felder:**
| Feld | Typ | Pflicht |
|------|-----|---------|
| `document_type_id` | Int | ✅ |
| `project_match_id` | Int | ✅ |
| `filename` | String | nein |
| `publish` | Boolean | nein |

**Documents_AddTextActionInput Felder:**
| Feld | Typ |
|------|-----|
| `text` | String (NonNull) |
| `pagebreak` | Boolean |

**n8n Workflow `report-save` – finale Query:**
```json
{
  "query": "mutation { create_document(input: { document_type_id: 622742, project_match_id: {{ $json.project_match_id }} }, actions: [{ add_text: { text: \"{{ $json.ki_text }}\" } }]) { id nr } }"
}
```

**Angular → n8n Input:**
```json
{ "project_match_id": 12958, "ki_text": "Am heutigen Tag wurden..." }
```

**n8n → Angular Output:**
```json
{ "success": true, "document_id": "...", "document_nr": "BB-2026-001" }
```

**Webhook-URLs:**
- Dev (Test-Modus): `https://n8n.tech-artist.de/webhook-test/report-preview` / `/report-save`
- Prod (aktiv): `https://n8n.tech-artist.de/webhook/report-preview` / `/report-save`

### Workflow: `time-parse`

**Input:**
```json
{
  "raw_input": "Arbeitsbeginn 7 Uhr, Pause 12-13, Feierabend 16 Uhr"
}
```

**Ollama Prompt:**
```
Extrahiere aus dem folgenden Text die Arbeitszeitdaten.
Antworte NUR mit einem JSON-Objekt, ohne Erklärungen.

Text: "{raw_input}"

Antworte in diesem Format:
{
  "start": "07:00",
  "end": "16:00",
  "break_minutes": 60,
  "net_hours": 8.0
}

Wenn eine Information fehlt, setze null.
```

**Output:**
```json
{
  "start": "07:00",
  "end": "16:00",
  "break_minutes": 60,
  "net_hours": 8.0
}
```

---

## 7. Angular App – Struktur

### Projektstruktur

```
src/
├── app/
│   ├── core/
│   │   ├── services/
│   │   │   ├── api.service.ts          ← Alle n8n-API-Calls
│   │   │   ├── auth.service.ts         ← JWT, Login-State
│   │   │   └── speech.service.ts       ← Browser Speech API
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   └── interceptors/
│   │       └── jwt.interceptor.ts      ← Bearer Token anhängen
│   ├── shared/
│   │   ├── components/
│   │   │   ├── ai-input/               ← Wiederverwendbare KI-Eingabe-Komponente
│   │   │   └── project-select/         ← Projekt-Dropdown
│   │   └── models/
│   │       ├── project.model.ts
│   │       ├── employee.model.ts
│   │       └── report.model.ts
│   ├── pages/
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── report/
│   │   │   ├── report-new/             ← Neuer Baustellenbericht
│   │   │   └── report-list/            ← Eigene Berichte (später)
│   │   ├── time/
│   │   │   ├── time-new/               ← Neue Zeiterfassung
│   │   │   └── time-history/           ← Eigene Zeiten (später)
│   │   └── tasks/
│   │       └── task-new/
│   └── app-routing.module.ts
└── manifest.webmanifest               ← PWA-Manifest
```

### Routen

| Route | Komponente | Auth erforderlich |
|-------|-----------|-------------------|
| `/login` | LoginComponent | Nein |
| `/dashboard` | DashboardComponent | Ja |
| `/report/new` | ReportNewComponent | Ja |
| `/time/new` | TimeNewComponent | Ja |
| `/tasks/new` | TaskNewComponent | Ja |

### KI-Eingabe Komponente (Wiederverwendbar)

Die Komponente `ai-input` wird in mehreren Modulen genutzt:

```typescript
// Inputs
@Input() placeholder: string       // Platzhaltertext
@Input() isLoading: boolean        // Ladezustand während KI verarbeitet

// Outputs
@Output() textSubmit               // Emittiert wenn User Text abschickt
@Output() voiceResult              // Emittiert erkannten Spracheingabetext
```

**UI-Elemente:**
- Textarea für Texteingabe
- Mikrofon-Button (aktiviert Speech API)
- Status-Anzeige: „Aufnahme läuft..." / „KI verarbeitet..."
- Submit-Button

### Speech API Integration

```typescript
// speech.service.ts
startRecognition(): Observable<string> {
  const recognition = new (window as any).webkitSpeechRecognition();
  recognition.lang = 'de-DE';
  recognition.continuous = false;
  recognition.interimResults = false;
  // ...gibt erkannten Text als Observable zurück
}
```

> Browser-Kompatibilität: Chrome (Desktop + Android) ✅ | Safari iOS (ab 14.5) ✅ | Firefox ❌ (kein Support)

---

## 8. Datenbank (PostgreSQL)

### Tabellen

```sql
-- Mitarbeiter (eigene Auth, unabhängig von HERO)
CREATE TABLE employees (
  id               SERIAL PRIMARY KEY,
  hero_partner_id  INT,
  name             VARCHAR(100) NOT NULL,
  pin_hash         VARCHAR(255) NOT NULL,
  role             VARCHAR(20) DEFAULT 'worker',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Projekte (Cache aus HERO, täglich aktualisiert)
CREATE TABLE projects_cache (
  id               INT PRIMARY KEY,   -- HERO project_match_id
  name             VARCHAR(255),
  measure_short    VARCHAR(20),
  is_active        BOOLEAN DEFAULT true,
  synced_at        TIMESTAMP DEFAULT NOW()
);

-- Baustellenberichte (lokaler Log)
CREATE TABLE reports (
  id               SERIAL PRIMARY KEY,
  employee_id      INT REFERENCES employees(id),
  project_match_id INT,
  report_date      DATE,
  raw_input        TEXT,
  generated_text   TEXT,
  materials        TEXT,
  hero_document_id VARCHAR(100),      -- ID nach HERO-Upload
  status           VARCHAR(20) DEFAULT 'draft', -- draft, submitted, error
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Zeiterfassungen (lokaler Log)
CREATE TABLE time_entries (
  id               SERIAL PRIMARY KEY,
  employee_id      INT REFERENCES employees(id),
  project_match_id INT,
  work_date        DATE,
  start_time       TIME,
  end_time         TIME,
  break_minutes    INT DEFAULT 0,
  net_hours        DECIMAL(4,2),
  category_id      INT,
  comment          TEXT,
  hero_entry_id    VARCHAR(100),
  status           VARCHAR(20) DEFAULT 'draft',
  created_at       TIMESTAMP DEFAULT NOW()
);
```

---

## 9. UX-Prinzipien

Diese Prinzipien gelten für alle Entwicklungsentscheidungen:

1. **Mobile First** – Primär auf dem Smartphone nutzbar, 4-Zoll-Screens denken
2. **Maximal 3 Taps bis zum Ziel** – Keine tiefen Menüstrukturen
3. **KI ist Vorschlag, nicht Zwang** – Mitarbeiter kann immer manuell überschreiben
4. **Bestätigen statt Ausfüllen** – KI füllt aus, Mensch prüft und bestätigt
5. **Klare Fehlermeldungen** – Nicht „Error 500", sondern „Bericht konnte nicht gespeichert werden. Bitte versuche es erneut."
6. **Offline-Toleranz** – Formulare lokal speichern wenn kein Netz, sync bei Verbindung
7. **Sprachbarriere berücksichtigen** – Icons + kurze Labels, kein langer Fließtext in der UI

---

## 10. Aktueller Entwicklungsstand

| Bereich | Status |
|---------|--------|
| HERO API Dokumentation | ✅ Vollständig dokumentiert |
| Relevante GraphQL Queries identifiziert | ✅ Abgeschlossen |
| n8n Basis-Infrastruktur | ✅ Vorhanden (self-hosted) |
| Ollama lokal verfügbar | ✅ qwen2.5:7b, qwen2.5:14b |
| PostgreSQL verfügbar | ✅ Vorhanden |
| Angular Projekt | 🔲 Noch nicht angelegt |
| n8n Workflows Baustellenbericht | 🔲 In Planung |
| Python PDF-Script | ~~🔲 Entfällt~~ – HERO-native `create_document` wird verwendet |

---

## 11. Entwicklungsreihenfolge (empfohlen)

### Sprint 1 – Baustellenbericht MVP
1. Angular Projekt anlegen (ng new, PWA hinzufügen)
2. Login-Seite + Auth-Service (gegen hartcodierten n8n-Endpoint testen)
3. Projekt-Dropdown Komponente (Daten aus HERO via n8n)
4. KI-Eingabe Komponente mit Speech API
5. Bericht-Formular Seite
6. n8n: `report-preview` Workflow (Ollama)
7. Python: PDF-Generierungsskript (ReportLab)
8. n8n: `report-save` Workflow (PDF + HERO Upload)
9. Integration testen

### Sprint 2 – Zeiterfassung
1. Zeiterfassungs-Seite
2. n8n: `time-parse` Workflow (KI-Parser)
3. Formular-Autofill aus KI-Ergebnis
4. n8n: `time-save` Workflow (HERO Mutation)

### Sprint 3 – Aufgaben + Stabilisierung
1. Aufgaben-Erstellen Seite
2. n8n: `tasks-create` Workflow
3. Offline-Handling (Service Worker Queue)
4. Error Handling verbessern
5. Testing auf echten Mobilgeräten

---

## 12. Offene Fragen / Noch zu klären

- [ ] `document_type_id` für Baustellenberichte in HERO → via `document_types` Query ermitteln
- [ ] HERO REST Endpunkt für File-Upload → URL und Parameter verifizieren
- [ ] PIN-Verwaltung: Wer setzt initiale PINs? (Admin-Bereich oder manuell in DB)
- [ ] Sollen erledigte Berichte in der App sichtbar bleiben (History)?
- [ ] Firmen-Logo für PDF-Kopfzeile vorhanden?
- [ ] Deployment: Wo wird die Angular App gehostet? (Gleiches System wie n8n?)

---

## 13. Wichtige Hinweise für KI-Assistenten

Wenn du diese Spezifikation liest und beim Projekt hilfst, beachte:

- **n8n ist das einzige Backend** – Angular spricht nie direkt mit HERO oder Ollama
- **HERO nutzt GraphQL** – Queries und Mutations als JSON-String im `query`-Feld, Anführungszeichen mit `\"` escapen
- **Ollama läuft lokal** – Endpunkt `http://localhost:11434/api/generate`, kein API-Key nötig
- **`stream: false`** muss bei Ollama-Requests immer gesetzt sein (sonst streaming-Response)
- **HERO Enum-Werte** (z.B. `target: project_match`) dürfen keine Anführungszeichen haben
- **Die App ist mobil-first** – Komponenten müssen auf kleinen Screens funktionieren
- **Mehrsprachige Nutzer** – KI-Prompts immer auf Deutsche Ausgabe optimieren
- Der Entwickler (Sascha) kennt n8n, PostgreSQL, HERO API und Ollama gut – keine Grundlagenerklärungen nötig, direkt zur Implementierung
