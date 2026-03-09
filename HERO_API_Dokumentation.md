# HERO CRM – GraphQL API Dokumentation

**Version:** v7  
**Endpoint:** `https://login.hero-software.de/api/external/v7/graphql`  
**Erstellt:** 05.02.2026

Diese Dokumentation enthält alle verfügbaren Queries (Lesezugriffe) und Mutations (Schreibzugriffe) der HERO CRM GraphQL API.

---

## Authentifizierung

Alle Requests benötigen einen Authorization-Header:

```http
Authorization: Bearer YOUR_HERO_API_TOKEN
```

---

## Grundstruktur

**Query (Lesezugriff):**
```json
{ "query": "{ contacts(search: \"Müller\") { id name } }" }
```

**Mutation (Schreibzugriff):**
```json
{ "query": "mutation { create_project_match(project_match: { name: \"Projekt\" }) { id } }" }
```

---

## Queries (Daten abrufen)

Queries werden verwendet, um Daten aus dem CRM abzurufen. Sie verändern keine Daten.

### Kontakte & Kunden

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `contacts` | Kontakte/Kunden suchen und filtern | `search`, `category`, `ids`, `show_deleted`, `first`, `offset` |
| `global_search` | Globale Suche über alle Bereiche | `term`, `category`, `first`, `offset` |
| `countries` | Liste aller Länder | – |

### Projekte

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `project_match` | Einzelnes Projekt abrufen | `project_match_id` |
| `project_matches` | Projekte suchen und filtern | `search`, `customer_id`, `statuses`, `type_ids`, `assigned_user_ids`, `overdue`, `first`, `offset` |
| `project_types` | Alle aktiven Projekttypen | `ids`, `is_active`, `first`, `offset` |
| `project_histories` | Projekt-Historie / Logbuch | `project_match_id`, `user_ids`, `show_system_histories`, `search_term` |
| `project_match_checklists` | Checklisten für Projekt | `project_match_id`, `first`, `offset` |

### Kalender & Termine

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `calendar_events` | Kalendereinträge abrufen | `start`, `end`, `project_match_id`, `partner_ids`, `show_deleted`, `first`, `offset` |
| `search_calendar_events` | Termine nach Name suchen | `search`, `startDate`, `showDeleted`, `first`, `offset` |
| `calendar_imports` | Importierte Kalender | – |
| `calendar_event_categories` | Termin-Kategorien | `show_deleted` |
| `holidays` | Feiertage | `start`, `end`, `state_ids` |

### Aufgaben & Zeiterfassung

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `tasks` | Aufgaben abrufen | `project_match_id`, `start`, `end`, `is_done`, `target_user_ids`, `author_user_ids` |
| `tracking_times` | Zeiterfassungen | `project_match_id`, `start`, `end`, `partner_ids`, `statuses`, `tracking_times_category_ids` |
| `tracking_times_categories` | Kategorien für Zeiterfassung | `is_working_time`, `is_active`, `is_protected` |
| `tracking_time_balance` | Zeitkonto-Stand | `start`, `end`, `partner_id` |

### Dokumente & Dateien

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `customer_documents` | Kundendokumente (Rechnungen, Angebote) | `ids`, `project_match_ids`, `status_codes`, `document_type_ids`, `invoice_style` |
| `document_types` | Dokumenttypen | `show_deleted`, `user_write_allowed`, `base_types`, `context` |
| `file_uploads` | Hochgeladene Dateien | `uuids`, `first`, `offset` |
| `file_upload_folders` | Datei-Ordner | `show_deleted`, `first`, `offset` |
| `upload_image_categories` | Bild-Kategorien | `project_match_id`, `target`, `target_id` |

### Außendienst & Jobs

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `field_service_jobs` | Außendienst-Aufträge | `project_match_id`, `start`, `end`, `status`, `partners`, `contact_id`, `search` |
| `field_service_job` | Einzelner Job | `id` |
| `job_checklists` | Checklisten für Jobs | `job_id`, `first`, `offset` |
| `field_service_checklist_templates` | Checklisten-Vorlagen | `ids`, `first`, `offset` |
| `field_service_object` | Service-Objekt | `id` |

### Personal & Abwesenheiten

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `user` | Aktueller Benutzer | – |
| `company` | Firmendaten | – |
| `configuration` | Plattform-Konfiguration | – |
| `absences` | Abwesenheiten | `start`, `end`, `partner_ids`, `statuses`, `show_all_partners` |
| `absence_balance` | Urlaubskonto | `year`, `partner_id` |
| `absence_budget` | Abwesenheits-Budget | `start`, `end`, `type`, `start_budget`, `end_budget` |
| `partner_birthdays` | Mitarbeiter-Geburtstage | `nextDays`, `first`, `offset` |
| `resources` | Firmen-Ressourcen | `show_deleted` |

### Benachrichtigungen & Historie

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `notifications` | Benachrichtigungen abrufen | `first`, `offset`, `orderBy` |
| `histories` | Logbuch-Einträge | `first`, `offset`, `orderBy` |

