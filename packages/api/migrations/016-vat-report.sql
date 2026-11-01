-- UVA und ZM aus Obolus.
--
-- Pro Jahr: Abgabezeitraum der UVA und der ZM (Monat/Quartal) und die
-- Besteuerungsart (Ist/Soll). Der Sync übernimmt sie aus Bookamats
-- Grundeinstellungen; NULL heißt „wie das Vorjahr, sonst Quartal und Ist“.
-- Die Kennzahlen der Konten kommen im JSON von obulus_bookamat_accounts mit.
ALTER TABLE obulus_year_settings
  ADD COLUMN vat_period VARCHAR(10) NULL,
  ADD COLUMN vat_method VARCHAR(10) NULL,
  ADD COLUMN zm_period VARCHAR(10) NULL;
