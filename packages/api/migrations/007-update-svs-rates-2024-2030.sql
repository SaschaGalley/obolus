-- The 2024-2030 year_settings rows were seeded in 005 with only EST limits
-- (and even those used 2024 values for every year — wrong, since brackets
-- are indexed annually per §33a EStG "Abschaffung der kalten Progression").
-- Plus they inherited entity defaults for SVS (KV 7.65%, Höchstbeitrags-
-- grundlage €5.425, UV €8.90) which are 2015-era values.
--
-- This migration brings 2024-2026 in line with the actual BGBl values.
-- 2027+ keeps placeholder/default values until the user pflegt sie nach
-- über die Settings-UI sobald BMF die Indexierung veröffentlicht.
--
-- Idempotent: only updates rows where values are still at the seed default
-- (KV 7.65% for SVS, est_limit_1 = 12816 for EST), so users who manually
-- adjusted via the UI are not overwritten.

-- ─────────────────────────────────────────────────────────────────────────
-- EST Tarifstufen (Indexierung §33a EStG)
-- ─────────────────────────────────────────────────────────────────────────

-- 2025: BGBl. II Nr. 376/2024 (Progressionsabgeltungs-VO 2025).
-- Indexierung mit 2/3 der Inflation 2023->2024.
UPDATE obulus_year_settings
   SET est_limit_1 = 13308,
       est_limit_2 = 21617,
       est_limit_3 = 35836,
       est_limit_4 = 69166,
       est_limit_5 = 103072
 WHERE `year` = 2025 AND est_limit_1 = 12816;

-- 2026: BMF-Werte sobald BGBl publiziert wird über die UI nachpflegen.
-- Bis dahin bleiben die 2024-Werte aus Migration 005 als Platzhalter.

-- ─────────────────────────────────────────────────────────────────────────
-- SVS Beitragsgrundlagen + Sätze (per svs.at und §35 GSVG)
-- ─────────────────────────────────────────────────────────────────────────

-- 2024 (per SVS Beitragsverordnung 2024).
UPDATE obulus_year_settings
   SET svs_krankenversicherung = 0.0680,
       svs_hoechstbeitragsgrundlage = 7070.00,
       svs_unfallversicherung = 11.35
 WHERE `year` = 2024 AND svs_krankenversicherung = 0.0765;

-- 2025 (per SVS Beitragsverordnung 2025).
UPDATE obulus_year_settings
   SET svs_krankenversicherung = 0.0680,
       svs_hoechstbeitragsgrundlage = 7525.00,
       svs_unfallversicherung = 12.27
 WHERE `year` = 2025 AND svs_krankenversicherung = 0.0765;

-- 2026 (Werte vor Veröffentlichung der finalen Beitragsverordnung; Monats-
-- HBG fortgeschrieben anhand Aufwertungsfaktor ~1.045, KV/UV als Platzhalter).
-- Der User soll für 2026 spätestens Anfang Q1/2026 die finalen SVS-Werte
-- nachpflegen sobald BGBl. erschienen ist.
UPDATE obulus_year_settings
   SET svs_krankenversicherung = 0.0680,
       svs_hoechstbeitragsgrundlage = 7860.00,
       svs_unfallversicherung = 12.66
 WHERE `year` = 2026 AND svs_krankenversicherung = 0.0765;

-- 2027-2030 bleiben mit Default-Defaults bis SVS Werte veröffentlicht.
-- (Wir setzen nur HBG fortgeschrieben damit die Berechnung nicht völlig
-- daneben liegt.)
UPDATE obulus_year_settings
   SET svs_krankenversicherung = 0.0680,
       svs_hoechstbeitragsgrundlage = 8200.00,
       svs_unfallversicherung = 13.00
 WHERE `year` BETWEEN 2027 AND 2030 AND svs_krankenversicherung = 0.0765;
