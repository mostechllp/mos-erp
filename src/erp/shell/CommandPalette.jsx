import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../../utils/apiClient";
import { buildModules, itemAllowed } from "./modules";
import { usePins } from "./usePins";

export const openCommandPalette = () => window.dispatchEvent(new Event("erp:search"));

const listOf = (res) => {
  const d = res?.data?.data;
  return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
};

// Record sources: all use the app's existing list endpoints with ?search=
const SOURCES = [
  { slug: "employees", url: "/admin/employees", label: "Employee", icon: "fa-user", color: "#3498db",
    map: (r) => ({ title: r.name, sub: `${r.employee_code || ""} · ${r.user?.department?.name || ""}`, to: `/employees/${r.id}` }) },
  { slug: "crm-leads", url: "/admin/crm/leads", label: "Lead", icon: "fa-user-tag", color: "#f39c12",
    map: (r) => ({ title: r.company_name, sub: `${r.lead_id} · ${r.lead_status}`, to: `/crm/leads/${r.id}` }) },
  { slug: "crm-customers", url: "/admin/crm/customers", label: "Customer", icon: "fa-address-book", color: "#f39c12",
    map: (r) => ({ title: r.company_name, sub: `${r.customer_id} · ${r.contact_person_name}`, to: `/crm/customers/${r.id}` }) },
  { slug: "crm-opportunities", url: "/admin/crm/opportunities", label: "Opportunity", icon: "fa-bullseye", color: "#f39c12",
    map: (r) => ({ title: r.name || r.title, sub: `${r.opportunity_number} · ${r.stage}`, to: `/crm/opportunities/${r.id}` }) },
  { slug: "crm-quotations", url: "/admin/crm/quotations", label: "Quotation", icon: "fa-file-invoice", color: "#f39c12",
    map: (r) => ({ title: r.quotation_number, sub: `${r.customer_name} · ${r.status}`, to: `/crm/quotations/${r.id}` }) },
  { slug: "projects", url: "/admin/projects", label: "Project", icon: "fa-folder", color: "#1abc9c",
    map: (r) => ({ title: r.name, sub: `${r.client_name || ""} · ${r.status}`, to: `/projects/${r.id}/tasks` }) },
];

/** Ctrl/⌘ + K enterprise search: jump to any screen or open any record. */
const CommandPalette = () => {
  const { user } = useSelector((s) => s.auth);
  const base = user?.type !== "admin" ? "/employee" : "/admin";
  const navigate = useNavigate();
  const { pins, recents } = usePins();
  const modules = useMemo(() => buildModules(user), [user]);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [records, setRecords] = useState([]);
  const [busy, setBusy] = useState(false);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const show = () => { setOpen(true); setQ(""); setRecords([]); setIdx(0); };
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); show(); }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("erp:search", show);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("erp:search", show); window.removeEventListener("keydown", key); };
  }, []);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 30); }, [open]);

  useEffect(() => {
    if (!open || q.trim().length < 2) { setRecords([]); return undefined; }
    let live = true;
    setBusy(true);
    const t = setTimeout(async () => {
      const allowed = SOURCES.filter((s) => itemAllowed({ slug: s.slug, suite: s.slug.startsWith("crm") ? "crm" : undefined }, user));
      const res = await Promise.all(allowed.map(async (s) => {
        try {
          const r = await apiClient.get(s.url, { params: { search: q.trim(), per_page: 4 } });
          return listOf(r).slice(0, 4).map((row) => ({ ...s.map(row), kind: s.label, icon: s.icon, color: s.color }));
        } catch { return []; }
      }));
      if (live) { setRecords(res.flat()); setBusy(false); }
    }, 250);
    return () => { live = false; clearTimeout(t); };
  }, [q, open, user]);

  const needle = q.trim().toLowerCase();
  const screens = useMemo(() => {
    const all = modules.flatMap((m) => m.items);
    if (!needle) return [];
    return all.filter((i) => `${i.label} ${i.moduleLabel} ${i.groupLabel}`.toLowerCase().includes(needle)).slice(0, 7)
      .map((i) => ({ title: i.label, sub: `${i.moduleLabel} › ${i.groupLabel}`, to: i.to, icon: i.icon, kind: "Screen", color: "#2ecc71", abs: true }));
  }, [modules, needle]);

  const idle = !needle ? [
    ...pins.map((p) => ({ title: p.label, sub: "Pinned", to: p.to, icon: "fa-star", kind: "Pinned", color: "#f1c40f", abs: true })),
    ...recents.slice(0, 5).map((r) => ({ title: r.label, sub: `Recent · ${r.moduleLabel}`, to: r.to, icon: "fa-clock-rotate-left", kind: "Recent", color: "#7f8c8d", abs: true })),
    ...modules.map((m) => ({ title: m.label, sub: "Open app", to: m.items[0].to, icon: m.icon, kind: "App", color: m.color, abs: true })),
  ] : [];

  const rows = needle ? [...screens, ...records] : idle;
  useEffect(() => setIdx(0), [q]);

  const go = (r) => { setOpen(false); navigate(r.abs ? r.to : `${base}${r.to}`); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(rows.length - 1, i + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
    if (e.key === "Enter" && rows[idx]) go(rows[idx]);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center gap-3 px-4 h-14 border-b border-gray-200 dark:border-gray-700">
          <i className="fas fa-magnifying-glass text-gray-400"></i>
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey}
            placeholder="Search screens, employees, leads, customers, quotations, projects…"
            className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400" />
          {busy && <i className="fas fa-spinner fa-spin text-gray-400 text-xs"></i>}
          <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-gray-300 dark:border-gray-600 text-gray-500">Esc</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto py-1">
          {rows.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500">
              {needle.length < 2 ? "Type at least 2 characters." : busy ? "Searching…" : `No results for “${q}”.`}
            </p>
          )}
          {rows.map((r, i) => (
            <button key={`${r.kind}-${r.to}-${i}`} onClick={() => go(r)} onMouseEnter={() => setIdx(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${i === idx ? "bg-green-50 dark:bg-green-900/20" : ""}`}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shrink-0" style={{ background: r.color }}>
                <i className={`fas ${r.icon}`}></i>
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{r.title}</span>
                <span className="block text-xs text-gray-500 truncate">{r.sub}</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">{r.kind}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-500">
          <span><kbd className="px-1 border rounded">↑</kbd> <kbd className="px-1 border rounded">↓</kbd> navigate</span>
          <span><kbd className="px-1 border rounded">Enter</kbd> open</span>
          <span className="ml-auto">Search is limited to what your role can access</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
