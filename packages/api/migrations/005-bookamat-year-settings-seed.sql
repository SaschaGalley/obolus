-- Seed default year settings for every existing user. Idempotent (INSERT IGNORE).
-- The values mirror accounting/data-api/src/database/seeds/001.settings.seed.ts
-- for years 2015-2023; for 2024+ we only seed the row with default est limits.
-- The user can adjust via the UI.

-- Years 2024..2030 with default brackets (est_limit defaults from 2023 baseline).
INSERT IGNORE INTO obulus_year_settings (user_id, `year`, est_limit_1, est_limit_2, est_limit_3, est_limit_4, est_limit_5, est_limit_6)
SELECT u.id, y.`year`, 12816, 20818, 34513, 66612, 99266, 1000000
FROM users u
CROSS JOIN (
  SELECT 2024 AS `year` UNION ALL SELECT 2025 UNION ALL SELECT 2026 UNION ALL
  SELECT 2027 UNION ALL SELECT 2028 UNION ALL SELECT 2029 UNION ALL SELECT 2030
) y;

-- Year 2023 (last year covered by the legacy seed).
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, gehalt, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_krankenversicherung, svs_unfallversicherung, est_vorschreibung,
   est_limit_1, est_limit_2, est_limit_3, est_limit_4, est_limit_5, est_limit_6)
SELECT id, 2023, 3000, 84000, 5000, 1116,
       6615, 6615, 6615,
       0.0680, 10.64, 10977,
       11693, 19134, 32075, 62080, 93120, 1000000
FROM users;

-- Year 2022.
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, gehalt, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_krankenversicherung, svs_unfallversicherung, est_vorschreibung)
SELECT id, 2022, 3000, 84000, 5000, 1116,
       6615, 6615, 6615,
       0.0680, 10.64, 10977
FROM users;

-- Year 2021.
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, gehalt, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   gewinnmindernde_ausgaben,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_krankenversicherung, svs_unfallversicherung, est_vorschreibung)
SELECT id, 2021, 3000, 85000, 5000, 1116,
       1600,
       5500, 5500, 6475,
       0.0680, 10.42, 12000
FROM users;

-- Year 2020.
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, gehalt, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_krankenversicherung, svs_unfallversicherung, svs_nachbemessen,
   est_vorschreibung, est_festgesetzt, ust_festgesetzt)
SELECT id, 2020, 3000, 85000, 5000, 1116,
       5046.84, 5046.84, 6265,
       0.0680, 10.09, 14826.84,
       12000, 10071, -1172.38
FROM users;

-- Year 2019.
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, gehalt, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   gewinnmindernde_ausgaben,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_unfallversicherung, svs_nachbemessen,
   est_vorschreibung, est_festgesetzt, ust_festgesetzt)
SELECT id, 2019, 3000, 85000, 5000, 1996,
       5000,
       6090, 6090, 6090,
       9.6, 14826.84,
       16217, 14759, -1632.95
FROM users;

-- Year 2018.
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, gehalt, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_unfallversicherung, svs_nachbemessen,
   est_vorschreibung, est_festgesetzt, ust_festgesetzt)
SELECT id, 2018, 2800, 85000, 16000, 1020,
       5640.03, 5640.03, 5980,
       9.6, 14826.84,
       16217, 21473, 2677.63
FROM users;

-- Year 2017.
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, gehalt, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   kapitalvermoegen,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_unfallversicherung, svs_nachbemessen,
   est_vorschreibung, est_festgesetzt, ust_festgesetzt)
SELECT id, 2017, 2800, 85000, 5000, 900,
       22.63,
       723.52, 425.70, 5810,
       9.6, 14826.84,
       20339, 15594, 7190.25
FROM users;

-- Year 2016.
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, umsatz_erwartet, ausgaben_erwartet, sonderausgaben,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_nachbemessen, est_vorschreibung, est_festgesetzt, ust_festgesetzt)
SELECT id, 2016, 85000, 5000, 60,
       723.52, 415.72, 5670,
       17978.16, 0, 22747, 10627.67
FROM users;

-- Year 2015 (special: only 11 active months, kapitalvermögen + sonstige + anspruchszinsen).
INSERT IGNORE INTO obulus_year_settings
  (user_id, `year`, active_months, umsatz_erwartet, ausgaben_erwartet,
   sonstige_einnahmen, sonderausgaben, absetzbeitrag, anspruchszinsen,
   svs_vorschreibung_pv, svs_vorschreibung_kv, svs_hoechstbeitragsgrundlage,
   svs_nachbemessen, est_vorschreibung, est_festgesetzt, ust_festgesetzt)
SELECT id, 2015, 11, 85000, 5000,
       1718.14, 60, 256.32, 72.33,
       706.56, 724.02, 5425,
       15255.57, 0, 18660, 15547.72
FROM users;
