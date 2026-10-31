# CLAUDE.md

## Datenschutz: Buchhaltungs- und Kontodaten nicht in den Kontext

Obolus hält echte Finanzdaten des Eigentümers: alle Bookamat-Buchungen (`obulus_bookings`, mit Titeln, UIDs, Beträgen) und, für den Monatsabgleich, die Umsätze des Geschäftskontos, die es live aus Umsatz liest (`/bookamat/reconcile/*`). Alles, was Claude liest (Tool-Ausgaben, Dateien, Screenshots, Seitentext, Subagent-Kontext), geht an Anthropic. Diese Daten sollen kein externes LLM erreichen; lokal auf powerhorse ist in Ordnung.

**Niemals in den Kontext holen**, egal ob per SQL, API, Browser, Log oder Datei:

- Buchungstitel, Beschreibungen, Kontotexte, Händler-, Kunden- und Personennamen
- UIDs, IBANs, Rechnungs- und Belegnummern
- Einzelbeträge und Summen pro Kunde, Händler oder Monat
- `d025d88e.sql` (Prod-Dump) und `migrations/005-*`, `migrations/006-*` (Seeds mit Echtdaten)

**Erlaubt** sind Aggregate ohne Personenbezug (Anzahlen, Ja/Nein-Flags, Datums-Buckets), Schema/DDL und alles mit erfundenen Daten.

Konkret:

- **SQL:** nur `count(*)`/`GROUP BY` über Flags, Typen oder Jahre. Kein `SELECT title …`, kein `SELECT *` „zum Anschauen“.
- **API und Browser** gegen eine DB mit Echtdaten: Antworten nur auf Status oder Anzahlen reduziert ausgeben; kein `get_page_text`/`read_page` auf Buchhaltungs-, Abgleich- oder Rechnungsseiten.
- **Testen** mit einer frischen DB aus dem Schema (DDL aus dem Dump extrahieren, 005/006 als angewendet markieren) und Stubs für Umsatz und Bookamat (`UMSATZ_API_URL`, `BOOKAMAT_BASE_URL`), mit erfundenen Daten.
- **Tests, Fixtures, Kommentare, Commit-Messages:** nur erfundene Beispiele.
- **Subagents:** diesen Abschnitt in jeden Prompt mitgeben, der Daten dieses Projekts berührt.
- Wenn Rohdaten wirklich nötig scheinen: vorher fragen und sagen, welche Daten wozu.
