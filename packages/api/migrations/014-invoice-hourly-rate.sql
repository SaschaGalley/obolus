-- Rechnungs-Stundensatz: friert den Satz pro Rechnung ein, damit sie rückwirkend
-- korrekt bleibt, auch wenn der Projekt-/Kunden-Satz später geändert wird.

ALTER TABLE obulus_invoices
  ADD COLUMN hourly_rate DECIMAL(8,2) NULL AFTER calculated_cost;

-- Einfrieren bestehender Rechnungen: den AKTUELL effektiven Satz auf jede
-- verrechnete, stundenbasierte Task OHNE eigenen Satz pinnen.
-- Der gesetzte Wert = COALESCE(projekt, kunde, 65) ist exakt der Satz, mit dem
-- calculated_cost heute schon gerechnet wird → Summen ändern sich NICHT.
-- calculated_cost bleibt daher unangetastet (bereits korrekt aus Migration 013
-- bzw. laufender Pflege). Ab jetzt sind diese Tasks immun gegen spätere
-- Projekt-/Kunden-Satzänderungen, weil sie einen expliziten Satz tragen.
UPDATE obulus_tasks t
JOIN obulus_projects p ON p.id = t.project_id
JOIN obulus_clients c ON c.id = p.client_id
SET t.hourly_rate = COALESCE(p.hourly_rate, c.hourly_rate, 65)
WHERE t.invoice_id IS NOT NULL
  AND t.fixed_cost IS NULL
  AND t.hourly_rate IS NULL;

-- Anzeige-Satz je Rechnung (Feld oben): wenn alle stundenbasierten Tasks einer
-- Rechnung denselben Satz haben, diesen als Rechnungs-Satz übernehmen. Bei
-- gemischten Sätzen NULL lassen (Feld zeigt dann Platzhalter).
UPDATE obulus_invoices inv
JOIN (
  SELECT invoice_id, MIN(hourly_rate) AS mn, MAX(hourly_rate) AS mx
  FROM obulus_tasks
  WHERE invoice_id IS NOT NULL AND is_active = 1 AND fixed_cost IS NULL AND hourly_rate IS NOT NULL
  GROUP BY invoice_id
) r ON r.invoice_id = inv.id
SET inv.hourly_rate = r.mn
WHERE r.mn = r.mx;
