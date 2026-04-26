# Obulus Migration: Laravel + AngularJS → NestJS + React

## Status: ✅ Implementiert

Alle Phasen wurden umgesetzt. Backend und Frontend kompilieren erfolgreich.

---

## Was implementiert wurde

### Phase 1: Response-Shapes (behebt "0€ überall")

| Datei | Änderung |
|-------|----------|
| `clients.service.ts` | `findAll()` und `findOne()` geben jetzt `total`, `unbilled`, `billed`, `hourlyRate` (mit 65€ Default) zurück |
| `projects.service.ts` | `findAll()` und `findOne()` geben `total`, `unbilled`, `billed`, `clientName`, `hourlyRate` zurück |
| `dashboard.service.ts` | Feld-Mapping: `clientId`, `clientName`, `paid`, `outstanding`. Extra Stats: `unpaidInvoicesTotal`, `openProjectsCount`, `revenue` |
| `accounting.service.ts` | Aliase: `revenue` (=income), `flatRate` (=basisPauschalisierung), `net` (=netto) |

### Phase 2: Filter & Business Logic

| Datei | Änderung |
|-------|----------|
| `projects.service.ts` | Archive-Filter: `show=active` blendet auch Projekte mit archivierten Clients aus |
| `tasks.service.ts` | `open` Filter: `?open=true` → nur Tasks ohne `invoice_id` (unbilled) |
| `tasks.controller.ts` | `open` Query-Parameter |
| `invoices.service.ts` | Ordering: Entwürfe zuerst, dann `sent_at DESC`. Client-Level Task Assignment. Recalculate nach Delete. |
| `expenses.service.ts` | Ordering: `payedAt DESC` statt `createdAt DESC` |
| `clients.service.ts` | `findOne()` ruft `recalculate()` auf (wie Laravel) |
| `projects.service.ts` | `findOne()` ruft `recalculate()` auf (wie Laravel) |

### Phase 3: Fehlende Endpoints & Features

| Datei | Änderung |
|-------|----------|
| `invoices.controller.ts` | `GET /invoices/:id/pdf` generiert echtes PDF via PdfService |
| `invoices.module.ts` | PdfModule importiert |
| `projects.controller.ts` | `GET /projects/:id/quote` — Quote-PDF für unbilled Tasks |
| `projects.module.ts` | PdfModule importiert |
| `ProjectDetailPage.tsx` | Edit-Drawer + Archive-Button hinzugefügt |
| `ClientDetailPage.tsx` | Archivieren nutzt jetzt `update(archived: true)` statt hartem Delete |

### Phase 4: Kleinere Fixes

| Datei | Änderung |
|-------|----------|
| `tasks.service.ts` | `calculatedCost` wird bei `create()` gesetzt |
| `sessions.service.ts` | Task `calculatedCost` wird nach jeder Session-Mutation aktualisiert |
| `invoices.service.ts` | Client-Level Task Assignment (ohne `projectId` → alle Tasks des Clients) |
| `useApi.ts` | `open` Parameter für `useTasks` Hook |
| `api/client.ts` | `open` Parameter für `tasksApi.findAll()` |

---

## Architektur-Überblick

### Backend (NestJS)
```
packages/api/src/
├── main.ts                    # App bootstrap, Swagger, Port via $PORT
├── app.module.ts              # Root module, TypeORM config
├── health.controller.ts       # GET /health
├── common/
│   ├── decorators/            # @CurrentUser(), @Public()
│   └── guards/                # JwtAuthGuard (global)
├── database/entities/         # 9 TypeORM Entities (synchronize: false)
├── modules/
│   ├── auth/                  # JWT login/refresh
│   ├── clients/               # CRUD + recalculate + picture
│   ├── projects/              # CRUD + recalculate + quote PDF
│   ├── tasks/                 # CRUD + reorder + open filter
│   ├── sessions/              # CRUD + task cost recalc
│   ├── invoices/              # CRUD + PDF + task assignment
│   ├── expenses/              # CRUD
│   ├── images/                # Upload + serve
│   ├── dashboard/             # Client stats + year filter
│   ├── accounting/            # Austrian tax (Basispauschalierung)
│   ├── search/                # Search clients/projects/invoices
│   └── reports/               # Paying habit analysis
└── pdf/
    ├── pdf.service.ts         # Puppeteer + Handlebars
    └── templates/             # invoice.hbs, quote.hbs
```

### Frontend (React + Ant Design)
```
packages/web/src/
├── App.tsx                    # Router + Auth + QueryClient
├── api/client.ts              # Axios + all API functions
├── hooks/useApi.ts            # TanStack Query hooks
├── stores/authStore.ts        # Zustand (JWT + user)
├── utils/format.ts            # Currency, date, duration formatting
├── components/layout/         # AppLayout (Sider + Header)
└── pages/
    ├── Auth/LoginPage.tsx
    ├── Dashboard/DashboardPage.tsx
    ├── Clients/{List,Detail}
    ├── Projects/{List,Detail}
    ├── Invoices/{List,Detail}
    ├── Expenses/ListPage.tsx
    └── Reports/{Reports,PayingHabit}
```

### Ports (Dev)
| Service | Host | Container |
|---------|------|-----------|
| Frontend | 8550 | 5173 |
| API | 8551 | 3000 |
| MySQL | 8552 | 3306 |

