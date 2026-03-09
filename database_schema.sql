-- ============================================================
-- MitraApp – PostgreSQL Datenbankschema
-- Direkt auf dem Server ausführen (hat n8n-Zugriff)
-- ============================================================

-- Mitarbeiter (eigene Auth, unabhängig von HERO)
CREATE TABLE IF NOT EXISTS employees (
  id               SERIAL PRIMARY KEY,
  hero_partner_id  INT,                          -- Verknüpfung zum HERO-Partner
  name             VARCHAR(100) NOT NULL,
  pin_hash         VARCHAR(255) NOT NULL,         -- bcrypt-gehashte PIN (4-6 Stellen)
  role             VARCHAR(20) DEFAULT 'worker',  -- 'worker', 'foreman', 'admin'
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Projekte (Cache aus HERO, täglich synchronisiert)
CREATE TABLE IF NOT EXISTS projects_cache (
  id               INT PRIMARY KEY,              -- HERO project_match_id
  name             VARCHAR(255),
  measure_short    VARCHAR(20),
  is_active        BOOLEAN DEFAULT true,
  synced_at        TIMESTAMP DEFAULT NOW()
);

-- Baustellenberichte (lokaler Log + Status-Tracking)
CREATE TABLE IF NOT EXISTS reports (
  id               SERIAL PRIMARY KEY,
  employee_id      INT REFERENCES employees(id),
  project_match_id INT,
  report_date      DATE,
  raw_input        TEXT,                          -- Originaltext des Mitarbeiters
  generated_text   TEXT,                          -- KI-generierter Berichtstext
  materials        TEXT,
  hero_document_id VARCHAR(100),                  -- UUID nach erfolgreichem HERO-Upload
  status           VARCHAR(20) DEFAULT 'draft',   -- 'draft', 'submitted', 'error'
  created_at       TIMESTAMP DEFAULT NOW()
);

-- Zeiterfassungen (lokaler Log + Status-Tracking)
CREATE TABLE IF NOT EXISTS time_entries (
  id               SERIAL PRIMARY KEY,
  employee_id      INT REFERENCES employees(id),
  project_match_id INT,
  work_date        DATE,
  start_time       TIME,
  end_time         TIME,
  break_minutes    INT DEFAULT 0,
  net_hours        DECIMAL(4,2),
  category_id      INT,                           -- HERO tracking_times_category_id
  comment          TEXT,
  hero_entry_id    VARCHAR(100),                  -- ID nach erfolgreichem HERO-Eintrag
  status           VARCHAR(20) DEFAULT 'draft',   -- 'draft', 'submitted', 'error'
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- Beispiel-Mitarbeiter (Passwort: "1234" – bcrypt ersetzen!)
-- PIN-Hashes müssen mit bcrypt generiert werden, z.B. via n8n
-- ============================================================
-- INSERT INTO employees (name, pin_hash, role) VALUES
--   ('Admin', '$2b$10$...', 'admin'),
--   ('Max Mustermann', '$2b$10$...', 'worker');
