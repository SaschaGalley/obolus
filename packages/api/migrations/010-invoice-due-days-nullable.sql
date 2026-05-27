-- Allow `due_days` to be NULL = "kein fixes Zahlungsziel".
-- When NULL, the PDF shows an "Überweisung nach Erhalt" hint instead of a
-- specific Fälligkeitsdatum, and the invoice is never flagged as overdue.
ALTER TABLE obulus_invoices
  MODIFY COLUMN due_days INT UNSIGNED NULL DEFAULT NULL;