### Lieferungen & Produkte

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `supply_texts` | Lieferungstexte | `first`, `offset`, `orderBy` |
| `supply_product_versions` | Produkt-Versionen | `product_ids`, `search`, `first`, `offset` |
| `supply_services` | Dienstleistungen | `service_ids`, `search`, `first`, `offset` |

### Buchhaltung

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `costcenters` | Kostenstellen | `ids`, `number`, `skr_number` |
| `bookaccounts` | Buchungskonten | `ids`, `name`, `type` |
| `receipts` | Belege | `ids`, `status_code`, `number`, `tax_id`, `customer_id` |

### Benutzerdefinierte Felder

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `custom_fields_schemas` | Schemas für Custom Fields | `schemaIds`, `first`, `offset` |
| `custom_field_records` | Custom Field Datensätze | `relation`, `schemaIds`, `relationIds` |

### E-Mail Templates

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `email_template` | Einzelne E-Mail-Vorlage | `email_template_id` |
| `EmailTemplate_EmailTemplates` | Liste aller E-Mail-Vorlagen | `filters`, `sortings`, `first`, `offset` |

### Sonstiges

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `echo` | Test-Endpoint | `message` |

---

## Mutations (Daten ändern)

Mutations werden verwendet, um Daten im CRM zu erstellen, zu aktualisieren oder zu löschen.

### Kontakte & Kunden

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `create_contact` | Neuen Kontakt/Kunden anlegen | `contact` (CustomerInput), `findExisting` |
| `update_contact` | Kontakt aktualisieren | `contact` (CustomerInput) |
| `create_customer_address` | Kundenadresse anlegen | `customer_address`, `findExisting` |
| `update_customer_address` | Kundenadresse aktualisieren | `customer_address` |

### Projekte

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `create_project_match` | Neues Projekt anlegen | `project_match`, `manual_assigned_user_ids` |
| `update_project_match` | Projekt aktualisieren | `project_match`, `manual_assigned_user_ids` |
| `add_project_match_assignments` | Mitarbeiter zu Projekt zuweisen | `project_match_id`, `assigned_user_ids` |
| `delete_project_match_assignments` | Mitarbeiter von Projekt entfernen | `project_match_id`, `assigned_user_ids` |
| `update_project_match_assignments` | Projekt-Zuweisung aktualisieren | `project_match_id`, `assigned_user_ids` |
| `create_project_export` | Projekt exportieren | `match_id`, `options` |
| `create_project_type` | Projekttyp anlegen | `project_type` |
| `update_project_type` | Projekttyp aktualisieren | `project_type` |

### Kalender & Termine

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `create_calendar_event` | Termin anlegen | `calendar_event` |
| `update_calendar_event` | Termin aktualisieren | `calendar_event` |
| `delete_calendar_event` | Termin löschen | `id` |
| `create_calendar_import` | Kalender-Import anlegen | `calendar_import`, `partner_ids` |
| `update_calendar_import` | Kalender-Import aktualisieren | `calendar_import` |
| `delete_calendar_import` | Kalender-Import löschen | `uid` |
| `create_calendar_share_link` | iCal-Link erstellen | `categories`, `events` |

### Aufgaben & Zeiterfassung

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `update_task` | Aufgabe aktualisieren | `task` |
| `update_tracking_time` | Zeiterfassung aktualisieren | `tracking_time` |

### Dokumente

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `create_document` | Dokument erstellen | `input`, `actions` |
| `upload_document` | Dokument hochladen und zuweisen | `document`, `file_upload_uuid`, `target`, `target_id` |
| `delete_document` | Dokument löschen | `document_id` |
| `submit_document_signature` | Dokument signieren | `document_id`, `signature_node` |
| `create_payment` | Zahlung erfassen | `document_id`, `payment` |

### Dateien & Bilder

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `update_file_upload` | Datei-Upload aktualisieren | `id`, `filename`, `image_category`, `delete` |
| `upload_image` | Bild zu Objekt hinzufügen | `file_upload_uuid`, `target`, `target_id` |
| `rotate_image` | Bild drehen | `id`, `direction` |

### Außendienst & Jobs

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `create_field_service_job` | Job anlegen | `job` |
| `update_field_service_job` | Job aktualisieren | `job` |
| `add_field_service_job_assignment` | Mitarbeiter zu Job zuweisen | `job_id`, `partner_id` |
| `remove_field_service_job_assignment` | Mitarbeiter von Job entfernen | `job_id`, `partner_id` |
| `create_field_service_checklist` | Checkliste erstellen | `job_id` / `project_match_id`, `checklist` |
| `update_field_service_checklist` | Checkliste aktualisieren | `checklist` |
| `create_field_service_checklist_template` | Checklisten-Vorlage erstellen | `checklist_template` |
| `update_field_service_checklist_template` | Checklisten-Vorlage aktualisieren | `checklist_template` |
| `update_field_service_object` | Service-Objekt aktualisieren | `service_object` |
| `delete_checklist` | Checkliste löschen | `checklist_id` |

