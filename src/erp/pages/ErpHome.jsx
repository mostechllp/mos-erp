import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import apiClient from "../../utils/apiClient";
import { buildModules, itemAllowed } from "../shell/modules";
import { usePins } from "../shell/usePins";
import { useApprovals } from "../shell/useApprovals";
import { openCommandPalette } from "../shell/CommandPalette";

const aed = (n) => `AED ${Math.round(Number(n) || 0).toLocaleString("en-US")}`;
const safeGet = async (url, params) => { try { return (await apiClient.get(url, { params })).data?.data; } catch { return null; } };

const QUICK = [
  { slug: "crm-leads", label: "New lead", icon: "fa-user-plus", to: "/crm/leads/new" },
  { slug: "crm-opportunities", label: "New opportunity", icon: "fa-bullseye", to: "/crm/opportunities/new" },
  { slug: "crm-quotations", label: "New quotation", icon: "fa-file-invoice", to: "/crm/quotations/new" },
  { slug: "sales-invoices", label: "New invoice", icon: "fa-file-invoice-dollar", to: "/accounts/sales/invoices/new", suite: "accounts" },
  { slug: "employees", label: "Add employee", icon: "fa-user-plus", to: "/employees/add-employee" },
  { slug: "my-leaves", label: "Request leave", icon: "fa-calendar-plus", to: "/leaves", emp: true },
];

const Kpi = ({ icon, color, label, value, hint }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
    <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: color }}><i className={`fas ${icon}`}></i></span>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{value}</p>
      {hint && <p className="text-[11px] text-gray-400 truncate">{hint}</p>}
    </div>
  </div>
);