### Key Business Logic
- **Hourly Rate Hierarchy**: Task → Project → Client → 65€ Default
- **Recalculation Cascade**: Session/Task mutation → Project recalc → Client recalc
- **Invoice Cost**: `SUM(task.calculatedCost)` für alle usable Tasks
- **Tax**: 20% USt (außer `reverseCharge = true`)
- **Austrian Accounting**: Basispauschalierung, SVA, ESt (progressive Brackets 2016+)

---

## Verbleibende TODOs (niedrigere Priorität)

- [ ] Image Resize auf 200x200 bei Upload (benötigt `sharp`)
- [ ] Client/Project Picture Upload Endpoints
- [ ] Pagination für Listen-Endpoints
- [ ] Error Boundaries im Frontend
- [ ] `swagger-typescript-api` generieren wenn API läuft
- [ ] Production Docker Compose testen (Coolify)
- [ ] Activity-Logging auf Sessions ausweiten (aktuell: Client/Project/Invoice/Task)

---

## Phase 5: UX-Iteration (Folge-Feedback)

| Datei | Änderung |
|-------|----------|
| `dashboard.service.ts` | Liefert `unpaidInvoices[]` und `openProjects[]` (mit ID, Kunde, Datum, Fällig, Betrag) zusätzlich zu den Summen |
| `DashboardPage.tsx` | Zwei klickbare Listen unterhalb der Stat-Cards (überfällige Rechnungen rot, Projekte verlinkt) |
| `modules/activities/*` | Neues Modul: `ActivitiesService` (Feed je Kunde inkl. Projekte/Rechnungen/Tasks), `ActivityLoggerService` (für andere Services), `GET /activities/clients/:id` |
| `activity.entity.ts` | `User`-Relation, normalisiert Laravel-Typstrings (`App\\Models\\Client` → `Client`) |
| `clients/projects/invoices/tasks .service.ts` | Loggen jetzt `created`/`updated`/`deleted` mit Diff der geänderten Felder |
| `ClientDetailPage.tsx` | Neuer "Aktivitäten"-Tab mit Datum + Uhrzeit, Subjekttyp, Bezug, Aktion (farbig), geänderte Felder, Benutzer; klickbar zu Projekt/Rechnung |
| `components/tasks/TaskTable.tsx` | Wiederverwendbare Task-Tabelle mit `mode: 'project' | 'invoice'`. Spaltenreihenfolge: Datum, Stunden, Betrag, Name, Aktionen. Inline-Edit (Datum/Stunden/Betrag/Name) im Project-Modus, Drag & Drop Reorder. |
| `components/tasks/taskCalculations.ts` | Geteilte Helper für `getTaskDuration`/`getTaskCost`/`sumTasks` (vorher in jeder Page dupliziert) |
| `ProjectDetailPage.tsx` | Tabs: Tasks + Rechnungen (klickbare Liste). Neuer Button "Angebot" → Quote-PDF mit Titel/Stunden-Optionen. Nutzt `TaskTable`. |
| `InvoiceDetailPage.tsx` | Nutzt `TaskTable` (kein duplizierter `taskColumns`-Block mehr) |
| `pdf.service.ts` | Wartet auf `document.fonts.ready` vor `page.pdf()`, damit Chromium die Custom-Schriften (HelveticaNeue) tatsächlich in der PDF einbettet |
| `api/client.ts`, `useApi.ts` | `activitiesApi.forClient`, `useClientActivities`, `projectsApi.downloadQuote` |

## Phase 6: Folge-Iteration

| Datei | Änderung |
|-------|----------|
| `activities.service.ts` | `TYPE_ALIASES` enthält jetzt auch die in den Laravel-Daten verwendeten Tabellennamen (`'clients'`, `'tasks'` …); legacy-Records werden im Feed angezeigt. Sessions werden ebenfalls mit aufgelistet (Bezug = Task-Name). |
| `pdf.service.ts` | Lädt Fonts jetzt explizit über `FontFace`-API (statt nur `@font-face` CSS), korrekter MIME-Typ `font/ttf`, neue Chromium-Args (`--font-render-hinting=none`, `--export-tagged-pdf`) — sorgt dafür dass HelveticaNeue im PDF eingebettet wird |
| `components/projects/ProjectTable.tsx` | Wiederverwendbare Projektliste mit `columns`/`hideClient`/`pagination` Props |
| `components/invoices/InvoiceTable.tsx` | Wiederverwendbare Rechnungsliste (mit überfälligem Fälligkeitsdatum als roter Tag) |
| `components/activities/ActivityTable.tsx` | Wiederverwendbare Aktivitätenliste mit Datum + Uhrzeit, Typ, Bezug, Aktion, Felder, User |
| `ProjectsListPage.tsx`, `InvoicesListPage.tsx` | Nutzen jetzt die neuen Komponenten |
| `ProjectDetailPage.tsx` | Rechnungs-Tab nutzt `InvoiceTable` |
| `ClientDetailPage.tsx` | Neuer "Übersicht"-Tab als Default mit max. 5 Projekten / 5 Rechnungen / 5 Aktivitäten + "Alle (n)"-Link auf den jeweiligen Tab. Projekte-Tab hat eigene Aktiv/Archiviert/Alle-Sub-Tabs. |