### Personal & Abwesenheiten

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `add_partner` | Mitarbeiter hinzufügen | `partner` |
| `update_partner` | Mitarbeiter aktualisieren | `partner` |
| `update_user_data` | Benutzerdaten aktualisieren | `user_data` |
| `set_user_password` | Passwort ändern | `old`, `new` |
| `create_absence` | Abwesenheit anlegen | `absence` |
| `update_absence` | Abwesenheit aktualisieren | `absence` |

### Benachrichtigungen & Logbuch

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `read_notifications` | Benachrichtigungen als gelesen markieren | `ids` |
| `add_logbook_entry` | Logbuch-Eintrag hinzufügen | `logbook_entry` |
| `add_weather_logbook_entry` | Wetter-Eintrag erstellen | `project_match_id` |

### E-Mail & Kommunikation

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `send_mail` | E-Mail senden | `email` |
| `create_email_template` | E-Mail-Vorlage erstellen | `email_template`, `copy_from_template_id` |
| `update_email_template` | E-Mail-Vorlage aktualisieren | `email_template` |

### Firma & Konto

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `update_company` | Firmendaten aktualisieren | `data` |
| `delete_company_account` | Firmenkonto löschen | `password` |

### Lieferungen & Produkte

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `create_supply_product_version` | Produkt-Version erstellen | `supply_product_version` |
| `update_supply_product_version` | Produkt-Version aktualisieren | `supply_product_version` |
| `create_supply_service` | Dienstleistung erstellen | `supply_service` |
| `update_supply_service` | Dienstleistung aktualisieren | `supply_service` |
| `create_stock_material` | Lagermaterial erstellen | `stock_material` |

### Benutzerdefinierte Felder

| Name | Beschreibung | Parameter |
|------|-------------|-----------|
| `create_custom_field_schema` | Schema erstellen | `relates` |
| `add_custom_fields_to_schema` | Felder zu Schema hinzufügen | `properties`, `schemaId` |
| `update_custom_fields_in_schema` | Felder im Schema aktualisieren | `properties`, `schemaId` |
| `remove_custom_field_from_schema` | Feld aus Schema entfernen | `schemaId`, `propertyUuid` |
| `set_custom_field_value` | Feldwert setzen | `schemaId`, `relationId`, `properties` |

---

## Verwendungsbeispiele

### Kontakte suchen

```graphql
{
  contacts(search: "Müller", first: 10) {
    edges {
      node {
        id
        name
        email
        phone
      }
    }
  }
}
```

### Projekte mit Gewerk abrufen

```graphql
{
  project_matches {
    id
    name
    volume
    measure_id
    measure {
      name
      short
    }
  }
}
```

### Zeiterfassung aller Mitarbeiter

```graphql
{
  tracking_times(show_all_partners: true) {
    project_match_id
    project_match { name }
    partner { full_name }
    start
    end
    duration_in_seconds
    category_name
    comment
    status_code
  }
}
```

### Kalendertermine für ein Projekt

```graphql
{
  calendar_events(project_match_id: 12958) {
    start
    end
    title
    partners {
      full_name
    }
  }
}
```

### Dokumente abrufen

```graphql
{
  customer_documents {
    id
    created
    nr
    value
    vat
    status_code
    partner_id
    project_match_id
    project_match { name }
    document_type {
      id
      name
    }
    file_upload {
      url
    }
  }
}
```

### Dokument hochladen (Mutation)

```graphql
mutation {
  upload_document(
    target: project_match,
    target_id: 12958,
    file_upload_uuid: "abc123uuid",
    document: {
      document_type_id: 26
    }
  ) {
    id
  }
}
```

> **Hinweis:** `target: project_match` ist ein Enum-Wert – **keine Anführungszeichen** verwenden.

### Projekt erstellen (Mutation)

```graphql
mutation {
  create_project_match(
    project_match: {
      name: "Sanierungsprojekt Musterstraße"
      customer_id: 123
      project_type_id: 5
    }
  ) {
    id
    name
    status
  }
}
```

---

## Introspection

Verfügbare Endpunkte abfragen:

```json
{ "query": "{ __schema { queryType { fields { name description } } } }" }
```

Felder eines bestimmten Typs abfragen:

```json
{ "query": "{ __type(name: \"TrackingTime\") { fields { name } } }" }
```

---

## n8n Integration

**HTTP Request Node – Konfiguration:**

| Feld | Wert |
|------|------|
| Method | `POST` |
| URL | `https://login.hero-software.de/api/external/v7/graphql` |
| Body Content-Type | `JSON` |
| Header | `Authorization: Bearer {{ $credentials.heroApiToken }}` |

**Wichtig:** Alle GraphQL-Queries müssen als einzeiliger String im `query`-Feld stehen. Anführungszeichen innerhalb des Queries mit `\"` escapen.

**Beispiel Body:**
```json
{
  "query": "{ tracking_times(show_all_partners: true) { project_match_id partner { full_name } start end duration_in_seconds } }"
}
```

**Dynamische Parameter mit Expressions:**
```json
{
  "query": "{ calendar_events(project_match_id: {{ $json.project_match_id }}) { start end title } }"
}
```