/** ERP home / launchpad: role-based apps with live numbers, KPIs and what needs attention. */
const ErpHome = () => {
  const { user } = useSelector((s) => s.auth);
  const invoices = useSelector((s) => s.invoices?.invoices) || [];
  const bills = useSelector((s) => s.bills?.bills) || [];
  const base = user?.type !== "admin" ? "/employee" : "/admin";
  const modules = useMemo(() => buildModules(user), [user]);
  const { pins, recents } = usePins();
  const { items: inbox } = useApprovals(user);
  const [d, setD] = useState({});
  const can = (slug, suite) => itemAllowed({ slug, suite }, user);

  useEffect(() => {
    let live = true;
    (async () => {
      const [hr, empl, crm, proj] = await Promise.all([
        can("dashboard") && user?.type === "admin" ? safeGet("/admin/dashboard") : null,
        can("employees") ? safeGet("/admin/employees", { per_page: 1 }) : null,
        can("crm-dashboard", "crm") ? safeGet("/admin/crm/dashboard") : null,
        can("projects") ? safeGet("/admin/projects", { per_page: 100 }) : null,
      ]);
      if (live) setD({ hr, empl, crm, proj });
    })();
    return () => { live = false; };
  }, [user]); // eslint-disable-line

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const k = d.crm?.kpis || {};
  const projects = Array.isArray(d.proj) ? d.proj : d.proj?.data || [];
  const receivable = invoices.reduce((s, i) => s + Number(i.balanceDue ?? 0), 0);
  const payable = bills.reduce((s, b) => s + Number(b.balanceDue ?? b.total ?? 0), 0);
  const today = d.hr?.stats?.today;

  const kpis = [
    d.empl && { icon: "fa-users", color: "#3498db", label: "Employees", value: d.empl.total ?? "—", hint: today ? `${today.punched_in} in today · ${today.absent} absent` : undefined },
    k.open_opportunities && { icon: "fa-bullseye", color: "#f39c12", label: "Open pipeline", value: k.estimated_open_deal_value?.formatted || aed(k.estimated_open_deal_value?.value), hint: `${k.open_opportunities.value} open opportunities` },
    k.total_leads && { icon: "fa-user-tag", color: "#e67e22", label: "Leads", value: k.total_leads.value, hint: `${k.new_leads_this_month?.value ?? 0} new this month` },
    can("accounts-dashboard", "accounts") && { icon: "fa-hand-holding-dollar", color: "#9b59b6", label: "Receivables", value: aed(receivable), hint: `${invoices.length} invoice(s)` },
    can("accounts-dashboard", "accounts") && { icon: "fa-file-invoice-dollar", color: "#e74c3c", label: "Payables", value: aed(payable), hint: `${bills.length} bill(s)` },
    can("projects") && d.proj && { icon: "fa-diagram-project", color: "#1abc9c", label: "Active projects", value: projects.filter((p) => /progress/i.test(p.status)).length, hint: `${projects.length} total` },
  ].filter(Boolean).slice(0, 6);

  const live = {
    hr: d.empl ? `${d.empl.total} employees${today ? ` · ${today.late} late today` : ""}` : null,
    projects: d.proj ? `${projects.filter((p) => /progress/i.test(p.status)).length} active projects` : null,
    crm: k.open_opportunities ? `${k.open_opportunities.value} open deals · ${k.total_leads?.value} leads` : null,
    accounts: `${invoices.length} invoices · ${bills.length} bills`,
    admin: "Organisations, roles & settings",
  };
  const quick = QUICK.filter((q) => can(q.slug, q.suite) && (!q.emp || user?.type !== "admin" || true));
  const pipeline = d.crm?.sales_pipeline || [];
  const maxStage = Math.max(1, ...pipeline.map((s) => s.count));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white p-6 flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{greet}, {(user?.name || "").split(" ")[0]}!</h1>
          <p className="text-sm text-green-50 mt-1">{user?.role?.name} · {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <button onClick={openCommandPalette} className="flex items-center gap-3 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-4 h-11 md:w-96 text-left">
          <i className="fas fa-magnifying-glass text-sm"></i>
          <span className="flex-1 text-sm text-green-50">Search screens, people, leads, quotations…</span>
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-white/20">Ctrl K</kbd>
        </button>
      </div>

      {kpis.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{kpis.map((x) => <Kpi key={x.label} {...x} />)}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <section>
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Your apps</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modules.map((m) => (
                <Link key={m.id} to={m.items[0].to} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg hover:border-green-400 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg" style={{ background: m.color }}><i className={`fas ${m.icon}`}></i></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-100">{m.label}</p>
                      <p className="text-xs text-gray-500 truncate">{live[m.id] || m.blurb}</p>
                    </div>
                    <i className="fas fa-arrow-right text-gray-300 group-hover:text-green-500 text-sm"></i>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {m.items.slice(0, 4).map((i) => <span key={i.slug} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{i.label}</span>)}
                    {m.items.length > 4 && <span className="text-[10px] px-2 py-0.5 text-gray-400">+{m.items.length - 4} more</span>}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {pipeline.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Sales pipeline by stage</h2>
                <Link to={`${base}/crm/opportunities`} className="text-xs text-green-600 hover:underline">Open pipeline</Link>
              </div>
              <div className="space-y-2.5">
                {pipeline.map((s) => (
                  <div key={s.stage} className="flex items-center gap-3 text-xs">
                    <span className="w-24 text-gray-500 shrink-0">{s.stage}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.count / maxStage) * 100}%`, background: s.color }} />
                    </div>
                    <span className="w-8 text-right font-semibold text-gray-700 dark:text-gray-200">{s.count}</span>
                    <span className="w-24 text-right text-gray-400 hidden sm:block">{s.formatted_value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">Needs your attention</h2>
              <Link to={`${base}/approvals`} className="text-xs text-green-600 hover:underline">View all ({inbox.length})</Link>
            </div>
            {inbox.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">You’re all caught up.</p>}
            <div className="space-y-2">
              {inbox.slice(0, 5).map((i) => (
                <Link key={i.id} to={`${base}/approvals`} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs shrink-0" style={{ background: i.color }}><i className={`fas ${i.icon}`}></i></span>
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-gray-800 dark:text-gray-100 truncate">{i.title}</span>
                    <span className="block text-[11px] text-gray-500 truncate">{i.subtitle}</span>
                  </span>
                  {i.urgent && <span className="ml-auto text-[9px] font-bold text-red-600 bg-red-50 rounded px-1.5 py-0.5">URGENT</span>}
                </Link>
              ))}
            </div>
          </section>

          {quick.length > 0 && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Quick actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {quick.map((q) => (
                  <Link key={q.label} to={`${base}${q.to}`} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 hover:bg-green-50 dark:hover:bg-green-900/20 text-xs font-medium text-gray-700 dark:text-gray-200">
                    <i className={`fas ${q.icon} text-green-500`}></i>{q.label}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {(pins.length > 0 || recents.length > 0) && (
            <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5">
              <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">{pins.length ? "Pinned & recent" : "Recent"}</h2>
              <div className="flex flex-wrap gap-2">
                {[...pins.map((p) => ({ ...p, pin: true })), ...recents.filter((r) => !pins.some((p) => p.to === r.to)).slice(0, 5)].map((p) => (
                  <Link key={p.to} to={p.to} className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 hover:bg-green-100">
                    <i className={`${p.pin ? "fas text-amber-400" : "far text-gray-400"} fa-star text-[9px]`}></i>{p.label}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErpHome;
