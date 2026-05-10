-- Bookamat sync target: raw bookings + per-year tax/insurance settings.
-- Replaces the standalone "accounting" project (Postgres + views) with a
-- single-source-of-truth in MariaDB. View logic is implemented in the
-- BookamatModule's OverviewService instead of as DB views (MariaDB syntax
-- diverges from Postgres and views are harder to test/debug).
--
-- Note: `year` and `year_month` are MariaDB reserved words (data type and
-- INTERVAL keyword respectively) and must be backticked in DDL/DML.

CREATE TABLE IF NOT EXISTS obulus_bookings (
  id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id         INT(10) UNSIGNED NOT NULL,
  bookamat_id     INT NOT NULL,
  title           VARCHAR(255) NOT NULL DEFAULT '',
  type            VARCHAR(255) NOT NULL DEFAULT '',
  `date`          DATE NOT NULL,
  `year`          INT NOT NULL,
  month           INT NOT NULL,
  `year_month`    VARCHAR(7) NOT NULL,
  brutto          DECIMAL(14,2) NOT NULL DEFAULT 0,
  netto           DECIMAL(14,2) NOT NULL DEFAULT 0,
  tax             DECIMAL(14,2) NOT NULL DEFAULT 0,
  is_incoming     TINYINT(1) NOT NULL DEFAULT 0,
  is_private      TINYINT(1) NOT NULL DEFAULT 0,
  is_est          TINYINT(1) NOT NULL DEFAULT 0,
  is_ust          TINYINT(1) NOT NULL DEFAULT 0,
  is_svs          TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_bookings_user_bookamat (user_id, bookamat_id)
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_year         ON obulus_bookings (user_id, `year`);
CREATE INDEX IF NOT EXISTS idx_bookings_user_year_month   ON obulus_bookings (user_id, `year_month`);
CREATE INDEX IF NOT EXISTS idx_bookings_classification    ON obulus_bookings (user_id, `year`, is_incoming, is_private, is_est, is_ust, is_svs);

-- One row per (user, year). Holds projection inputs + tax-bracket configuration.
-- Matches accounting/data-api/src/bookamat/entities/settings.entity.ts 1:1.
CREATE TABLE IF NOT EXISTS obulus_year_settings (
  user_id                          INT(10) UNSIGNED NOT NULL,
  `year`                           INT NOT NULL,
  active_months                    INT NOT NULL DEFAULT 12,
  gehalt                           DECIMAL(14,2) NOT NULL DEFAULT 0,
  umsatz_erwartet                  DECIMAL(14,2) NOT NULL DEFAULT 0,
  ausgaben_erwartet                DECIMAL(14,2) NOT NULL DEFAULT 0,
  sonstige_einnahmen               DECIMAL(14,2) NOT NULL DEFAULT 0,
  sonderausgaben                   DECIMAL(14,2) NOT NULL DEFAULT 0,
  gewinnmindernde_ausgaben         DECIMAL(14,2) NOT NULL DEFAULT 0,
  absetzbeitrag                    DECIMAL(14,2) NOT NULL DEFAULT 0,
  kapitalvermoegen                 DECIMAL(14,2) NOT NULL DEFAULT 0,
  anspruchszinsen                  DECIMAL(14,2) NOT NULL DEFAULT 0,
  svs_vorschreibung_pv             DECIMAL(14,2) NOT NULL DEFAULT 0,
  svs_vorschreibung_kv             DECIMAL(14,2) NOT NULL DEFAULT 0,
  svs_hoechstbeitragsgrundlage     DECIMAL(14,2) NOT NULL DEFAULT 5425.00,
  svs_pensionsversicherung         DECIMAL(8,4)  NOT NULL DEFAULT 0.1850,
  svs_krankenversicherung          DECIMAL(8,4)  NOT NULL DEFAULT 0.0765,
  svs_vorsorge                     DECIMAL(8,4)  NOT NULL DEFAULT 0.0153,
  svs_unfallversicherung           DECIMAL(14,2) NOT NULL DEFAULT 8.90,
  svs_nachbemessen                 DECIMAL(14,2) DEFAULT NULL,
  est_vorschreibung                DECIMAL(14,2) DEFAULT NULL,
  est_festgesetzt                  DECIMAL(14,2) DEFAULT NULL,
  ust_festgesetzt                  DECIMAL(14,2) DEFAULT NULL,
  est_limit_1                      INT NOT NULL DEFAULT 11000,
  est_limit_2                      INT NOT NULL DEFAULT 18000,
  est_limit_3                      INT NOT NULL DEFAULT 31000,
  est_limit_4                      INT NOT NULL DEFAULT 60000,
  est_limit_5                      INT NOT NULL DEFAULT 90000,
  est_limit_6                      INT NOT NULL DEFAULT 1000000,
  PRIMARY KEY (user_id, `year`),
  CONSTRAINT fk_year_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
