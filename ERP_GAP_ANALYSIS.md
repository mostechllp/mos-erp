# ERP gap analysis: MOS ERP vs. common ERP design

## What the research showed (Odoo, ERPNext/Frappe, SAP Fiori, NetSuite, ZIPERP)
1. **Persistent app/module switcher.** Frappe v16 users complain loudly when module switching is hidden or needs many clicks; ZIPERP v2 puts a module switcher plus module cards in the shell.
2. **One stable sidebar, scoped to the active module** (not a flat list of 25 items, and no "teleporting" between workspaces).
3. **Role-based home / launchpad** with live tiles, KPIs, reminders and shortcuts (SAP Fiori launchpad, NetSuite home dashboard; only role-relevant apps are shown).
4. **Shell bar with enterprise search** across screens *and* business records (Fiori, ZIPERP), plus notifications, profile, organisation/financial-year context.
5. **Approvals / reminders inbox** (NetSuite reminders, Fiori approvals).
6. **Pinning, favourites and recents** reachable from any module (a top Frappe feature request).
7. **Breadcrumbs / control panel** on every screen, sticky list headers, pipeline status bars, kanban, split master-detail, chatter/activity log (Odoo).

## Where the previous build fell short, and status now
| Gap | Before | Now |
|---|---|---|
| Module switcher | none; flat icon rail with 3 accordions | **Done**: app switcher in sidebar |
| Grouped, module-scoped nav | flat list | **Done**: 5 apps, titled groups, collapsible groups, icon-rail collapse |
| Role-based home / launchpad | landed on HR dashboard | **Done**: ERP Home (KPIs, app tiles with live numbers, attention list, quick actions, pipeline) |
| Global search | none | **Done**: Ctrl/⌘+K searches screens + employees, leads, customers, opportunities, quotations, projects (existing list APIs) |
| Approvals inbox | none | **Done**: leave approve/reject (POST /admin/leaves/:id/status), draft quotations, overdue activities, expiring visas |
| Pins / recents | none | **Done** |
| Breadcrumbs | none | **Done** on every screen, with back and pin |
| Company / financial-year context in header | none | Not done |
| Sticky headers, saved filters, kanban/pipeline board, split view | per-page, inconsistent | Not done (page-by-page work) |
| Record chatter / activity log, smart buttons on detail pages | none | Not done |
| Accounts depth (GL, aging, bank reconciliation, taxes) | mostly local sample data, 1 invoice / 1 bill | Not done |
| Inventory, procurement flow, manufacturing | not in product | Out of scope |
| Button-level permissions inside pages | sidebar + routes only | Not done |
