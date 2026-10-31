-- Monatsabgleich Geschäftskonto ↔ Bookamat.
--
-- 1) obulus_bookings behält ab jetzt alle Felder einer Bookamat-Buchung, nicht
--    nur Summen: Rechnungs-/Liefer-/Bestelldatum, UID, Land, Beschreibung und die
--    einzelnen Beträge (Zahlungs-, Steuer-, USt-Konto, Satz, Abzugsfähigkeit …)
--    als JSON. Daraus lernt der Abgleich, wie ein Vorgang bisher gebucht wurde.
--    Alt-Zeilen aus dem Seed bleiben leer, bis ihr Jahr neu synchronisiert wird.
ALTER TABLE obulus_bookings
  ADD COLUMN document_number VARCHAR(20) NULL AFTER title,
  ADD COLUMN date_invoice DATE NULL AFTER `date`,
  ADD COLUMN date_delivery DATE NULL AFTER date_invoice,
  ADD COLUMN date_order DATE NULL AFTER date_delivery,
  ADD COLUMN vatin VARCHAR(40) NULL AFTER tax,
  ADD COLUMN country VARCHAR(4) NULL AFTER vatin,
  ADD COLUMN costcentre VARCHAR(255) NULL AFTER country,
  ADD COLUMN description TEXT NULL AFTER costcentre,
  ADD COLUMN amounts LONGTEXT NULL AFTER description,
  ADD COLUMN attachment_count INT NOT NULL DEFAULT 0 AFTER amounts;

-- 2) Aktivierte Konten pro Bookamat-Jahr (Steuerkonten, USt-Konten,
--    Zahlungskonten, Kostenstellen). Bookamat vergibt die IDs pro Jahr neu,
--    deshalb wird beim Übertragen über den Namen im Zieljahr aufgelöst.
--    `data` hält die Flags (reverse_charge, ic_*, tax_values, erlaubte
--    USt-Konten eines Steuerkontos …) als JSON.
CREATE TABLE IF NOT EXISTS obulus_bookamat_accounts (
  id            INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id       INT(10) UNSIGNED NOT NULL,
  `year`        INT NOT NULL,
  kind          VARCHAR(16) NOT NULL,
  bookamat_id   INT NOT NULL,
  name          VARCHAR(255) NOT NULL,
  data          LONGTEXT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookamat_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_bookamat_accounts (user_id, `year`, kind, bookamat_id)
);

-- 3) Entscheidungen zu einzelnen Kontobewegungen aus Umsatz: von Hand mit einer
--    Bookamat-Buchung verknüpft, ignoriert (braucht keine Buchung) oder aus
--    Obolus übertragen. Automatische Zuordnungen werden nicht gespeichert,
--    sondern bei jedem Aufruf neu berechnet. Die Kontodaten selbst bleiben in
--    Umsatz; hier steht nur deren ID.
CREATE TABLE IF NOT EXISTS obulus_bank_matches (
  id              INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id         INT(10) UNSIGNED NOT NULL,
  umsatz_id       VARCHAR(64) NOT NULL,
  bookamat_id     INT NULL,
  ignored         TINYINT(1) NOT NULL DEFAULT 0,
  transferred_at  DATETIME NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_bank_matches_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_bank_matches_user_umsatz (user_id, umsatz_id)
);
