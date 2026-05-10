-- Seed legacy bookings (2015-2023) from /Volumes/storage/workspace/troop/accounting/dump.sql.
-- Bookamat dropped these older years from their retention window, so they
-- can no longer be re-imported via the API. Idempotent: INSERT IGNORE keyed
-- on (user_id, bookamat_id). For new users this is a no-op (only existing
-- users get backfilled).

INSERT IGNORE INTO obulus_bookings
  (user_id, bookamat_id, title, type, `date`, `year`, month, `year_month`,
   brutto, netto, tax, is_incoming, is_private, is_est, is_ust, is_svs)
SELECT u.id, v.* FROM users u, (
  SELECT 116295 AS bookamat_id, 'Einzahlung' AS title, 'Privateinlagen (allgemein)' AS type, '2015-01-22' AS `date`, 2015 AS `year`, 1 AS month, '2015-01' AS `year_month`, 500 AS brutto, 500 AS netto, 0 AS tax, 1 AS is_incoming, 1 AS is_private, 0 AS is_est, 0 AS is_ust, 0 AS is_svs UNION ALL
  SELECT 116313, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2015-02-04', 2015, 2, '2015-02', 72.67, 72.67, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 1869, 'Rechnung 001/2015', 'Einnahmen', '2015-02-16', 2015, 2, '2015-02', 1462.5, 1218.75, 243.75, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116296, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-02-23', 2015, 2, '2015-02', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 4012, 'Rechnung 005/2015', 'Einnahmen', '2015-02-23', 2015, 2, '2015-02', 4236, 3530, 706, 1, 0, 0, 0, 0 UNION ALL
  SELECT 4013, 'Rechnung 003/2015', 'Einnahmen', '2015-02-24', 2015, 2, '2015-02', 2408, 2006.67, 401.33, 1, 0, 0, 0, 0 UNION ALL
  SELECT 4014, 'Rechnung 004/2015', 'Einnahmen', '2015-02-24', 2015, 2, '2015-02', 1956, 1630, 326, 1, 0, 0, 0, 0 UNION ALL
  SELECT 3800, 'Rechnung 002/2015', 'Einnahmen', '2015-03-03', 2015, 3, '2015-03', 3000, 2500, 500, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116320, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2015-03-09', 2015, 3, '2015-03', 255.09, 255.09, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6509, 'all-inkl Domaingebühren', 'Lizenzgebühren', '2015-03-12', 2015, 3, '2015-03', 35.1, 29.25, 5.85, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116297, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-03-17', 2015, 3, '2015-03', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 7935, 'Rechnung 008/2015', 'Einnahmen', '2015-03-18', 2015, 3, '2015-03', 2100, 1750, 350, 1, 0, 0, 0, 0 UNION ALL
  SELECT 8066, 'Rechnung 006/2015', 'Einnahmen', '2015-03-19', 2015, 3, '2015-03', 3600, 3000, 600, 1, 0, 0, 0, 0 UNION ALL
  SELECT 8067, 'Rechnung 007/2015', 'Einnahmen', '2015-03-19', 2015, 3, '2015-03', 4251, 3542.5, 708.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 9467, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-03-25', 2015, 3, '2015-03', 97.71, 97.71, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116314, 'Kontoführungsgebühren', 'Ungeklärte Ausgaben', '2015-03-31', 2015, 3, '2015-03', 3.73, 3.73, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116298, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-03-31', 2015, 3, '2015-03', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 9745, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-04-01', 2015, 4, '2015-04', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116315, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2015-04-07', 2015, 4, '2015-04', 49.62, 49.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 12250, 'Rechnung 009/2015', 'Einnahmen', '2015-04-15', 2015, 4, '2015-04', 3335.8, 2779.83, 555.97, 1, 0, 0, 0, 0 UNION ALL
  SELECT 13247, 'Rechung 010/2015', 'Einnahmen', '2015-04-20', 2015, 4, '2015-04', 390, 325, 65, 1, 0, 0, 0, 0 UNION ALL
  SELECT 13628, 'Wirtschaftskammer Grundumlagen', 'Werbekosten', '2015-04-22', 2015, 4, '2015-04', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116299, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-04-24', 2015, 4, '2015-04', 1500, 1500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 13760, 'Rechung 012/2015', 'Einnahmen', '2015-04-24', 2015, 4, '2015-04', 5304, 4420, 884, 1, 0, 0, 0, 0 UNION ALL
  SELECT 14355, 'Rechnung 011/2015', 'Einnahmen', '2015-04-27', 2015, 4, '2015-04', 2880, 2400, 480, 1, 0, 0, 0, 0 UNION ALL
  SELECT 14711, 'Ust 1-3/2015', 'Umsatzsteuer laufendes Jahr', '2015-04-29', 2015, 4, '2015-04', 3587.54, 3587.54, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 14845, 'Druck.at Visitenkarten', 'Werbekosten', '2015-04-30', 2015, 4, '2015-04', 53.23, 53.23, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 15935, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-05-04', 2015, 5, '2015-05', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 15614, 'Rechnung 014/2015', 'Einnahmen', '2015-05-04', 2015, 5, '2015-05', 624, 520, 104, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116316, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2015-05-05', 2015, 5, '2015-05', 542.49, 542.49, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 15634, 'Rechnung 015/2015', 'Einnahmen', '2015-05-08', 2015, 5, '2015-05', 3190.2, 2658.5, 531.7, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116300, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-05-13', 2015, 5, '2015-05', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 20787, 'Sozialversicherung', 'Sozialversicherung', '2015-05-15', 2015, 5, '2015-05', 1030.4, 1030.4, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 15613, 'Rechnung 013/2015', 'Einnahmen', '2015-05-26', 2015, 5, '2015-05', 1824, 1520, 304, 1, 0, 0, 0, 0 UNION ALL
  SELECT 20269, 'Rechnung 016/2015', 'Einnahmen', '2015-05-26', 2015, 5, '2015-05', 5100, 4250, 850, 1, 0, 0, 0, 0 UNION ALL
  SELECT 24195, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-06-01', 2015, 6, '2015-06', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116301, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-06-02', 2015, 6, '2015-06', 1500, 1500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 22275, 'Rechnung 017/2015', 'Einnahmen', '2015-06-03', 2015, 6, '2015-06', 2700, 2250, 450, 1, 0, 0, 0, 0 UNION ALL
  SELECT 24391, 'Rechnung 018/2015', 'Einnahmen', '2015-06-03', 2015, 6, '2015-06', 702, 585, 117, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116317, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2015-06-05', 2015, 6, '2015-06', 89.78, 89.78, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116302, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-06-10', 2015, 6, '2015-06', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 24392, 'Rechnung 019/2015', 'Einnahmen', '2015-06-17', 2015, 6, '2015-06', 3300, 2750, 550, 1, 0, 0, 0, 0 UNION ALL
  SELECT 30154, 'Kartenentgelt BankCard', 'Geschäftskonto & Geldverkehr', '2015-06-30', 2015, 6, '2015-06', 5.64, 5.64, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29046, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-07-01', 2015, 7, '2015-07', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 26236, 'Rechnung 020/2015', 'Einnahmen', '2015-07-02', 2015, 7, '2015-07', 2297.1, 1914.25, 382.85, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116318, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2015-07-06', 2015, 7, '2015-07', 185.47, 185.47, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 27696, 'Rechnung 021/2015', 'Einnahmen', '2015-07-06', 2015, 7, '2015-07', 1800, 1500, 300, 1, 0, 0, 0, 0 UNION ALL
  SELECT 31152, 'PHP Magazin Abonnement', 'Zeitungen, Fachliteratur', '2015-07-09', 2015, 7, '2015-07', 68.29, 68.29, 13.66, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116303, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-07-10', 2015, 7, '2015-07', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 28932, 'Rechnung 023/2015', 'Einnahmen', '2015-07-10', 2015, 7, '2015-07', 2150.2, 1791.83, 358.37, 1, 0, 0, 0, 0 UNION ALL
  SELECT 28933, 'Rechnung 024/2015', 'Einnahmen', '2015-07-17', 2015, 7, '2015-07', 3900, 3250, 650, 1, 0, 0, 0, 0 UNION ALL
  SELECT 35452, 'Rechnung 025/2015', 'Einnahmen', '2015-07-30', 2015, 7, '2015-07', 468, 390, 78, 1, 0, 0, 0, 0 UNION ALL
  SELECT 35450, 'Rechnung 026/2015', 'Einnahmen', '2015-07-31', 2015, 7, '2015-07', 750, 625, 125, 1, 0, 0, 0, 0 UNION ALL
  SELECT 35451, 'Rechnung 027/2015', 'Einnahmen', '2015-07-31', 2015, 7, '2015-07', 741, 617.5, 123.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 37588, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-08-03', 2015, 8, '2015-08', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116304, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-08-04', 2015, 8, '2015-08', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 37597, 'Ust 4-6/2015', 'Umsatzsteuer laufendes Jahr', '2015-08-12', 2015, 8, '2015-08', 4745.44, 4745.44, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 37591, 'Rechnung 028/2015', 'Einnahmen', '2015-08-14', 2015, 8, '2015-08', 1536.6, 1280.5, 256.1, 1, 0, 0, 0, 0 UNION ALL
  SELECT 37592, 'Rechnung 029/2015', 'Einnahmen', '2015-08-17', 2015, 8, '2015-08', 3187.5, 2656.25, 531.25, 1, 0, 0, 0, 0 UNION ALL
  SELECT 43209, 'Spende Traiskirchen', 'Spenden (Betriebsausgabe)', '2015-08-18', 2015, 8, '2015-08', 100, 100, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 27697, 'Rechnung 022/2015', 'Einnahmen', '2015-08-25', 2015, 8, '2015-08', 312, 260, 52, 1, 0, 0, 0, 0 UNION ALL
  SELECT 41149, 'Sozialversicherung', 'Sozialversicherung', '2015-08-27', 2015, 8, '2015-08', 623.44, 623.44, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 40523, 'Rechnung 030/2015', 'Einnahmen', '2015-08-31', 2015, 8, '2015-08', 4500, 3750, 750, 1, 0, 0, 0, 0 UNION ALL
  SELECT 40537, 'Rechnung 031/2015', 'Einnahmen', '2015-08-31', 2015, 8, '2015-08', 1800, 1500, 300, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166062, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2016-12-05', 2016, 12, '2016-12', 577.81, 577.81, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 45863, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-09-01', 2015, 9, '2015-09', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116305, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-09-02', 2015, 9, '2015-09', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 45801, 'Rechnung 033/2015', 'Einnahmen', '2015-09-09', 2015, 9, '2015-09', 2250, 1875, 375, 1, 0, 0, 0, 0 UNION ALL
  SELECT 45800, 'Rechnung 032/2015', 'Einnahmen', '2015-09-11', 2015, 9, '2015-09', 715, 595.83, 119.17, 1, 0, 0, 0, 0 UNION ALL
  SELECT 47095, 'Apple iPad Air 2 + Case', 'Betriebs- und Geschäftsausstattung', '2015-09-14', 2015, 9, '2015-09', 778, 778, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 45802, 'Rechnung 034/2015', 'Einnahmen', '2015-09-14', 2015, 9, '2015-09', 1053, 877.5, 175.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116306, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-09-28', 2015, 9, '2015-09', 3000, 3000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 82518, 'Kartenentgelt BankCard', 'Geschäftskonto & Geldverkehr', '2015-09-30', 2015, 9, '2015-09', 5.73, 5.73, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 82520, 'Kontofuehrungsprovision', 'Geschäftskonto & Geldverkehr', '2015-09-30', 2015, 9, '2015-09', 29.7, 29.7, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 53518, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-10-01', 2015, 10, '2015-10', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 49716, 'Rechnung 036/2015', 'Einnahmen', '2015-10-12', 2015, 10, '2015-10', 900, 750, 150, 1, 0, 0, 0, 0 UNION ALL
  SELECT 49717, 'Rechnung 037/2015', 'Einnahmen', '2015-10-12', 2015, 10, '2015-10', 3600, 3000, 600, 1, 0, 0, 0, 0 UNION ALL
  SELECT 50199, 'Rechnung 038/2015', 'Einnahmen', '2015-10-12', 2015, 10, '2015-10', 600, 500, 100, 1, 0, 0, 0, 0 UNION ALL
  SELECT 50200, 'Rechnung 039/2015', 'Einnahmen', '2015-10-12', 2015, 10, '2015-10', 1800, 1500, 300, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116307, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-10-14', 2015, 10, '2015-10', 1500, 1500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50786, 'Rechnung 041/2015', 'Einnahmen', '2015-10-15', 2015, 10, '2015-10', 4800, 4000, 800, 1, 0, 0, 0, 0 UNION ALL
  SELECT 60424, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-11-02', 2015, 11, '2015-11', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116308, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-11-02', 2015, 11, '2015-11', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 59816, 'Rechnung 043/2015', 'Einnahmen', '2015-11-04', 2015, 11, '2015-11', 374.4, 312, 62.4, 1, 0, 0, 0, 0 UNION ALL
  SELECT 59815, 'Rechnung 042/2015', 'Einnahmen', '2015-11-05', 2015, 11, '2015-11', 2700, 2250, 450, 1, 0, 0, 0, 0 UNION ALL
  SELECT 114396, 'USt. Q3/2015', 'Umsatzsteuer laufendes Jahr', '2015-11-12', 2015, 11, '2015-11', 4431.29, 4431.29, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 50785, 'Rechnung 040/2015', 'Einnahmen', '2015-11-13', 2015, 11, '2015-11', 2342.6, 1952.17, 390.43, 1, 0, 0, 0, 0 UNION ALL
  SELECT 64811, 'Sozialversicherung', 'Sozialversicherung', '2015-11-13', 2015, 11, '2015-11', 618.24, 618.24, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 64810, 'Steuererklärung 2014', 'Rechts- und Beratungskosten', '2015-11-13', 2015, 11, '2015-11', 240, 200, 40, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116309, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-11-23', 2015, 11, '2015-11', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 69801, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2015-12-01', 2015, 12, '2015-12', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 116310, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-12-01', 2015, 12, '2015-12', 6000, 6000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 59817, 'Rechnung 044/2015', 'Einnahmen', '2015-12-03', 2015, 12, '2015-12', 507, 422.5, 84.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 116319, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2015-12-07', 2015, 12, '2015-12', 189.58, 189.58, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69799, 'Rechnung 045/2015', 'Einnahmen', '2015-12-09', 2015, 12, '2015-12', 3992.58, 3327.15, 665.43, 1, 0, 0, 0, 0 UNION ALL
  SELECT 71970, 'Sozialversicherung', 'Sozialversicherung', '2015-12-10', 2015, 12, '2015-12', 13552.85, 13552.85, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 116311, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2015-12-21', 2015, 12, '2015-12', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74669, 'Rechnung 048/2015', 'Einnahmen', '2015-12-23', 2015, 12, '2015-12', 286, 238.33, 47.67, 1, 0, 0, 0, 0 UNION ALL
  SELECT 79439, 'all-inkl Premium Hosting', 'EDV-Dienstleistungen', '2015-12-29', 2015, 12, '2015-12', 288.97, 288.97, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 45803, 'Rechnung 035/2015', 'Einnahmen', '2015-12-30', 2015, 12, '2015-12', 396, 330, 66, 1, 0, 0, 0, 0 UNION ALL
  SELECT 74377, 'Rechnung 046/2015', 'Einnahmen', '2015-12-30', 2015, 12, '2015-12', 390, 325, 65, 1, 0, 0, 0, 0 UNION ALL
  SELECT 82515, 'Kartenentgelt BankCard', 'Geschäftskonto & Geldverkehr', '2015-12-31', 2015, 12, '2015-12', 5.73, 5.73, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 82513, 'Kontofuehrungsprovision', 'Geschäftskonto & Geldverkehr', '2015-12-31', 2015, 12, '2015-12', 29.62, 29.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 461, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-01-04', 2016, 1, '2016-01', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 451, 'Rechnung 047/2015', 'Einnahmen', '2016-01-18', 2016, 1, '2016-01', 15190.5, 12658.75, 2531.75, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166044, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-01-19', 2016, 1, '2016-01', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 1269, 'Rechnung 004/2016', 'Einnahmen', '2016-01-22', 2016, 1, '2016-01', 1050, 875, 175, 1, 0, 0, 0, 0 UNION ALL
  SELECT 1266, 'Rechnung 001/2016', 'Einnahmen', '2016-01-25', 2016, 1, '2016-01', 1500, 1250, 250, 1, 0, 0, 0, 0 UNION ALL
  SELECT 1267, 'Rechnung 002/2016', 'Einnahmen', '2016-01-25', 2016, 1, '2016-01', 1500, 1250, 250, 1, 0, 0, 0, 0 UNION ALL
  SELECT 4687, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-02-01', 2016, 2, '2016-02', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166059, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2016-02-04', 2016, 2, '2016-02', 200.99, 200.99, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 1268, 'Rechnung 003/2016', 'Einnahmen', '2016-02-11', 2016, 2, '2016-02', 312, 260, 52, 1, 0, 0, 0, 0 UNION ALL
  SELECT 4053, 'Sozialversicherung', 'Sozialversicherung', '2016-02-12', 2016, 2, '2016-02', 543.36, 543.36, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 5476, 'USt 2015 Q4', 'Umsatzsteuer Vorjahr', '2016-02-12', 2016, 2, '2016-02', 3652.63, 3652.63, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 166045, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-02-16', 2016, 2, '2016-02', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 3084, 'Rechnung 005/2015', 'Einnahmen', '2016-02-17', 2016, 2, '2016-02', 3300, 2750, 550, 1, 0, 0, 0, 0 UNION ALL
  SELECT 4686, 'Rechnung 006/2016', 'Einnahmen', '2016-02-22', 2016, 2, '2016-02', 2990, 2990, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 5475, 'Überweisungsspesen SEPA NON-EU', 'Geschäftskonto & Geldverkehr', '2016-02-22', 2016, 2, '2016-02', 8.14, 8.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 5470, 'Einkommenssteuer 2015', 'Rechts- und Beratungskosten', '2016-02-23', 2016, 2, '2016-02', 840, 700, 140, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7364, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-03-01', 2016, 3, '2016-03', 104.72, 104.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6935, 'Rechnung 009/2016', 'Einnahmen', '2016-03-04', 2016, 3, '2016-03', 1875, 1562.5, 312.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166046, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-03-11', 2016, 3, '2016-03', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 7114, 'Rechnung 010/2016', 'Einnahmen', '2016-03-14', 2016, 3, '2016-03', 1872, 1560, 312, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7115, 'Rechnung 011/2016', 'Einnahmen', '2016-03-14', 2016, 3, '2016-03', 780, 650, 130, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7116, 'Rechnung 012/2016', 'Einnahmen', '2016-03-14', 2016, 3, '2016-03', 390, 325, 65, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7117, 'Rechnung 013/2016', 'Einnahmen', '2016-03-14', 2016, 3, '2016-03', 1560, 1300, 260, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7118, 'Rechnung 014/2016', 'Einnahmen', '2016-03-14', 2016, 3, '2016-03', 312, 260, 52, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166047, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-03-30', 2016, 3, '2016-03', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 7362, 'Rechnung 015/2016', 'Einnahmen', '2016-03-30', 2016, 3, '2016-03', 7930, 7930, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86249, 'Überweisungsspesen', 'Geschäftskonto & Geldverkehr', '2016-03-30', 2016, 3, '2016-03', 8.14, 8.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 86248, 'Kontoführung', 'Geschäftskonto & Geldverkehr', '2016-03-31', 2016, 3, '2016-03', 35.65, 35.65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 5787, 'Rechnung 007/2016', 'Einnahmen', '2016-03-31', 2016, 3, '2016-03', 975, 812.5, 162.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 5788, 'Rechnung 008/2016', 'Einnahmen', '2016-03-31', 2016, 3, '2016-03', 330, 275, 55, 1, 0, 0, 0, 0 UNION ALL
  SELECT 20021, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-04-01', 2016, 4, '2016-04', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16073, 'WKÖ Grundumlagen', 'Lizenzgebühren', '2016-04-14', 2016, 4, '2016-04', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16077, 'Rechnung 017/2016', 'Einnahmen', '2016-04-21', 2016, 4, '2016-04', 468, 390, 78, 1, 0, 0, 0, 0 UNION ALL
  SELECT 16075, 'Rechnung 016/2016', 'Einnahmen', '2016-04-25', 2016, 4, '2016-04', 7800, 7800, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166060, 'Überweisungsspesen', 'Geschäftskonto & Geldverkehr', '2016-04-25', 2016, 4, '2016-04', 8.14, 8.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166048, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-04-26', 2016, 4, '2016-04', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 38343, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-05-02', 2016, 5, '2016-05', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16074, 'Rechnung 018/2016', 'Einnahmen', '2016-05-02', 2016, 5, '2016-05', 2400, 2000, 400, 1, 0, 0, 0, 0 UNION ALL
  SELECT 22222, 'Umsatzsteuer Q1', 'Umsatzsteuer laufendes Jahr', '2016-05-02', 2016, 5, '2016-05', 5004.51, 5004.51, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 23375, 'Sozialversicherung', 'Sozialversicherung', '2016-05-05', 2016, 5, '2016-05', 543.36, 543.36, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 22219, 'Rechnung 020/2016', 'Einnahmen', '2016-05-06', 2016, 5, '2016-05', 412.5, 343.75, 68.75, 1, 0, 0, 0, 0 UNION ALL
  SELECT 22220, 'Rechnung 021/2016', 'Einnahmen', '2016-05-24', 2016, 5, '2016-05', 780, 650, 130, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166049, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-05-25', 2016, 5, '2016-05', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 38342, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-06-01', 2016, 6, '2016-06', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 22218, 'Rechnung 019/2016', 'Einnahmen', '2016-06-03', 2016, 6, '2016-06', 4680, 4680, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 34994, 'Rechnung 022/2016', 'Einnahmen', '2016-06-03', 2016, 6, '2016-06', 617.5, 617.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 35003, 'Rechnung 023/2016', 'Einnahmen', '2016-06-03', 2016, 6, '2016-06', 3375, 3375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 43504, 'Überweisungsspesen SEPA NON-EU', 'Geschäftskonto & Geldverkehr', '2016-06-03', 2016, 6, '2016-06', 16.28, 16.28, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166061, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2016-06-06', 2016, 6, '2016-06', 1602.66, 1602.66, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166050, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-06-15', 2016, 6, '2016-06', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 43509, 'Kontoführungsgebühr', 'Geschäftskonto & Geldverkehr', '2016-06-30', 2016, 6, '2016-06', 35.93, 35.93, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 43505, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-07-01', 2016, 7, '2016-07', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 43503, 'Rechnung 028/2016', 'Einnahmen', '2016-07-08', 2016, 7, '2016-07', 1593.75, 1593.75, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166051, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-07-11', 2016, 7, '2016-07', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 43499, 'Rechnung 024/2016', 'Einnahmen', '2016-07-13', 2016, 7, '2016-07', 2400, 2000, 400, 1, 0, 0, 0, 0 UNION ALL
  SELECT 43500, 'Rechnung 025/2016', 'Einnahmen', '2016-07-13', 2016, 7, '2016-07', 487.5, 406.25, 81.25, 1, 0, 0, 0, 0 UNION ALL
  SELECT 43501, 'Rechnung 026/2016', 'Einnahmen', '2016-07-13', 2016, 7, '2016-07', 2778, 2315, 463, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86247, 'PHP Magazin', 'Zeitungen, Fachliteratur', '2016-07-21', 2016, 7, '2016-07', 68.29, 68.29, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 86245, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-08-01', 2016, 8, '2016-08', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166052, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-08-01', 2016, 8, '2016-08', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 52181, 'Umsatzsteuer 04-06/2016', 'Umsatzsteuer laufendes Jahr', '2016-08-04', 2016, 8, '2016-08', 419.9, 419.9, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 50885, 'Rechnung 030/2016', 'Einnahmen', '2016-08-05', 2016, 8, '2016-08', 2625, 2625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 54054, 'SVA Q2', 'Sozialversicherung', '2016-08-09', 2016, 8, '2016-08', 551.26, 551.26, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 52184, 'Rechnung 031/2016', 'Einnahmen', '2016-08-10', 2016, 8, '2016-08', 3012, 2510, 502, 1, 0, 0, 0, 0 UNION ALL
  SELECT 52187, 'Rechnung 033/2016', 'Einnahmen', '2016-08-18', 2016, 8, '2016-08', 900, 750, 150, 1, 0, 0, 0, 0 UNION ALL
  SELECT 43502, 'Rechnung 027/2016', 'Einnahmen', '2016-08-22', 2016, 8, '2016-08', 1105, 1105, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 50886, 'Rechnung 029/2016', 'Einnahmen', '2016-08-22', 2016, 8, '2016-08', 2210, 2210, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86246, 'Überweisungsspesen', 'Geschäftskonto & Geldverkehr', '2016-08-22', 2016, 8, '2016-08', 16.42, 16.42, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166053, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-08-31', 2016, 8, '2016-08', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 86243, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-09-01', 2016, 9, '2016-09', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 52185, 'Rechnung 032/2016', 'Einnahmen', '2016-09-01', 2016, 9, '2016-09', 900, 750, 150, 1, 0, 0, 0, 0 UNION ALL
  SELECT 66805, 'Rechnung 034/2016', 'Einnahmen', '2016-09-14', 2016, 9, '2016-09', 531.25, 531.25, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86244, 'Kontoführung', 'Geschäftskonto & Geldverkehr', '2016-09-30', 2016, 9, '2016-09', 35.44, 35.44, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166054, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-09-30', 2016, 9, '2016-09', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 86242, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-10-03', 2016, 10, '2016-10', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 71699, 'Rechnung 037/2016', 'Einnahmen', '2016-10-07', 2016, 10, '2016-10', 2093.75, 2093.75, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 73149, 'Rechnung 035/2016', 'Einnahmen', '2016-10-25', 2016, 10, '2016-10', 1014, 845, 169, 1, 0, 0, 0, 0 UNION ALL
  SELECT 73150, 'Rechnung 036/2016', 'Einnahmen', '2016-10-25', 2016, 10, '2016-10', 1566, 1305, 261, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166055, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-10-31', 2016, 10, '2016-10', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 86241, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-11-02', 2016, 11, '2016-11', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 73152, 'Rechnung 038/2016', 'Einnahmen', '2016-11-03', 2016, 11, '2016-11', 4140, 3450, 690, 1, 0, 0, 0, 0 UNION ALL
  SELECT 84458, 'Rechnung 040/2016', 'Einnahmen', '2016-11-04', 2016, 11, '2016-11', 1875, 1875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 81799, 'USt. 07-09/2016', 'Umsatzsteuer laufendes Jahr', '2016-11-05', 2016, 11, '2016-11', 1746.25, 1746.25, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 86236, 'Doppelüberweisung Rechnung 038/2016', 'Einnahmen', '2016-11-08', 2016, 11, '2016-11', 4140, 3450, 690, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86235, 'Sozialversicherung', 'Sozialversicherung', '2016-11-10', 2016, 11, '2016-11', 543.36, 543.36, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 166056, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-11-28', 2016, 11, '2016-11', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 86239, 'Rechnung 043/2016', 'Einnahmen', '2016-11-29', 2016, 11, '2016-11', 1524, 1270, 254, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86240, 'Rechnung 044/2016', 'Einnahmen', '2016-11-29', 2016, 11, '2016-11', 6480, 5400, 1080, 1, 0, 0, 0, 0 UNION ALL
  SELECT 166057, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-11-30', 2016, 11, '2016-11', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 107097, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2016-12-01', 2016, 12, '2016-12', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 96080, 'Rechnung 046/2016', 'Einnahmen', '2016-12-05', 2016, 12, '2016-12', 562.5, 562.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 96079, 'Rechnung 045/2016', 'Einnahmen', '2016-12-07', 2016, 12, '2016-12', 1800, 1500, 300, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86237, 'Rechnung 041/2016', 'Einnahmen', '2016-12-15', 2016, 12, '2016-12', 390, 325, 65, 1, 0, 0, 0, 0 UNION ALL
  SELECT 86238, 'Rechnung 042/2016', 'Einnahmen', '2016-12-15', 2016, 12, '2016-12', 780, 650, 130, 1, 0, 0, 0, 0 UNION ALL
  SELECT 91195, 'Sozialversicherung', 'Sozialversicherung', '2016-12-28', 2016, 12, '2016-12', 15082.22, 15082.22, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 166063, 'Kontoführungsgebühren', 'Ungeklärte Ausgaben', '2016-12-30', 2016, 12, '2016-12', 35.33, 35.33, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 166058, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2016-12-30', 2016, 12, '2016-12', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 100971, 'Rechnung 047/2016', 'Einnahmen', '2016-12-30', 2016, 12, '2016-12', 7500, 6250, 1250, 1, 0, 0, 0, 0 UNION ALL
  SELECT 5840, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-01-02', 2017, 1, '2017-01', 165.02, 165.02, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216300, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2017-01-04', 2017, 1, '2017-01', 1159.11, 1159.11, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 3147, 'Rechnung 001/2017', 'Einnahmen', '2017-01-30', 2017, 1, '2017-01', 900, 750, 150, 1, 0, 0, 0, 0 UNION ALL
  SELECT 3149, 'Rechnung 002/2017', 'Einnahmen', '2017-01-30', 2017, 1, '2017-01', 702, 585, 117, 1, 0, 0, 0, 0 UNION ALL
  SELECT 3150, 'Rechnung 003/2017', 'Einnahmen', '2017-01-30', 2017, 1, '2017-01', 600, 500, 100, 1, 0, 0, 0, 0 UNION ALL
  SELECT 3151, 'Rechnung 004/2017', 'Einnahmen', '2017-01-30', 2017, 1, '2017-01', 624, 520, 104, 1, 0, 0, 0, 0 UNION ALL
  SELECT 216286, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-01-31', 2017, 1, '2017-01', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 3153, 'Rechnung 006/2017', 'Einnahmen', '2017-01-31', 2017, 1, '2017-01', 11550, 9625, 1925, 1, 0, 0, 0, 0 UNION ALL
  SELECT 5841, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-02-01', 2017, 2, '2017-02', 106.08, 106.08, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216301, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2017-02-06', 2017, 2, '2017-02', 201.44, 201.44, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 62, 'Rechnung 039/2016', 'Einnahmen', '2017-02-07', 2017, 2, '2017-02', 227.5, 227.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 3729, 'Rechnung 007/2017', 'Einnahmen', '2017-02-08', 2017, 2, '2017-02', 593.75, 593.75, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 5836, 'USt. 10-12/2016', 'Umsatzsteuer Vorjahr', '2017-02-10', 2017, 2, '2017-02', 4614.03, 4614.03, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 5849, 'Einkommenssteuer 2015', 'Einkommensteuer', '2017-02-13', 2017, 2, '2017-02', 17880.15, 17880.15, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 3152, 'Rechnung 005/2017', 'Einnahmen', '2017-02-16', 2017, 2, '2017-02', 312, 260, 52, 1, 0, 0, 0, 0 UNION ALL
  SELECT 5991, 'Sozialversicherung', 'Sozialversicherung', '2017-02-24', 2017, 2, '2017-02', 546.78, 546.78, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 216287, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-02-28', 2017, 2, '2017-02', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 14434, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-03-01', 2017, 3, '2017-03', 80.07, 80.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216302, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2017-03-07', 2017, 3, '2017-03', 128.98, 128.98, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 14227, 'Rechnung 008/2017', 'Einnahmen', '2017-03-07', 2017, 3, '2017-03', 468.75, 468.75, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 14230, 'Rechnung 011/2017', 'Einnahmen', '2017-03-09', 2017, 3, '2017-03', 900, 750, 150, 1, 0, 0, 0, 0 UNION ALL
  SELECT 19086, 'Rechnung 014/2017', 'Einnahmen', '2017-03-17', 2017, 3, '2017-03', 4680, 4680, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 14231, 'Rechnung 012/2017', 'Einnahmen', '2017-03-23', 2017, 3, '2017-03', 156, 130, 26, 1, 0, 0, 0, 0 UNION ALL
  SELECT 216303, 'Kontoführungsgebühren', 'Geschäftskonto & Geldverkehr', '2017-03-31', 2017, 3, '2017-03', 44.8, 44.8, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216288, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-03-31', 2017, 3, '2017-03', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 216304, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-04-03', 2017, 4, '2017-04', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 14228, 'Rechnung 009/2017', 'Einnahmen', '2017-04-03', 2017, 4, '2017-04', 546, 455, 91, 1, 0, 0, 0, 0 UNION ALL
  SELECT 14229, 'Rechnung 010/2017', 'Einnahmen', '2017-04-03', 2017, 4, '2017-04', 2400, 2000, 400, 1, 0, 0, 0, 0 UNION ALL
  SELECT 14232, 'Rechnung 013/2017', 'Einnahmen', '2017-04-11', 2017, 4, '2017-04', 13560, 11300, 2260, 1, 0, 0, 0, 0 UNION ALL
  SELECT 23395, 'Rechnung 015/2017', 'Einnahmen', '2017-04-12', 2017, 4, '2017-04', 1250, 1250, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 30904, 'Rechnung 017/2017', 'Einnahmen', '2017-04-27', 2017, 4, '2017-04', 117, 97.5, 19.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 40561, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-05-02', 2017, 5, '2017-05', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216289, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-05-02', 2017, 5, '2017-05', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 40559, 'Steuerberater', 'Rechts- und Beratungskosten', '2017-05-02', 2017, 5, '2017-05', 840, 700, 140, 0, 0, 0, 0, 0 UNION ALL
  SELECT 28113, 'Rechnung 016/2017', 'Einnahmen', '2017-05-03', 2017, 5, '2017-05', 10260, 8550, 1710, 1, 0, 0, 0, 0 UNION ALL
  SELECT 37560, 'Rechnung 018/2017', 'Einnahmen', '2017-05-05', 2017, 5, '2017-05', 718.75, 718.75, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 40558, 'Einkommensteuervorauszahlung 2017, Teilbetrag 1', 'Einkommensteuer', '2017-05-08', 2017, 5, '2017-05', 10168, 10168, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 216290, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-05-16', 2017, 5, '2017-05', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50032, 'USt. 01-03/2017', 'Umsatzsteuer laufendes Jahr', '2017-05-17', 2017, 5, '2017-05', 2587.5, 2587.5, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 216291, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-05-23', 2017, 5, '2017-05', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 52037, 'WK Grundumlagen', 'Geringwertige WG (Betriebsausgabe)', '2017-05-23', 2017, 5, '2017-05', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216292, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-05-31', 2017, 5, '2017-05', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 61574, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-06-01', 2017, 6, '2017-06', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 61573, 'Rechnung 019/2017', 'Einnahmen', '2017-06-21', 2017, 6, '2017-06', 11570, 11570, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 216305, 'Kontoführungsgebühren', 'Geschäftskonto & Geldverkehr', '2017-06-30', 2017, 6, '2017-06', 44.68, 44.68, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216293, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-06-30', 2017, 6, '2017-06', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 79388, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-07-03', 2017, 7, '2017-07', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216306, 'Vertriebsunion Meynen', 'Ungeklärte Ausgaben', '2017-07-06', 2017, 7, '2017-07', 68.29, 68.29, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 62935, 'Rechnung 020/2017', 'Einnahmen', '2017-07-25', 2017, 7, '2017-07', 5040, 4200, 840, 1, 0, 0, 0, 0 UNION ALL
  SELECT 216294, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-07-31', 2017, 7, '2017-07', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 79387, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-08-01', 2017, 8, '2017-08', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 79386, 'USt. 04-06/2017', 'Umsatzsteuer laufendes Jahr', '2017-08-01', 2017, 8, '2017-08', 4340.5, 4340.5, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 216307, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2017-08-04', 2017, 8, '2017-08', 18.67, 18.67, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 83190, 'Einkommensteuervorauszahlung 2017, 2. Teilbetrag', 'Einkommensteuer', '2017-08-08', 2017, 8, '2017-08', 5084, 5084, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 92936, 'Apple MacBook Pro 15,4" Retina 2,2 GHz', 'Betriebs- und Geschäftsausstattung', '2017-08-09', 2017, 8, '2017-08', 1969, 1640.83, 328.17, 0, 0, 0, 0, 0 UNION ALL
  SELECT 92935, 'Rechnung 021/2017', 'Einnahmen', '2017-08-28', 2017, 8, '2017-08', 5622.5, 5622.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 113755, 'Überweisungsspesen SEPA NON-EU', 'Geschäftskonto & Geldverkehr', '2017-08-28', 2017, 8, '2017-08', 8.21, 8.21, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216295, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-08-31', 2017, 8, '2017-08', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 113281, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-09-01', 2017, 9, '2017-09', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 93460, 'Rechnung 022/2017', 'Einnahmen', '2017-09-04', 2017, 9, '2017-09', 2250, 2250, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 113283, 'Kontoführungsgebühren', 'Geschäftskonto & Geldverkehr', '2017-09-29', 2017, 9, '2017-09', 36.45, 36.45, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 113284, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-10-02', 2017, 10, '2017-10', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216296, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-10-02', 2017, 10, '2017-10', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 114557, 'Rechnung 025/2017', 'Einnahmen', '2017-10-24', 2017, 10, '2017-10', 4625, 4625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 216299, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-10-31', 2017, 10, '2017-10', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 134855, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-11-02', 2017, 11, '2017-11', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 134856, 'Einkommensteuervorauszahlung 2017, Teilbetrag 3', 'Einkommensteuer', '2017-11-06', 2017, 11, '2017-11', 5087, 5087, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 134857, 'USt. Q3/2017', 'Umsatzsteuer laufendes Jahr', '2017-11-06', 2017, 11, '2017-11', 511.83, 511.83, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 122458, 'Rechnung 026/2017', 'Einnahmen', '2017-11-07', 2017, 11, '2017-11', 2625, 2625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 134858, 'Einkommenssteuer 2016', 'Einkommensteuer', '2017-11-13', 2017, 11, '2017-11', 21589.98, 21589.98, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 102608, 'Rechnung 023/2017', 'Einnahmen', '2017-11-14', 2017, 11, '2017-11', 4080, 3400, 680, 1, 0, 0, 0, 0 UNION ALL
  SELECT 109437, 'Rechnung 024/2017', 'Einnahmen', '2017-11-23', 2017, 11, '2017-11', 4875, 4875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 136970, 'Rechnung 027/2017', 'Einnahmen', '2017-11-23', 2017, 11, '2017-11', 747.5, 747.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 216308, 'Überweisungsspesen', 'Geschäftskonto & Geldverkehr', '2017-11-23', 2017, 11, '2017-11', 8.21, 8.21, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216297, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-11-30', 2017, 11, '2017-11', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 155990, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2017-12-01', 2017, 12, '2017-12', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 142797, 'Sozialversicherung', 'Sozialversicherung', '2017-12-11', 2017, 12, '2017-12', 17929.98, 17929.98, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 144396, 'Rechnung 028/2017', 'Einnahmen', '2017-12-18', 2017, 12, '2017-12', 2750, 2750, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 145249, 'Rechnung 029/2017', 'Einnahmen', '2017-12-20', 2017, 12, '2017-12', 765, 637.5, 127.5, 1, 0, 0, 0, 0 UNION ALL
  SELECT 155991, 'Kontoführung', 'Geschäftskonto & Geldverkehr', '2017-12-29', 2017, 12, '2017-12', 36.74, 36.74, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 216298, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2017-12-29', 2017, 12, '2017-12', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 23004, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-01-02', 2018, 1, '2018-01', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 963, 'Rechnung 001/2018', 'Einnahmen', '2018-01-10', 2018, 1, '2018-01', 1500, 1500, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 23003, 'Exchange Server troop.at', 'Lizenzgebühren', '2018-01-17', 2018, 1, '2018-01', 100.8, 84, 16.8, 0, 0, 0, 0, 0 UNION ALL
  SELECT 2663, 'Rechnung 002/2018', 'Einnahmen', '2018-01-25', 2018, 1, '2018-01', 156, 130, 26, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220121, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-01-30', 2018, 1, '2018-01', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220122, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-01-31', 2018, 1, '2018-01', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 23005, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-02-01', 2018, 2, '2018-02', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220151, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-02-05', 2018, 2, '2018-02', 120, 120, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 23007, 'ESt. Vorauszahlung 1/3 2018', 'Einkommensteuer', '2018-02-12', 2018, 2, '2018-02', 6198, 6198, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 23006, 'USt. 10-12/2017', 'Umsatzsteuer Vorjahr', '2018-02-12', 2018, 2, '2018-02', 807.5, 807.5, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 11198, 'Rechnung 004/2018', 'Einnahmen', '2018-02-16', 2018, 2, '2018-02', 1125, 1125, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 11199, 'Rechnung 003/2018', 'Einnahmen', '2018-02-27', 2018, 2, '2018-02', 1901.25, 1901.25, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220152, 'Überweisungsspesen', 'Geschäftskonto & Geldverkehr', '2018-02-27', 2018, 2, '2018-02', 8.21, 8.21, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220123, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-02-28', 2018, 2, '2018-02', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 23008, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-03-01', 2018, 3, '2018-03', 105.75, 105.75, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 11459, 'Rechnung 005/2018', 'Einnahmen', '2018-03-01', 2018, 3, '2018-03', 9600, 8000, 1600, 1, 0, 0, 0, 0 UNION ALL
  SELECT 23009, 'Auto Anzahlung', 'Ungeklärte Ausgaben', '2018-03-06', 2018, 3, '2018-03', 5000, 5000, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220153, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-03-07', 2018, 3, '2018-03', 218, 218, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220124, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-03-12', 2018, 3, '2018-03', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 14027, 'Rechnung 006/2018', 'Einnahmen', '2018-03-13', 2018, 3, '2018-03', 3812.5, 3812.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 23012, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-03-14', 2018, 3, '2018-03', 362.52, 362.52, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 23010, 'Wiener Linien Jahreskarte', 'Ungeklärte Ausgaben', '2018-03-14', 2018, 3, '2018-03', 365, 365, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 23013, 'Steuerberater', 'Rechts- und Beratungskosten', '2018-03-16', 2018, 3, '2018-03', 960, 800, 160, 0, 0, 0, 0, 0 UNION ALL
  SELECT 23014, 'Private Ausgabe', 'Privatentnahmen (allgemein)', '2018-03-19', 2018, 3, '2018-03', 50, 50, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 14028, 'Rechnung 007/2018', 'Einnahmen', '2018-03-28', 2018, 3, '2018-03', 270, 225, 45, 1, 0, 0, 0, 0 UNION ALL
  SELECT 23015, 'Kontoführung, Zinsen', 'Geschäftskonto & Geldverkehr', '2018-03-30', 2018, 3, '2018-03', 38.53, 38.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 23019, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-04-03', 2018, 4, '2018-04', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220125, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-04-03', 2018, 4, '2018-04', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220154, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-04-04', 2018, 4, '2018-04', 219.3, 219.3, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 68723, 'Auto Leasing', 'Ungeklärte Ausgaben', '2018-04-09', 2018, 4, '2018-04', 198.14, 198.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 68727, 'Wirtschaftskammer Wien Grundumlagen', 'Rechts- und Beratungskosten', '2018-04-10', 2018, 4, '2018-04', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 26837, 'Rechnung 008/2018', 'Einnahmen', '2018-04-11', 2018, 4, '2018-04', 2187.5, 2187.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220126, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-04-19', 2018, 4, '2018-04', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220127, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-04-30', 2018, 4, '2018-04', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50157, 'Auto Leasing', 'Ungeklärte Ausgaben', '2018-05-02', 2018, 5, '2018-05', 78.14, 78.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 50158, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-05-02', 2018, 5, '2018-05', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95173, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-05-02', 2018, 5, '2018-05', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 26321, 'ESt 04-06/2018', 'Einkommensteuer', '2018-05-09', 2018, 5, '2018-05', 6198, 6198, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 26319, 'USt. 01-03/2018', 'Umsatzsteuer laufendes Jahr', '2018-05-09', 2018, 5, '2018-05', 1457.7, 1457.7, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 220128, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-05-14', 2018, 5, '2018-05', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220129, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-05-22', 2018, 5, '2018-05', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50155, 'Rechnung 009/2018', 'Einnahmen', '2018-05-23', 2018, 5, '2018-05', 1937.5, 1937.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 50674, 'Rechnung 011/2018', 'Einnahmen', '2018-05-29', 2018, 5, '2018-05', 7488, 6240, 1248, 1, 0, 0, 0, 0 UNION ALL
  SELECT 95172, 'Auto Leasing', 'Ungeklärte Ausgaben', '2018-06-01', 2018, 6, '2018-06', 78.14, 78.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95171, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-06-01', 2018, 6, '2018-06', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95174, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-06-01', 2018, 6, '2018-06', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220130, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-06-01', 2018, 6, '2018-06', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50156, 'Rechnung 010/2018', 'Einnahmen', '2018-06-01', 2018, 6, '2018-06', 4062.5, 4062.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220155, 'Überweisungsspesen', 'Geschäftskonto & Geldverkehr', '2018-06-01', 2018, 6, '2018-06', 8.21, 8.21, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220156, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-06-04', 2018, 6, '2018-06', 2.16, 2.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 53739, 'Rechnung 012/2018', 'Einnahmen', '2018-06-08', 2018, 6, '2018-06', 3187.5, 3187.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220131, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-06-11', 2018, 6, '2018-06', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220132, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-06-22', 2018, 6, '2018-06', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 68733, 'Bankgebühren', 'Geschäftskonto & Geldverkehr', '2018-06-29', 2018, 6, '2018-06', 38.47, 38.47, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95178, 'Auto Leasing', 'Ungeklärte Ausgaben', '2018-07-02', 2018, 7, '2018-07', 78.14, 78.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95177, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-07-02', 2018, 7, '2018-07', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95179, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-07-02', 2018, 7, '2018-07', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220133, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-07-02', 2018, 7, '2018-07', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220157, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-07-05', 2018, 7, '2018-07', 2.2, 2.2, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69697, 'Rechnung 013/2018', 'Einnahmen', '2018-07-12', 2018, 7, '2018-07', 10920, 10920, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 68757, 'Rechnung 015/2018', 'Einnahmen', '2018-07-12', 2018, 7, '2018-07', 3562.5, 3562.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 69698, 'Rechnung 014/2018', 'Einnahmen', '2018-07-13', 2018, 7, '2018-07', 588, 490, 98, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220134, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-07-17', 2018, 7, '2018-07', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 95181, 'Betriebsversicherung Allianz Nachzahlung', 'Betriebliche Versicherungen', '2018-07-18', 2018, 7, '2018-07', 62.88, 62.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220135, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-07-27', 2018, 7, '2018-07', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220136, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-07-31', 2018, 7, '2018-07', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 95186, 'Auto Leasing', 'Ungeklärte Ausgaben', '2018-08-01', 2018, 8, '2018-08', 78.14, 78.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95184, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-08-01', 2018, 8, '2018-08', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 95187, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-08-01', 2018, 8, '2018-08', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220158, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-08-06', 2018, 8, '2018-08', 2.2, 2.2, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220137, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-08-16', 2018, 8, '2018-08', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 79205, 'Rechnung 017/2018', 'Einnahmen', '2018-08-16', 2018, 8, '2018-08', 3625, 3625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220138, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-08-22', 2018, 8, '2018-08', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220139, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-08-31', 2018, 8, '2018-08', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 105941, 'Auto Leasing', 'Ungeklärte Ausgaben', '2018-09-03', 2018, 9, '2018-09', 78.14, 78.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 105943, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-09-03', 2018, 9, '2018-09', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 105944, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-09-03', 2018, 9, '2018-09', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220159, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-09-04', 2018, 9, '2018-09', 42.22, 42.22, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 96349, 'Rechnung 019/2018', 'Einnahmen', '2018-09-05', 2018, 9, '2018-09', 3937.5, 3937.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 105945, 'Night Run', 'Ungeklärte Ausgaben', '2018-09-06', 2018, 9, '2018-09', 27, 27, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 79207, 'Rechnung 018/2018', 'Einnahmen', '2018-09-07', 2018, 9, '2018-09', 2730, 2730, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220140, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-09-12', 2018, 9, '2018-09', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 79201, 'Rechnung 016/2018', 'Einnahmen', '2018-09-18', 2018, 9, '2018-09', 4830, 4830, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220141, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-09-24', 2018, 9, '2018-09', 2500, 2500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 105946, 'Bankspesen', 'Geschäftskonto & Geldverkehr', '2018-09-28', 2018, 9, '2018-09', 46.64, 46.64, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 105947, 'Auto Leasing', 'Ungeklärte Ausgaben', '2018-10-01', 2018, 10, '2018-10', 78.14, 78.14, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 105948, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-10-01', 2018, 10, '2018-10', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 105949, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-10-01', 2018, 10, '2018-10', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220142, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-10-01', 2018, 10, '2018-10', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 105928, 'Rechnung 020/2018', 'Einnahmen', '2018-10-03', 2018, 10, '2018-10', 2687.5, 2687.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220160, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-10-05', 2018, 10, '2018-10', 2.21, 2.21, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220143, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-10-08', 2018, 10, '2018-10', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 114839, 'Auto Abzahlung', 'Privatentnahmen (allgemein)', '2018-10-18', 2018, 10, '2018-10', 5878.31, 5878.31, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220144, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-10-31', 2018, 10, '2018-10', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 116353, 'Rechnung 021/2018', 'Einnahmen', '2018-10-31', 2018, 10, '2018-10', 8736, 7280, 1456, 1, 0, 0, 0, 0 UNION ALL
  SELECT 161435, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-11-02', 2018, 11, '2018-11', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 161434, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-11-02', 2018, 11, '2018-11', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220161, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-11-05', 2018, 11, '2018-11', 2.24, 2.24, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 124432, 'Rechnung 022/2018', 'Einnahmen', '2018-11-06', 2018, 11, '2018-11', 4625, 4625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220145, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-11-08', 2018, 11, '2018-11', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 133843, 'Sozialversicherung', 'Sozialversicherung', '2018-11-14', 2018, 11, '2018-11', 15618.03, 15618.03, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 161437, 'ARBÖ', 'Ungeklärte Ausgaben', '2018-11-20', 2018, 11, '2018-11', 128.8, 128.8, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220146, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-11-26', 2018, 11, '2018-11', 300, 300, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 220147, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-11-30', 2018, 11, '2018-11', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 161433, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2018-12-03', 2018, 12, '2018-12', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220150, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-12-03', 2018, 12, '2018-12', 10000, 10000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 161432, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2018-12-04', 2018, 12, '2018-12', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220162, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2018-12-05', 2018, 12, '2018-12', 2.25, 2.25, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 150504, 'Rechnung 024/2018', 'Einnahmen', '2018-12-07', 2018, 12, '2018-12', 11165, 11165, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 150501, 'Rechnung 025/2018', 'Einnahmen', '2018-12-10', 2018, 12, '2018-12', 5843.75, 5843.75, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220148, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-12-20', 2018, 12, '2018-12', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 156459, 'Sozialversicherung', 'Sozialversicherung', '2018-12-21', 2018, 12, '2018-12', 1000, 1000, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 124433, 'Rechnung 023/2018', 'Einnahmen', '2018-12-27', 2018, 12, '2018-12', 3737.5, 3737.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 220163, 'Kontogebühren', 'Geschäftskonto & Geldverkehr', '2018-12-31', 2018, 12, '2018-12', 46.71, 46.71, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 220149, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2018-12-31', 2018, 12, '2018-12', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 24142, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-01-02', 2019, 1, '2019-01', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 24141, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2019-01-03', 2019, 1, '2019-01', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 24143, 'all-inkl.de - xash.at', 'EDV-Dienstleistungen', '2019-01-04', 2019, 1, '2019-01', 288.97, 240.81, 48.16, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229825, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2019-01-04', 2019, 1, '2019-01', 12.29, 12.29, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 24145, 'exchange troop.at', 'EDV-Dienstleistungen', '2019-01-18', 2019, 1, '2019-01', 100.8, 84, 16.8, 0, 0, 0, 0, 0 UNION ALL
  SELECT 4125, 'Rechnung 001/2019', 'Einnahmen', '2019-01-28', 2019, 1, '2019-01', 3562, 3562, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229790, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-01-31', 2019, 1, '2019-01', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 24150, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2019-02-01', 2019, 2, '2019-02', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 24148, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-02-01', 2019, 2, '2019-02', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 4124, 'EST VZ 01-03/2019', 'Einkommensteuer', '2019-02-01', 2019, 2, '2019-02', 3418.92, 3418.92, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 4123, 'USt. 10-12/2018', 'Umsatzsteuer laufendes Jahr', '2019-02-01', 2019, 2, '2019-02', 1456, 1456, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 229826, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2019-02-04', 2019, 2, '2019-02', 187.07, 187.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 24154, 'Rechnung 002/2019', 'Einnahmen', '2019-02-07', 2019, 2, '2019-02', 6843.75, 6843.75, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229791, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-02-13', 2019, 2, '2019-02', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229792, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-02-25', 2019, 2, '2019-02', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229793, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-02-28', 2019, 2, '2019-02', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 24163, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2019-03-01', 2019, 3, '2019-03', 197.16, 197.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 24164, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-03-01', 2019, 3, '2019-03', 107.83, 107.83, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229827, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2019-03-07', 2019, 3, '2019-03', 506.26, 506.26, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229794, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-03-11', 2019, 3, '2019-03', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 24167, 'Rechnung 004/2019', 'Einnahmen', '2019-03-12', 2019, 3, '2019-03', 5125, 5125, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 24169, 'Rechnung 003/2019', 'Einnahmen', '2019-03-13', 2019, 3, '2019-03', 6265, 6265, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 24170, 'Rechnung 005/2019', 'Einnahmen', '2019-03-13', 2019, 3, '2019-03', 2800, 2800, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 24176, 'Wiener Linien Jahreskarte', 'Ungeklärte Ausgaben', '2019-03-14', 2019, 3, '2019-03', 365, 304.17, 60.83, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229795, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-03-18', 2019, 3, '2019-03', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229796, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-03-25', 2019, 3, '2019-03', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 24178, 'Auto Versicherung (Garanta)', 'Ungeklärte Ausgaben', '2019-03-27', 2019, 3, '2019-03', 121.2, 121.2, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 24180, 'Bankzinsen und -spesen', 'Geschäftskonto & Geldverkehr', '2019-03-29', 2019, 3, '2019-03', 41.99, 41.99, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 74857, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-04-01', 2019, 4, '2019-04', 109.7, 109.7, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229797, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-04-01', 2019, 4, '2019-04', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229828, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2019-04-04', 2019, 4, '2019-04', 23.25, 23.25, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 60415, 'Rechnung 008/2019', 'Einnahmen', '2019-04-10', 2019, 4, '2019-04', 975, 975, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 74858, 'Überweisungsspesen', 'Geschäftskonto & Geldverkehr', '2019-04-10', 2019, 4, '2019-04', 8.38, 8.38, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229798, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-04-15', 2019, 4, '2019-04', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74859, 'EST VZ 04-06 2019', 'Einkommensteuer', '2019-04-25', 2019, 4, '2019-04', 4054, 4054, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 229799, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-04-30', 2019, 4, '2019-04', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74860, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-05-02', 2019, 5, '2019-05', 109.7, 109.7, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229829, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2019-05-06', 2019, 5, '2019-05', 2.29, 2.29, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229800, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-05-07', 2019, 5, '2019-05', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74861, 'Auto Service', 'Ungeklärte Ausgaben', '2019-05-08', 2019, 5, '2019-05', 488.83, 407.36, 81.47, 0, 0, 0, 0, 0 UNION ALL
  SELECT 40977, 'Rechnung 007/2019', 'Einnahmen', '2019-05-08', 2019, 5, '2019-05', 1890, 1890, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229801, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-05-13', 2019, 5, '2019-05', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 60412, 'Rechnung 006/2019', 'Einnahmen', '2019-05-13', 2019, 5, '2019-05', 4875, 4875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 60417, 'Rechnung 009/2019', 'Einnahmen', '2019-05-13', 2019, 5, '2019-05', 4156.25, 4156.25, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229802, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-05-20', 2019, 5, '2019-05', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74862, 'WKÖ Grundumlagen', 'Ungeklärte Ausgaben', '2019-05-24', 2019, 5, '2019-05', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 74863, 'Sozialversicherung', 'Sozialversicherung', '2019-05-27', 2019, 5, '2019-05', 8246, 8246, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 229803, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-05-31', 2019, 5, '2019-05', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74864, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-06-03', 2019, 6, '2019-06', 109.7, 109.7, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229804, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-06-11', 2019, 6, '2019-06', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 60420, 'Rechnung 010/2019', 'Einnahmen', '2019-06-14', 2019, 6, '2019-06', 4437.5, 4437.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229805, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-06-17', 2019, 6, '2019-06', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74865, 'Bankkonto Gebühren + Zinsen', 'Geschäftskonto & Geldverkehr', '2019-06-28', 2019, 6, '2019-06', 43, 43, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229806, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-07-01', 2019, 7, '2019-07', 2800, 2800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 74867, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-07-02', 2019, 7, '2019-07', 109.7, 109.7, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229807, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-07-03', 2019, 7, '2019-07', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229830, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2019-07-05', 2019, 7, '2019-07', 19.17, 19.17, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 74866, 'Rechnung 012/2019', 'Einnahmen', '2019-07-09', 2019, 7, '2019-07', 3375, 3375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229808, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-07-24', 2019, 7, '2019-07', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229809, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-07-29', 2019, 7, '2019-07', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 88113, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-08-01', 2019, 8, '2019-08', 109.7, 109.7, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229831, 'Kreditkartenabrechnung', 'Ungeklärte Ausgaben', '2019-08-05', 2019, 8, '2019-08', 9.19, 9.19, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229810, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-08-05', 2019, 8, '2019-08', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 88116, 'Rechnung 013/2019', 'Einnahmen', '2019-08-06', 2019, 8, '2019-08', 7187.5, 7187.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 103992, 'EST VZ 07-09 2019', 'Einkommensteuer', '2019-08-07', 2019, 8, '2019-08', 4045, 4045, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 103989, 'Sozialversicherung', 'Sozialversicherung', '2019-08-07', 2019, 8, '2019-08', 2899.65, 2899.65, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 229811, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-08-16', 2019, 8, '2019-08', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229812, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-08-26', 2019, 8, '2019-08', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229813, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-08-28', 2019, 8, '2019-08', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 103993, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-09-02', 2019, 9, '2019-09', 203.89, 203.89, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229814, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-09-02', 2019, 9, '2019-09', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 103994, 'Rechnung 011/2019', 'Einnahmen', '2019-09-03', 2019, 9, '2019-09', 805, 805, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 103995, 'Rechnung 014/2019', 'Einnahmen', '2019-09-03', 2019, 9, '2019-09', 1610, 1610, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 103997, 'Rechnung 015/2019', 'Einnahmen', '2019-09-03', 2019, 9, '2019-09', 3000, 3000, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 114411, 'Steuerberater', 'Rechts- und Beratungskosten', '2019-09-09', 2019, 9, '2019-09', 900, 750, 150, 0, 0, 0, 0, 0 UNION ALL
  SELECT 114412, 'Rechnung 016/2019', 'Einnahmen', '2019-09-10', 2019, 9, '2019-09', 7062.5, 7062.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229815, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-09-24', 2019, 9, '2019-09', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 132168, 'Bankgebühren', 'Geschäftskonto & Geldverkehr', '2019-09-30', 2019, 9, '2019-09', 43.16, 43.16, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229816, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-09-30', 2019, 9, '2019-09', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 132171, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-10-07', 2019, 10, '2019-10', 114.94, 114.94, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 132170, 'Rechnung 017/2019', 'Einnahmen', '2019-10-11', 2019, 10, '2019-10', 6625, 6625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 132173, 'Auto Reifenwechsel', 'Ungeklärte Ausgaben', '2019-10-17', 2019, 10, '2019-10', 36.67, 36.67, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229817, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-10-21', 2019, 10, '2019-10', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229818, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-10-24', 2019, 10, '2019-10', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229819, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-10-28', 2019, 10, '2019-10', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 150789, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2019-11-04', 2019, 11, '2019-11', 115.62, 115.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 150788, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-11-04', 2019, 11, '2019-11', 114.94, 114.94, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 150790, 'Rechnung 018/2019', 'Einnahmen', '2019-11-08', 2019, 11, '2019-11', 8937.5, 8937.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 132176, 'ESt. Vorzahlung Q4/2019', 'Einkommensteuer', '2019-11-11', 2019, 11, '2019-11', 4055, 4055, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 150791, 'ARBÖ', 'Privatentnahmen (allgemein)', '2019-11-13', 2019, 11, '2019-11', 131.5, 131.5, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 150792, 'Asfinag Vignette', 'Privatentnahmen (allgemein)', '2019-11-15', 2019, 11, '2019-11', 91.1, 91.1, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 132175, 'Sozialversicherung', 'Sozialversicherung', '2019-11-18', 2019, 11, '2019-11', 8249.86, 8249.86, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 229820, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-11-20', 2019, 11, '2019-11', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229821, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-11-25', 2019, 11, '2019-11', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229822, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-11-28', 2019, 11, '2019-11', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 154264, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2019-12-02', 2019, 12, '2019-12', 115.62, 115.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 154265, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2019-12-02', 2019, 12, '2019-12', 114.94, 114.94, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 154261, 'Rechnung 020/2019', 'Einnahmen', '2019-12-04', 2019, 12, '2019-12', 11187.5, 11187.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 173930, 'Arbeiter-Samariter-Bund', 'Spenden (Betriebsausgabe)', '2019-12-05', 2019, 12, '2019-12', 36, 36, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229823, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-12-27', 2019, 12, '2019-12', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229824, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2019-12-30', 2019, 12, '2019-12', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 173937, 'Kontoführung', 'Geschäftskonto & Geldverkehr', '2019-12-31', 2019, 12, '2019-12', 43.04, 43.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6012, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-01-02', 2020, 1, '2020-01', 115.62, 115.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6013, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-01-02', 2020, 1, '2020-01', 114.94, 114.94, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6014, 'Rechnung 001/2020', 'Einnahmen', '2020-01-10', 2020, 1, '2020-01', 2375, 2375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236807, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-01-13', 2020, 1, '2020-01', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 6016, 'bookamat', 'Lizenzgebühren', '2020-01-21', 2020, 1, '2020-01', 120, 100, 20, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6015, 'Exchange Server', 'Lizenzgebühren', '2020-01-21', 2020, 1, '2020-01', 100.8, 84, 16.8, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236808, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-01-24', 2020, 1, '2020-01', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 236809, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-01-28', 2020, 1, '2020-01', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 6017, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-02-03', 2020, 2, '2020-02', 115.62, 115.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6018, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-02-03', 2020, 2, '2020-02', 114.94, 114.94, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6019, 'Parkpickerl', 'Ungeklärte Ausgaben', '2020-02-04', 2020, 2, '2020-02', 225, 225, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 39052, 'JetBrain PhpStorm', 'Lizenzgebühren', '2020-02-05', 2020, 2, '2020-02', 119, 99.17, 19.83, 0, 0, 0, 0, 0 UNION ALL
  SELECT 6022, 'Einkommenssteuer Q1/2020', 'Einkommensteuer', '2020-02-06', 2020, 2, '2020-02', 4054, 4054, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 6020, 'Rechnung 002/2020', 'Einnahmen', '2020-02-06', 2020, 2, '2020-02', 4625, 4625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236810, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-02-12', 2020, 2, '2020-02', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 6023, 'Sozialversicherung', 'Sozialversicherung', '2020-02-12', 2020, 2, '2020-02', 4092.48, 4092.48, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 39051, 'Microsoft Office Home', 'Lizenzgebühren', '2020-02-17', 2020, 2, '2020-02', 99, 82.5, 16.5, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236811, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-02-24', 2020, 2, '2020-02', 2300, 2300, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 236812, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-02-28', 2020, 2, '2020-02', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 39045, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-03-02', 2020, 3, '2020-03', 115.62, 115.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 39046, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-03-02', 2020, 3, '2020-03', 114.94, 114.94, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 39047, 'Spende Samariterbund', 'Spenden (Betriebsausgabe)', '2020-03-05', 2020, 3, '2020-03', 120, 120, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 39048, 'Rechnung 003/2020', 'Einnahmen', '2020-03-06', 2020, 3, '2020-03', 6250, 6250, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236813, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-03-24', 2020, 3, '2020-03', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 39049, 'Wiener Linien Jahreskarte', 'Fahrtkosten', '2020-03-26', 2020, 3, '2020-03', 365, 365, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236814, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-03-30', 2020, 3, '2020-03', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 39050, 'Bankgebühren', 'Geschäftskonto & Geldverkehr', '2020-03-31', 2020, 3, '2020-03', 37.31, 37.31, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 41510, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-04-01', 2020, 4, '2020-04', 115.62, 115.62, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 41511, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-04-01', 2020, 4, '2020-04', 114.94, 114.94, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 41512, 'Rechnung 004/2020', 'Einnahmen', '2020-04-06', 2020, 4, '2020-04', 7375, 7375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 41514, 'Affinity Designer', 'Lizenzgebühren', '2020-04-23', 2020, 4, '2020-04', 27.99, 23.33, 4.66, 0, 0, 0, 0, 0 UNION ALL
  SELECT 41513, 'Affinity Photo', 'Lizenzgebühren', '2020-04-23', 2020, 4, '2020-04', 27.99, 23.33, 4.66, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236815, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-04-24', 2020, 4, '2020-04', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 41515, 'Spende Wikipedia', 'Spenden (Betriebsausgabe)', '2020-04-24', 2020, 4, '2020-04', 20.8, 20.8, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236816, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-04-28', 2020, 4, '2020-04', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 69249, 'Autoservice + Reifenwechsel', 'Ungeklärte Ausgaben', '2020-05-04', 2020, 5, '2020-05', 164.72, 137.27, 27.45, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69247, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-05-04', 2020, 5, '2020-05', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69246, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-05-04', 2020, 5, '2020-05', 116.77, 116.77, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69252, 'Rechnung 005/2020', 'Einnahmen', '2020-05-07', 2020, 5, '2020-05', 6875, 6875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 69254, 'Samsung A51', 'Geringwertige WG (Abschreibung)', '2020-05-07', 2020, 5, '2020-05', 345.49, 287.91, 57.58, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69255, 'Einkommenssteuer Q2/2020', 'Einkommensteuer', '2020-05-13', 2020, 5, '2020-05', 4054, 4054, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 236817, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-05-25', 2020, 5, '2020-05', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 69256, 'Sozialversicherung', 'Sozialversicherung', '2020-05-27', 2020, 5, '2020-05', 4092.48, 4092.48, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 236818, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-05-28', 2020, 5, '2020-05', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 69258, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-06-02', 2020, 6, '2020-06', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69257, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-06-02', 2020, 6, '2020-06', 116.77, 116.77, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69259, 'Steuerberater', 'Rechts- und Beratungskosten', '2020-06-03', 2020, 6, '2020-06', 900, 750, 150, 0, 0, 0, 0, 0 UNION ALL
  SELECT 69261, 'Rechnung 006/2020', 'Einnahmen', '2020-06-08', 2020, 6, '2020-06', 8625, 8625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236819, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-06-24', 2020, 6, '2020-06', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 236820, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-06-29', 2020, 6, '2020-06', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 69262, 'Bankgebühren', 'Geschäftskonto & Geldverkehr', '2020-06-30', 2020, 6, '2020-06', 37.34, 37.34, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 102352, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-07-01', 2020, 7, '2020-07', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 102353, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-07-01', 2020, 7, '2020-07', 33.04, 33.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 102354, 'Rechnung 007/2020', 'Einnahmen', '2020-07-09', 2020, 7, '2020-07', 6750, 6750, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236821, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-07-24', 2020, 7, '2020-07', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 236822, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-07-28', 2020, 7, '2020-07', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 102355, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-08-03', 2020, 8, '2020-08', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 102356, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-08-03', 2020, 8, '2020-08', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 102351, 'Rechnung 008/2020', 'Einnahmen', '2020-08-06', 2020, 8, '2020-08', 6187.5, 6187.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 102357, 'Einkommenssteuer', 'Einkommensteuer', '2020-08-13', 2020, 8, '2020-08', 3000, 3000, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 236823, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-08-24', 2020, 8, '2020-08', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 102358, 'Sozialversicherung', 'Sozialversicherung', '2020-08-26', 2020, 8, '2020-08', 4092.48, 4092.48, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 236824, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-08-28', 2020, 8, '2020-08', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 123380, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-09-01', 2020, 9, '2020-09', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 123381, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-09-01', 2020, 9, '2020-09', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 123384, 'Rechnung 009/2020', 'Einnahmen', '2020-09-03', 2020, 9, '2020-09', 2812.5, 2812.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236825, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-09-24', 2020, 9, '2020-09', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 236826, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-09-28', 2020, 9, '2020-09', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 123393, 'Kontoführungsgebühren', 'Geschäftskonto & Geldverkehr', '2020-09-30', 2020, 9, '2020-09', 37.27, 37.27, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 123386, 'Rechnung 010/2020', 'Einnahmen', '2020-09-30', 2020, 9, '2020-09', 600, 500, 100, 1, 0, 0, 0, 0 UNION ALL
  SELECT 159343, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-10-01', 2020, 10, '2020-10', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159344, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-10-01', 2020, 10, '2020-10', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159345, 'Grafikkarte + Festplatte', 'Geringwertige WG (Betriebsausgabe)', '2020-10-02', 2020, 10, '2020-10', 290.23, 241.86, 48.37, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236827, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-10-13', 2020, 10, '2020-10', 500, 500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 159346, 'Reifenwechsel', 'Ungeklärte Ausgaben', '2020-10-15', 2020, 10, '2020-10', 115, 115, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159347, 'Rechnung 011/2020', 'Einnahmen', '2020-10-21', 2020, 10, '2020-10', 6812.5, 6812.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236828, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-10-27', 2020, 10, '2020-10', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 236829, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-10-28', 2020, 10, '2020-10', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 159348, 'WKÖ Grundumlagen', 'Ungeklärte Ausgaben', '2020-10-28', 2020, 10, '2020-10', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236830, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-10-29', 2020, 10, '2020-10', 2590, 2590, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 159349, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-11-02', 2020, 11, '2020-11', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159350, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-11-02', 2020, 11, '2020-11', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159351, 'Rechnung 012/2020', 'Einnahmen', '2020-11-03', 2020, 11, '2020-11', 5875, 5875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 159352, 'Einkommenssteuer Q3/2020', 'Einkommensteuer', '2020-11-04', 2020, 11, '2020-11', 833.73, 833.73, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 236835, 'ARBÖ', 'Ungeklärte Ausgaben', '2020-11-12', 2020, 11, '2020-11', 133.8, 111.5, 22.3, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159353, 'Sozialversicherung', 'Sozialversicherung', '2020-11-12', 2020, 11, '2020-11', 4100.49, 4100.49, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 236836, 'Post Nachsendeauftrag', 'Ungeklärte Ausgaben', '2020-11-23', 2020, 11, '2020-11', 67.6, 67.6, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 236832, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-11-24', 2020, 11, '2020-11', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 236833, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-11-30', 2020, 11, '2020-11', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 159355, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2020-12-01', 2020, 12, '2020-12', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159357, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2020-12-01', 2020, 12, '2020-12', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 159358, 'Samariterbund', 'Spenden (Betriebsausgabe)', '2020-12-04', 2020, 12, '2020-12', 36, 36, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 189769, 'Rechnung 013/2020', 'Einnahmen', '2020-12-09', 2020, 12, '2020-12', 5625, 5625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 236837, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2020-12-28', 2020, 12, '2020-12', 3000, 3000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 189770, 'Kontoführungsgebühren', 'Geschäftskonto & Geldverkehr', '2020-12-31', 2020, 12, '2020-12', 37.34, 37.34, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29802, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-01-04', 2021, 1, '2021-01', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29803, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-01-04', 2021, 1, '2021-01', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29804, 'Caritas Spende', 'Spenden (Betriebsausgabe)', '2021-01-07', 2021, 1, '2021-01', 100, 100, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29805, 'Rechnung 001/2021', 'Einnahmen', '2021-01-07', 2021, 1, '2021-01', 8875, 8875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229153, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-01-11', 2021, 1, '2021-01', 1000, 1000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 29806, 'Exchange Server', 'EDV-Dienstleistungen', '2021-01-15', 2021, 1, '2021-01', 100.8, 84, 16.8, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29807, 'bookamat', 'Lizenzgebühren', '2021-01-20', 2021, 1, '2021-01', 144, 120, 24, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229155, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-01-25', 2021, 1, '2021-01', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 29808, 'MacBook Pro', 'Ungeklärte Ausgaben', '2021-01-27', 2021, 1, '2021-01', 1800, 1800, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229157, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-01-28', 2021, 1, '2021-01', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 29811, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-02-01', 2021, 2, '2021-02', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29809, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-02-01', 2021, 2, '2021-02', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29812, 'Rechnung 002/2021', 'Einnahmen', '2021-02-02', 2021, 2, '2021-02', 6312.5, 6312.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 29813, 'Amazon Laptop Adapter + Headset', 'Geringwertige WG (Betriebsausgabe)', '2021-02-03', 2021, 2, '2021-02', 62.32, 51.93, 10.39, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29815, 'Spende Sozial Medizinischer Dienst', 'Spenden (Betriebsausgabe)', '2021-02-04', 2021, 2, '2021-02', 120, 120, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29818, 'Einkommenssteuer', 'Einkommensteuer', '2021-02-08', 2021, 2, '2021-02', 3000, 3000, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 29819, 'Sozialversicherung', 'Sozialversicherung', '2021-02-12', 2021, 2, '2021-02', 4720.92, 4720.92, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 29820, 'Microsoft Office', 'Lizenzgebühren', '2021-02-15', 2021, 2, '2021-02', 99, 82.5, 16.5, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29822, 'JetBrains PHPStorm', 'Lizenzgebühren', '2021-02-16', 2021, 2, '2021-02', 119, 119, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229160, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-02-24', 2021, 2, '2021-02', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 29824, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-03-01', 2021, 3, '2021-03', 111.53, 111.53, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29827, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-03-01', 2021, 3, '2021-03', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229161, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-03-01', 2021, 3, '2021-03', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 230209, 'Spotify', 'Privatentnahmen (allgemein)', '2021-03-01', 2021, 3, '2021-03', 9.99, 9.99, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 29832, 'Rechnung 003/2021', 'Einnahmen', '2021-03-03', 2021, 3, '2021-03', 7375, 7375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 29831, 'WKÖ Grundumlagen', 'Ungeklärte Ausgaben', '2021-03-03', 2021, 3, '2021-03', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 29834, 'Wiener Linien Jahresticket', 'Fahrtkosten', '2021-03-15', 2021, 3, '2021-03', 365, 365, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229163, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-03-24', 2021, 3, '2021-03', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229164, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-03-29', 2021, 3, '2021-03', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 29835, 'Kontoführungsgebühr', 'Geschäftskonto & Geldverkehr', '2021-03-31', 2021, 3, '2021-03', 37.3, 37.3, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66878, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-04-01', 2021, 4, '2021-04', 113.05, 113.05, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66877, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-04-01', 2021, 4, '2021-04', 115.82, 115.82, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66879, 'Rechnung 004/2021', 'Einnahmen', '2021-04-07', 2021, 4, '2021-04', 7937.5, 7937.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 230210, 'DigitalOcean oegni', 'Lizenzgebühren', '2021-04-14', 2021, 4, '2021-04', 5.51, 5.51, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229166, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-04-26', 2021, 4, '2021-04', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229168, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-04-28', 2021, 4, '2021-04', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 66880, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-05-03', 2021, 5, '2021-05', 113.05, 113.05, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66881, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-05-03', 2021, 5, '2021-05', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 230211, 'DigitalOcean oegni', 'Lizenzgebühren', '2021-05-03', 2021, 5, '2021-05', 9.98, 9.98, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66882, 'Einkommenssteuer', 'Einkommensteuer', '2021-05-04', 2021, 5, '2021-05', 3000, 3000, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 66883, 'Rechnung 005/2021', 'Einnahmen', '2021-05-04', 2021, 5, '2021-05', 6625, 6625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 66884, 'Auto Service', 'Ungeklärte Ausgaben', '2021-05-07', 2021, 5, '2021-05', 425.1, 354.25, 70.85, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66885, 'Computermaus + USB Hub', 'Bürobedarf', '2021-05-10', 2021, 5, '2021-05', 115.81, 96.51, 19.3, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66890, 'Rechnung 006/2021', 'Einnahmen', '2021-05-12', 2021, 5, '2021-05', 6609.6, 5508, 1101.6, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229169, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-05-25', 2021, 5, '2021-05', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 66886, 'Sozialversicherung', 'Sozialversicherung', '2021-05-26', 2021, 5, '2021-05', 4728.93, 4728.93, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 229171, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-05-28', 2021, 5, '2021-05', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 66887, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-06-01', 2021, 6, '2021-06', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66888, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-06-01', 2021, 6, '2021-06', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 66889, 'Rechnung 007/2021', 'Einnahmen', '2021-06-02', 2021, 6, '2021-06', 7625, 7625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229172, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-06-24', 2021, 6, '2021-06', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229173, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-06-28', 2021, 6, '2021-06', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 79321, 'Kontoführungsgebühren', 'Geschäftskonto & Geldverkehr', '2021-06-30', 2021, 6, '2021-06', 38.59, 38.59, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 89618, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-07-01', 2021, 7, '2021-07', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 89617, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-07-01', 2021, 7, '2021-07', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 89620, 'Rechnung 008/2021', 'Einnahmen', '2021-07-05', 2021, 7, '2021-07', 2692, 2243.33, 448.67, 1, 0, 0, 0, 0 UNION ALL
  SELECT 89621, 'Rechnung 009/2021', 'Einnahmen', '2021-07-08', 2021, 7, '2021-07', 5625, 5625, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 89623, 'Steuerberater', 'Rechts- und Beratungskosten', '2021-07-12', 2021, 7, '2021-07', 1080, 900, 180, 0, 0, 0, 0, 0 UNION ALL
  SELECT 89616, 'Bettina Blauensteiner, Wienbox Phase 1', 'Fremdleistungen', '2021-07-15', 2021, 7, '2021-07', 1800, 1500, 300, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229176, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-07-26', 2021, 7, '2021-07', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229177, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-07-28', 2021, 7, '2021-07', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 99046, 'Einkommenssteuer Q3', 'Einkommensteuer', '2021-07-30', 2021, 7, '2021-07', 2500, 2500, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 121817, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-08-02', 2021, 8, '2021-08', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 121816, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-08-02', 2021, 8, '2021-08', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 121818, 'Rechnung 010/2021 - Wienbox Phase 1', 'Einnahmen', '2021-08-02', 2021, 8, '2021-08', 5712, 4760, 952, 1, 0, 0, 0, 0 UNION ALL
  SELECT 121819, 'Sozialversicherung', 'Sozialversicherung', '2021-08-05', 2021, 8, '2021-08', 4728.93, 4728.93, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 121820, 'Rechnung 011/2021', 'Einnahmen', '2021-08-06', 2021, 8, '2021-08', 7250, 7250, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229178, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-08-24', 2021, 8, '2021-08', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229180, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-08-30', 2021, 8, '2021-08', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 133414, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-09-01', 2021, 9, '2021-09', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 133413, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-09-01', 2021, 9, '2021-09', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 133415, 'Rechnung 012/2021', 'Einnahmen', '2021-09-06', 2021, 9, '2021-09', 5250, 5250, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229181, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-09-24', 2021, 9, '2021-09', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229182, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-09-28', 2021, 9, '2021-09', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 144013, 'Kontoführungsgebühren', 'Geschäftskonto & Geldverkehr', '2021-09-30', 2021, 9, '2021-09', 38.61, 38.61, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 154388, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-10-01', 2021, 10, '2021-10', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 154387, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-10-01', 2021, 10, '2021-10', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 154392, 'Rechnung 013/2021', 'Einnahmen', '2021-10-04', 2021, 10, '2021-10', 7062.5, 7062.5, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 154394, 'Reifenwechsel', 'Ungeklärte Ausgaben', '2021-10-20', 2021, 10, '2021-10', 108.98, 90.82, 18.16, 0, 0, 0, 0, 0 UNION ALL
  SELECT 154396, 'Rechnung 014/2021', 'Einnahmen', '2021-10-22', 2021, 10, '2021-10', 2688, 2240, 448, 1, 0, 0, 0, 0 UNION ALL
  SELECT 229183, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-10-25', 2021, 10, '2021-10', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229184, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-10-28', 2021, 10, '2021-10', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 187467, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-11-02', 2021, 11, '2021-11', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 187466, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-11-02', 2021, 11, '2021-11', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 187470, 'Rechnung 015/2021', 'Einnahmen', '2021-11-02', 2021, 11, '2021-11', 8250, 8250, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 187471, 'Einkommenssteuer', 'Einkommensteuer', '2021-11-08', 2021, 11, '2021-11', 1048.87, 1048.87, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 187473, 'Sozialversicherung', 'Sozialversicherung', '2021-11-08', 2021, 11, '2021-11', 4728.69, 4728.69, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 230016, 'USt. 7-9/2021', 'Umsatzsteuer laufendes Jahr', '2021-11-08', 2021, 11, '2021-11', 948.36, 948.36, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 187476, 'Arbö Mitgliedschaft', 'Ungeklärte Ausgaben', '2021-11-09', 2021, 11, '2021-11', 135.8, 135.8, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229185, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-11-24', 2021, 11, '2021-11', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 187477, 'Auto Reperatur', 'Ungeklärte Ausgaben', '2021-11-25', 2021, 11, '2021-11', 148.52, 123.77, 24.75, 0, 0, 0, 0, 0 UNION ALL
  SELECT 229186, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-11-29', 2021, 11, '2021-11', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 187481, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2021-12-01', 2021, 12, '2021-12', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 187479, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2021-12-01', 2021, 12, '2021-12', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 187485, 'Macbook Pro', 'Betriebs- und Geschäftsausstattung', '2021-12-02', 2021, 12, '2021-12', 3439, 2865.83, 573.17, 0, 0, 0, 0, 0 UNION ALL
  SELECT 187486, 'Rechnung 016/2021', 'Einnahmen', '2021-12-03', 2021, 12, '2021-12', 8875, 8875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 187487, 'Samariterbund Spende', 'Spenden (Betriebsausgabe)', '2021-12-06', 2021, 12, '2021-12', 36, 36, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 187541, 'Sozialversicherung', 'Sozialversicherung', '2021-12-06', 2021, 12, '2021-12', 2960.16, 2960.16, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 229197, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-12-27', 2021, 12, '2021-12', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229224, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2021-12-28', 2021, 12, '2021-12', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 229313, 'Kontoführungsgebühr', 'Geschäftskonto & Geldverkehr', '2021-12-31', 2021, 12, '2021-12', 38.18, 38.18, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7789, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-01-03', 2022, 1, '2022-01', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7788, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-01-03', 2022, 1, '2022-01', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7790, 'Domains', 'EDV-Dienstleistungen', '2022-01-04', 2022, 1, '2022-01', 288.97, 240.81, 48.16, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7791, 'bookamat', 'Lizenzgebühren', '2022-01-10', 2022, 1, '2022-01', 144, 120, 24, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7792, 'Rechnung 001/2022', 'Einnahmen', '2022-01-11', 2022, 1, '2022-01', 8125, 8125, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7793, 'Rechnung 002/2022', 'Einnahmen', '2022-01-11', 2022, 1, '2022-01', 672, 560, 112, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7794, 'Parkpickerl', 'Ungeklärte Ausgaben', '2022-01-12', 2022, 1, '2022-01', 285, 285, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7795, 'Rechnung 003/2022', 'Einnahmen', '2022-01-20', 2022, 1, '2022-01', 244.8, 204, 40.8, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7796, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-01-24', 2022, 1, '2022-01', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 7797, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-01-28', 2022, 1, '2022-01', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 7799, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-02-01', 2022, 2, '2022-02', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7798, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-02-01', 2022, 2, '2022-02', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7801, 'PHPStorm', 'Lizenzgebühren', '2022-02-02', 2022, 2, '2022-02', 119, 119, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7800, 'Rechnung 004/2022', 'Einnahmen', '2022-02-02', 2022, 2, '2022-02', 7875, 7875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 7802, 'USt. 10-12/2021', 'Umsatzsteuer Vorjahr', '2022-02-02', 2022, 2, '2022-02', 407.68, 407.68, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 7803, 'Spende Sozial Medizinischer Dienst', 'Betriebliche Spenden (mildtätige Organisationen)', '2022-02-04', 2022, 2, '2022-02', 120, 120, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 7804, 'Einkommenssteuer 1-3/2022', 'Einkommensteuer', '2022-02-07', 2022, 2, '2022-02', 2744, 2744, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 7805, 'Sozialversicherung', 'Sozialversicherung', '2022-02-07', 2022, 2, '2022-02', 5356.38, 5356.38, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 7806, 'troop.at Exchange Server', 'Lizenzgebühren', '2022-02-10', 2022, 2, '2022-02', 100.8, 84, 16.8, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16390, 'Microsoft Office 360', 'Lizenzgebühren', '2022-02-14', 2022, 2, '2022-02', 99, 82.5, 16.5, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16391, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-02-24', 2022, 2, '2022-02', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 16393, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-02-28', 2022, 2, '2022-02', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 16396, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-03-01', 2022, 3, '2022-03', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16394, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-03-01', 2022, 3, '2022-03', 113.04, 113.04, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16397, 'Nachbar in Not Spende', 'Betriebliche Spenden (mildtätige Organisationen)', '2022-03-02', 2022, 3, '2022-03', 100, 100, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 16401, 'Rechnung 005/2022', 'Einnahmen', '2022-03-03', 2022, 3, '2022-03', 6750, 6750, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 16404, 'Wirtschaftskammer Grundumlage', 'Ungeklärte Ausgaben', '2022-03-07', 2022, 3, '2022-03', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 50104, 'Wiener Linien Jahreskarte', 'Fahrtkosten', '2022-03-09', 2022, 3, '2022-03', 365, 365, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 50107, 'Übernahme Gesellschafteranteil bettidrink', 'Ungeklärte Ausgaben', '2022-03-21', 2022, 3, '2022-03', 2401, 2401, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 50108, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-03-24', 2022, 3, '2022-03', 1800, 1800, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50109, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-03-28', 2022, 3, '2022-03', 1200, 1200, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50111, 'Kontoführungsgebühr', 'Geschäftskonto & Geldverkehr', '2022-03-31', 2022, 3, '2022-03', 39.58, 39.58, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 50113, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-04-01', 2022, 4, '2022-04', 114.56, 114.56, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 50112, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-04-01', 2022, 4, '2022-04', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 50114, 'Rechnung 006/2022', 'Einnahmen', '2022-04-04', 2022, 4, '2022-04', 7125, 7125, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 50116, 'Rechnung 007/2022', 'Einnahmen', '2022-04-15', 2022, 4, '2022-04', 84, 70, 14, 1, 0, 0, 0, 0 UNION ALL
  SELECT 50118, 'Auto Pickerl', 'Privatentnahmen (allgemein)', '2022-04-22', 2022, 4, '2022-04', 876.68, 876.68, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 50119, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-04-28', 2022, 4, '2022-04', 3000, 3000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 71908, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-05-02', 2022, 5, '2022-05', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 71907, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-05-02', 2022, 5, '2022-05', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 71910, 'Rechnung 008/2022', 'Einnahmen', '2022-05-02', 2022, 5, '2022-05', 5875, 5875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 71912, 'Einkommenssteuer Q2', 'Einkommensteuer', '2022-05-09', 2022, 5, '2022-05', 2744, 2744, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 71911, 'Sozialversicherung', 'Sozialversicherung', '2022-05-09', 2022, 5, '2022-05', 5356.38, 5356.38, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 71913, 'USt. 1-3/2022', 'Umsatzsteuer laufendes Jahr', '2022-05-11', 2022, 5, '2022-05', 47, 47, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 71914, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-05-30', 2022, 5, '2022-05', 3000, 3000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 71915, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-06-01', 2022, 6, '2022-06', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 71916, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-06-01', 2022, 6, '2022-06', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 71918, 'Rechnung 009/2022', 'Einnahmen', '2022-06-02', 2022, 6, '2022-06', 8375, 8375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 90702, 'Kontoführung', 'Geschäftskonto & Geldverkehr', '2022-06-30', 2022, 6, '2022-06', 39.57, 39.57, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 109604, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-07-01', 2022, 7, '2022-07', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 109602, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-07-01', 2022, 7, '2022-07', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 109605, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-07-05', 2022, 7, '2022-07', 6500, 6500, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 109608, 'Rechnung 010/2022', 'Einnahmen', '2022-07-06', 2022, 7, '2022-07', 5875, 5875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 109611, 'Rechnung 011/2022', 'Einnahmen', '2022-07-18', 2022, 7, '2022-07', 168, 140, 28, 1, 0, 0, 0, 0 UNION ALL
  SELECT 109609, 'USt. 04-07/2022', 'Umsatzsteuer laufendes Jahr', '2022-07-18', 2022, 7, '2022-07', 14, 14, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 109616, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-08-01', 2022, 8, '2022-08', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 109614, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-08-01', 2022, 8, '2022-08', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 109613, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-07-28', 2022, 7, '2022-07', 3300, 3300, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 109617, 'Rechnung 012/2022', 'Einnahmen', '2022-08-02', 2022, 8, '2022-08', 6375, 6375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 109599, 'Einkommenssteuer', 'Einkommensteuer', '2022-08-04', 2022, 8, '2022-08', 2744.34, 2744.34, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 109596, 'Sozialversicherung', 'Sozialversicherung', '2022-08-04', 2022, 8, '2022-08', 1558.02, 1558.02, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 90700, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-06-28', 2022, 6, '2022-06', 3300, 3300, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 134190, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-08-09', 2022, 8, '2022-08', 2000, 2000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 134192, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-08-29', 2022, 8, '2022-08', 3300, 3300, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 134212, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-09-01', 2022, 9, '2022-09', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 134210, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-09-01', 2022, 9, '2022-09', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 134217, 'Rechnung 013/2022', 'Einnahmen', '2022-09-05', 2022, 9, '2022-09', 3375, 3375, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 146410, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-08-24', 2022, 8, '2022-08', 62.88, 62.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 146411, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-09-22', 2022, 9, '2022-09', 7000, 7000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 146412, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-09-28', 2022, 9, '2022-09', 4000, 4000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 146413, 'Kontoführung', 'Geschäftskonto & Geldverkehr', '2022-09-30', 2022, 9, '2022-09', 39.85, 39.85, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190693, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-10-03', 2022, 10, '2022-10', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190692, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-10-03', 2022, 10, '2022-10', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190790, 'Rechnung 014/2022', 'Einnahmen', '2022-10-06', 2022, 10, '2022-10', 9875, 9875, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 190819, 'Steuerberater', 'Rechts- und Beratungskosten', '2022-10-10', 2022, 10, '2022-10', 1080, 900, 180, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190820, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-10-28', 2022, 10, '2022-10', 4000, 4000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 190825, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2022-11-02', 2022, 11, '2022-11', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190823, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-11-02', 2022, 11, '2022-11', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190826, 'Rechnung 015/2022', 'Einnahmen', '2022-11-02', 2022, 11, '2022-11', 12750, 12750, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 190822, 'Sozialversicherung', 'Sozialversicherung', '2022-11-02', 2022, 11, '2022-11', 5356.38, 5356.38, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 190827, 'Einkommenssteuer Q4/2022', 'Einkommensteuer', '2022-11-03', 2022, 11, '2022-11', 2745, 2745, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 190828, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-11-04', 2022, 11, '2022-11', 9000, 9000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 190829, 'ARBÖ', 'Ungeklärte Ausgaben', '2022-11-09', 2022, 11, '2022-11', 144.7, 120.58, 24.12, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190830, 'Einkommenssteuer Nachzahlung 2021', 'Einkommensteuer', '2022-11-21', 2022, 11, '2022-11', 6255.58, 6255.58, 0, 0, 0, 1, 0, 0 UNION ALL
  SELECT 190831, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-11-28', 2022, 11, '2022-11', 4000, 4000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 190832, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-12-01', 2022, 12, '2022-12', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190833, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2022-12-01', 2022, 12, '2022-12', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 190834, 'Rechnung 016/2022', 'Einnahmen', '2022-12-01', 2022, 12, '2022-12', 13275, 13275, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 237560, 'Samariter Bund Spende', 'Betriebliche Spenden (mildtätige Organisationen)', '2022-12-07', 2022, 12, '2022-12', 36, 36, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 237562, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2022-12-28', 2022, 12, '2022-12', 4000, 4000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 237564, 'Kontoführung', 'Geschäftskonto & Geldverkehr', '2022-12-30', 2022, 12, '2022-12', 40.02, 40.02, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33850, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2023-01-02', 2023, 1, '2023-01', 114.88, 114.88, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33849, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2023-01-02', 2023, 1, '2023-01', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33851, 'Rechnung 017/2022', 'Einnahmen', '2023-01-05', 2023, 1, '2023-01', 3264, 2720, 544, 1, 0, 0, 0, 0 UNION ALL
  SELECT 33853, 'Bookamat', 'EDV-Dienstleistungen', '2023-01-13', 2023, 1, '2023-01', 144, 120, 24, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33852, 'USt. 07-09/2022', 'Umsatzsteuer laufendes Jahr', '2023-01-13', 2023, 1, '2023-01', 28, 28, 0, 0, 0, 0, 1, 0 UNION ALL
  SELECT 33854, 'Rechnung 001/2023', 'Einnahmen', '2023-01-16', 2023, 1, '2023-01', 8850, 8850, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 33855, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2023-01-30', 2023, 1, '2023-01', 4000, 4000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 33857, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2023-02-01', 2023, 2, '2023-02', 34.72, 34.72, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33856, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2023-02-01', 2023, 2, '2023-02', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33858, 'Jetbrains PhpStorm', 'Lizenzgebühren', '2023-02-02', 2023, 2, '2023-02', 149, 149, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33859, 'Sozial Medizinischer Dienst', 'Betriebliche Spenden (mildtätige Organisationen)', '2023-02-03', 2023, 2, '2023-02', 120, 120, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33861, 'Amazon Computer', 'Ungeklärte Ausgaben', '2023-02-06', 2023, 2, '2023-02', 1485.01, 1237.51, 247.5, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33860, 'Rechnung 002/2023', 'Einnahmen', '2023-02-06', 2023, 2, '2023-02', 8550, 8550, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 33862, 'Sozialversicherung', 'Sozialversicherung', '2023-02-06', 2023, 2, '2023-02', 4284.44, 4284.44, 0, 0, 0, 0, 0, 1 UNION ALL
  SELECT 33863, 'Festplatten', 'Ungeklärte Ausgaben', '2023-02-08', 2023, 2, '2023-02', 328.13, 273.44, 54.69, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33864, 'Exchange Server', 'Lizenzgebühren', '2023-02-09', 2023, 2, '2023-02', 110.88, 92.4, 18.48, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33865, 'Microsoft Office', 'Lizenzgebühren', '2023-02-13', 2023, 2, '2023-02', 99, 82.5, 16.5, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33866, 'WKÖ Grundumlage', 'Ungeklärte Ausgaben', '2023-02-20', 2023, 2, '2023-02', 65, 65, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33867, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2023-02-28', 2023, 2, '2023-02', 4000, 4000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 33869, 'Auto Versicherung', 'Ungeklärte Ausgaben', '2023-03-01', 2023, 3, '2023-03', 74.79, 74.79, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33868, 'Betriebsversicherung Allianz', 'Betriebliche Versicherungen', '2023-03-01', 2023, 3, '2023-03', 117.07, 117.07, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33870, 'Rechnung 003/2023', 'Einnahmen', '2023-03-07', 2023, 3, '2023-03', 9675, 9675, 0, 1, 0, 0, 0, 0 UNION ALL
  SELECT 33871, 'Wiener Linien Jahreskarte', 'Ungeklärte Ausgaben', '2023-03-16', 2023, 3, '2023-03', 365, 365, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 33872, 'Privatentnahme', 'Privatentnahmen (allgemein)', '2023-03-28', 2023, 3, '2023-03', 4000, 4000, 0, 0, 1, 0, 0, 0 UNION ALL
  SELECT 33873, 'Kontogebühren', 'Geschäftskonto & Geldverkehr', '2023-03-31', 2023, 3, '2023-03', 42.7, 42.7, 0, 0, 0, 0, 0, 0 UNION ALL
  SELECT 34431, 'EST 1-3/2023', 'Einkommensteuer', '2023-02-06', 2023, 2, '2023-02', 5039, 5039, 0, 0, 0, 1, 0, 0
) AS v;
