// ============================================================================
//  In-browser mock backend for the ERP demo.
//  Plugged into axios as a custom `adapter` (see utils/apiClient.js), so every
//  slice / page keeps calling apiClient exactly as it does against the real
//  Laravel API. Unknown endpoints answer with a harmless success envelope.
//  Turn it off with VITE_DEMO_MODE=false.
// ============================================================================
import { AxiosError } from "axios";
import * as S from "./seed";
import { DEMO_ROLES, getRole } from "../roles";
import { ROLE_KEY, writeSession } from "../demoSession";

const clone = (v) => JSON.parse(JSON.stringify(v));
const LS_KEY = "erp-demo-db-v1";

// ---------------- in-memory db (persisted so demo edits survive a reload) ----
const collections = {
  employees: S.employees, departments: S.departments, designations: S.designations,
  organizations: S.organizations, companies: S.companies, leaveTypes: S.leaveTypes,
  leaves: S.leaves, holidays: S.holidays, projects: S.projects, tasks: S.tasks,
  roles: S.roles, meetings: S.meetings, attendance: S.attendance,
  leads: S.leads, customers: S.customers, opportunities: S.opportunities,
  products: S.crmProducts, categories: S.crmCategories, quotations: S.quotations,
  activities: S.activities, proposals: S.proposals, notifications: S.notifications,
};
let db = clone(collections);
try {
  const saved = JSON.parse(localStorage.getItem(LS_KEY) || "null");
  if (saved && saved.__v === 1) db = { ...db, ...saved.db };
} catch { /* ignore */ }
const persist = () => {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ __v: 1, db })); } catch { /* quota */ }
};
export const resetDemoData = () => { localStorage.removeItem(LS_KEY); db = clone(collections); };

// ---------------- helpers ---------------------------------------------------
const ok = (data, message = "OK", extra = {}) => ({ status: "success", success: true, message, data, ...extra });
const fail = (status, message, errors) => ({ __status: status, body: { status: "error", success: false, message, ...(errors ? { errors } : {}) } });
const nextId = (list) => list.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;

const paginate = (list, q) => {
  const per = Number(q.per_page || q.perPage || q.limit || 10) || 10;
  const page = Number(q.page || 1) || 1;
  const start = (page - 1) * per;
  return {
    current_page: page, per_page: per, total: list.length,
    last_page: Math.max(1, Math.ceil(list.length / per)),
    from: list.length ? start + 1 : 0, to: Math.min(start + per, list.length),
    data: list.slice(start, start + per),
  };
};

const FILTER_KEYS = ["lead_status", "priority", "lead_source", "lead_type", "industry", "sales_team", "customer_status", "customer_type", "customer_category", "stage", "status", "activity_type", "type", "category_id", "product_type", "assigned_salesperson_id", "customer_id"];
const applyQuery = (list, q) => {
  let out = list;
  const term = (q.search || q.q || q.keyword || "").toString().trim().toLowerCase();
  if (term) out = out.filter((r) => JSON.stringify(Object.values(r).filter((v) => typeof v !== "object")).toLowerCase().includes(term));
  FILTER_KEYS.forEach((k) => {
    const val = q[k];
    if (val === undefined || val === "" || val === "all" || val === "All") return;
    out = out.filter((r) => r[k] === undefined || String(r[k]).toLowerCase() === String(val).toLowerCase());
  });
  if (q.sort_by) {
    const dir = q.sort_order === "asc" ? 1 : -1;
    out = [...out].sort((a, b) => (a[q.sort_by] > b[q.sort_by] ? dir : a[q.sort_by] < b[q.sort_by] ? -dir : 0));
  }
  return out;
};

const currentRole = () => getRole(localStorage.getItem(ROLE_KEY));
const countBy = (list, key) => list.reduce((m, r) => ((m[r[key]] = (m[r[key]] || 0) + 1), m), {});

// ---------------- generic CRUD ---------------------------------------------
// shape: "array" -> data is an array; "paged" -> data is a Laravel paginator.
const crud = (base, name, { shape = "array", decorate } = {}) => [
  ["GET", new RegExp(`^${base}$`), ({ q }) => {
    const list = applyQuery(db[name], q);
    return ok(shape === "paged" ? paginate(list, q) : list);
  }],
  ["GET", new RegExp(`^${base}/(\\d+)$`), ({ m }) => {
    const row = db[name].find((r) => String(r.id) === m[1]);
    return row ? ok(decorate ? decorate(row) : row) : fail(404, "Record not found");
  }],
  ["POST", new RegExp(`^${base}$`), ({ body }) => {
    const row = { ...body, id: nextId(db[name]), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    db[name].unshift(row); persist();
    return ok(row, "Created successfully");
  }],
  [["PUT", "PATCH", "POST"], new RegExp(`^${base}/(\\d+)$`), ({ m, body }) => {
    const i = db[name].findIndex((r) => String(r.id) === m[1]);
    if (i < 0) return fail(404, "Record not found");
    db[name][i] = { ...db[name][i], ...body, updated_at: new Date().toISOString() }; persist();
    return ok(db[name][i], "Updated successfully");
  }],
  [["PUT", "PATCH", "POST"], new RegExp(`^${base}/(\\d+)/status$`), ({ m, body }) => {
    const i = db[name].findIndex((r) => String(r.id) === m[1]);
    if (i < 0) return fail(404, "Record not found");
    db[name][i] = { ...db[name][i], status: body.status ?? db[name][i].status, ...(body.admin_remark ? { admin_remark: body.admin_remark } : {}) }; persist();
    return ok(db[name][i], "Status updated");
  }],
  ["DELETE", new RegExp(`^${base}/(\\d+)$`), ({ m }) => {
    db[name] = db[name].filter((r) => String(r.id) !== m[1]); persist();
    return ok(null, "Deleted successfully");
  }],
];

// ---------------- derived payloads -----------------------------------------
const kpi = (label, value, formatted) => ({ label, value, ...(formatted ? { formatted } : {}) });
const aed = (n) => `AED ${Number(n).toLocaleString("en-US")}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const crmDashboard = () => {
  const open = db.opportunities.filter((o) => !String(o.stage).startsWith("Closed"));
  const won = db.opportunities.filter((o) => o.stage === "Closed Won");
  const lost = db.opportunities.filter((o) => o.stage === "Closed Lost");
  const sum = (l, k = "estimated_value") => l.reduce((s, r) => s + Number(r[k] || 0), 0);
  const stageColors = { Prospecting: "#3498db", Qualification: "#9b59b6", Proposal: "#f39c12", Negotiation: "#e67e22", "Closed Won": "#2ecc71", "Closed Lost": "#e74c3c" };
  const sources = countBy(db.leads, "lead_source");
  const palette = ["#2ecc71", "#3498db", "#f39c12", "#9b59b6", "#e74c3c", "#1abc9c"];
  const m = new Date().getMonth();
  const labels = Array.from({ length: 6 }, (_, i) => MONTHS[(m - 5 + i + 12) % 12]);
  const deals = [3, 5, 4, 7, 6, 9];
  const values = [42000, 68000, 51000, 93000, 80000, 126000];
  return ok({
    kpis: {
      total_leads: kpi("Total leads", db.leads.length), total_customers: kpi("Total customers", db.customers.length),
      open_opportunities: kpi("Open opportunities", open.length),
      estimated_open_deal_value: kpi("Estimated open deal value", sum(open), aed(sum(open))),
      new_leads_this_month: kpi("New leads this month", 5), won_deals_this_month: kpi("Won deals this month", won.length),
      lost_deals_this_month: kpi("Lost deals this month", lost.length), follow_ups_due_today: kpi("Follow-ups due today", 3),
      overdue_activities: kpi("Overdue activities", db.activities.filter((a) => a.status === "Overdue").length),
      conversion_rate: kpi("Conversion rate", 24, "24%"), quotation_value: kpi("Quotation value", sum(db.quotations, "grand_total"), aed(sum(db.quotations, "grand_total"))),
      average_deal_value: kpi("Average deal value", Math.round(sum(db.opportunities) / Math.max(1, db.opportunities.length)), aed(Math.round(sum(db.opportunities) / Math.max(1, db.opportunities.length)))),
    },
    sales_pipeline: S.STAGES.map((stage) => {
      const l = db.opportunities.filter((o) => o.stage === stage);
      return { stage, count: l.length, value: sum(l), formatted_value: aed(sum(l)), color: stageColors[stage] };
    }),
    lead_sources: Object.entries(sources).map(([source, count], i) => ({ source, count, percentage: Math.round((count / db.leads.length) * 100), color: palette[i % palette.length] })),
    monthly_sales: { labels, deals, values, formatted_values: values.map(aed), series: labels.map((month, i) => ({ month, full_month: month, deals: deals[i], value: values[i], formatted_value: aed(values[i]) })) },
    upcoming_activities: db.activities.filter((a) => a.status !== "Completed").slice(0, 6).map((a) => ({
      id: a.id, action_view_id: a.id, activity: a.subject, activity_type: a.activity_type, customer: a.related_record_label,
      assignee: a.assigned_employee_name, due: new Date(a.start_date_time).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      raw_due: a.start_date_time, priority: a.priority, status: a.status,
    })),
    recent_activities: db.activities.slice(0, 6).map((a) => ({ id: a.id, title: a.subject, subtitle: a.related_record_label, type: a.activity_type, created_at: a.created_at, user: a.assigned_employee_name })),
    filters: {},
  });
};

const hrDashboard = () => {
  const active = db.employees.filter((e) => e.user.status === "active");
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const bday = (e, i) => ({ id: e.id, name: e.name, date: S.ymd(i * 6 + 1), avatar: null, department: e.user.department.name });
  return ok({
    stats: { today: { punched_in: Math.max(0, active.length - 3), late: 2, absent: 1 } },
    charts: {
      weekly_attendance: { labels, present: [17, 18, 16, 18, 15, 4, 0], absent: [1, 0, 2, 0, 3, 0, 0], late: [2, 1, 2, 1, 2, 0, 0], data: [17, 18, 16, 18, 15, 4, 0] },
      department_distribution: db.departments.map((d) => ({ name: d.name, count: db.employees.filter((e) => e.department_id === d.id).length })),
    },
    tasks: db.tasks.slice(0, 5),
    recent_data: {
      employees: active,
      birthdays: active.slice(0, 3).map(bday),
      employee_special_days: active.slice(3, 6).map(bday),
      leaves_today: db.leaves.filter((l) => l.status === "approved").slice(0, 3).map((l) => {
        const e = db.employees.find((x) => x.id === l.employee_id) || {};
        return {
          id: l.id, employee_id: l.employee_id, employee_name: l.employee?.name, leave_type: l.leave_type?.name,
          department_name: e.user?.department?.name, designation: e.user?.designation?.name, duration_days: l.duration_days,
          session1: null, session2: null,
        };
      }),
    },
    metadata: { generated_at: new Date().toISOString() },
  });
};

const employeeDashboard = () => {
  const role = currentRole();
  const u = role.user;
  const emp = db.employees.find((e) => e.name === u.name) || db.employees[7];
  const dmy = (d) => { const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, "0")}/${String(x.getUTCMonth() + 1).padStart(2, "0")}/${x.getUTCFullYear()}`; };
  const hhmm = (d) => (d ? new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "--");
  const history = Array.from({ length: 10 }, (_, i) => {
    const day = S.iso(-i);
    const weekend = [0, 6].includes(new Date(day).getUTCDay());
    if (weekend) return null;
    return {
      id: i + 1, log_date: dmy(day), date: day.slice(0, 10), punch_in: hhmm(S.iso(-i, 9)), punch_out: hhmm(S.iso(-i, 18)),
      working_hours: i % 4 === 0 ? "7h 40m" : "8h 30m", status: "present", punch_in_address: "Business Bay, Dubai", punch_out_address: "Business Bay, Dubai",
    };
  }).filter(Boolean);
  const mine = db.tasks.map((t) => ({ ...t, status: ["assigned", "in_progress", "completed"][t.id % 3], project_name: t.project?.name }));
  return ok({
    employee: { ...emp, employee_id: emp.employee_code, avatar: null },
    is_hr: ["hr", "admin"].includes(u.type) || role.id === "hr_manager",
    is_team_lead: role.id === "project_manager",
    can_punch: true, timezone: "Asia/Dubai",
    today_attendance: { punched_in: false, punched_out: false, punch_in_time: "--", punch_out_time: "--" },
    days_present: 18, leave_stats: { total_taken: 4, balance: 22 },
    attendance_history: history,
    pending_punch_out: null, error_message: null,
    tasks: { all_tasks: mine, today_assigned_tasks: mine.slice(0, 3) },
    recent_data: { birthdays: [], employee_special_days: [], special_days: [] },
    leaves_today_by_department: [], birthdays: [],
  });
};

const leaveAllocations = () =>
  ok(db.employees.slice(0, 12).flatMap((e) => db.leaveTypes.slice(0, 3).map((t, i) => ({
    id: e.id * 10 + i, employee_id: e.id, employee: { id: e.id, name: e.name, first_name: e.first_name, last_name: e.last_name },
    leave_type_id: t.id, leave_type: t, allocated_days: t.days_per_year, used_days: (e.id + i) % 5, remaining_days: t.days_per_year - ((e.id + i) % 5), year: new Date().getFullYear(),
  }))));

const leadFormOptions = () => ({
  lead_types: ["Company", "Individual", "Enterprise", "SMB"],
  lead_sources: ["Website", "Referral", "Cold Call", "LinkedIn", "Campaign", "Social Media", "Event", "Other"],
  lead_statuses: ["New", "Contacted", "Working", "Qualified", "Unqualified", "Converted", "Lost"],
  priorities: ["Low", "Medium", "High", "Urgent"],
  industries: ["IT Services & Software", "Healthcare & Medical", "Manufacturing", "Financial Services", "Retail & E-commerce", "Education", "Real Estate & Construction", "Logistics & Supply Chain", "Services", "Other"],
  interested_products: ["HRMS", "ERP", "CRM", "Payroll", "Attendance System", "Custom Development"],
  follow_up_types: ["Call", "Meeting", "Email", "Demo", "Task"],
  salespersons: S.employees.slice(2, 8).map((e) => ({ id: e.id, name: e.name })),
  sales_teams: S.salesTeams,
});
const commonFormOptions = () => ({
  ...leadFormOptions(),
  stages: S.STAGES, statuses: ["Draft", "Sent", "Accepted", "Rejected"], activity_types: ["Call", "Meeting", "Email", "Demo", "Task"],
  customers: db.customers.map((c) => ({ id: c.id, name: c.company_name, company_name: c.company_name })),
  leads: db.leads.map((l) => ({ id: l.id, name: l.company_name })),
  products: db.products, categories: db.categories, currencies: ["AED", "USD", "EUR", "INR", "SAR"],
  units: ["Nos", "Day", "Hour", "Month", "Year"], taxes: [{ id: 1, name: "VAT 5%", rate: 5, is_default: true }, { id: 2, name: "Zero rated", rate: 0 }],
  employees: S.employees.map((e) => ({ id: e.id, name: e.name })), users: S.employees.map((e) => ({ id: e.id, name: e.name })),
  related_types: ["Lead", "Customer", "Opportunity"], reminders: ["None", "15 minutes before", "30 minutes before", "1 hour before"],
  payment_terms: ["Net 15", "Net 30", "Net 45"],
});

// ---------------- route table ----------------------------------------------
const routes = [
  // ---- auth
  ["POST", /^\/auth\/login$/, ({ body }) => {
    const email = String(body.username || "").toLowerCase();
    const role = DEMO_ROLES.find((r) => r.user.email === email) || getRole(localStorage.getItem(ROLE_KEY));
    const { token, user } = writeSession(role.id);
    return ok({ access_token: token, token_type: "bearer", user }, "Login successful");
  }],
  ["GET", /^\/auth\/me$/, () => ok({ user: currentRole().user })],
  ["POST", /^\/auth\/refresh$/, () => ok({ access_token: localStorage.getItem("auth-token") })],
  ["POST", /^\/auth\/(forgot|reset)-password$/, () => ok(null, "Done (demo)")],
  ["GET", /^\/employee\/profile$/, () => ok(currentRole().user)],
  ["POST", /^\/employee\/(update-profile|change-password)$/, ({ body }) => ok({ ...currentRole().user, ...body }, "Saved")],

  // ---- dashboards
  ["GET", /^\/admin\/dashboard$/, hrDashboard],
  ["GET", /^\/employee\/dashboard$/, employeeDashboard],
  ["GET", /^\/admin\/crm\/dashboard$/, crmDashboard],

  // ---- HRMS
  ["GET", /^\/admin\/active-employees$/, ({ q }) => ok(paginate(db.employees.filter((e) => e.user.status === "active"), { ...q, per_page: 500 }))],
  ["POST", /^\/admin\/employees\/upload-temp$/, () => ok({ path: "temp/demo-upload.pdf", url: "" })],
  ["POST", /^\/admin\/employees\/(\d+)\/update-status$/, ({ m, body }) => {
    const e = db.employees.find((r) => String(r.id) === m[1]);
    if (e) { e.user.status = body.status || "active"; persist(); }
    return ok(e, "Status updated");
  }],
  ...crud("/admin/employees", "employees", { shape: "paged" }),
  ...crud("/admin/departments", "departments"),
  ...crud("/admin/designations", "designations"),
  ...crud("/admin/organizations", "organizations"),
  ["GET", /^\/admin\/companies$/, ({ q }) => ok(q.organization_id ? db.companies.filter((c) => String(c.organization_id) === String(q.organization_id)) : db.companies)],
  ...crud("/admin/companies", "companies"),
  ["GET", /^\/admin\/get-active-leave-types$/, () => ok(db.leaveTypes.filter((t) => t.status === "active"))],
  ...crud("/admin/leave-types", "leaveTypes"),
  ["GET", /^\/admin\/leave-allocations(\/\d+)?$/, leaveAllocations],
  ...crud("/admin/leaves", "leaves", { shape: "paged" }),
  ...crud("/admin/holidays", "holidays"),
  // Role-management screen expects rows: { module_id, can_read, can_edit, can_delete }
  ["GET", /^\/admin\/roles\/(\d+)\/permissions$/, ({ m }) => {
    const r = DEMO_ROLES[Number(m[1]) - 1];
    const mods = DEMO_ROLES[0].user.sidebar_modules;
    const perms = r?.user.permissions || {};
    return ok(mods.map((mod) => {
      const p = perms.all ? { read: true, update: true, delete: true } : perms[mod.slug] || {};
      return { module_id: mod.id, can_read: !!p.read, can_edit: !!(p.update || p.create), can_delete: !!p.delete };
    }));
  }],
  ["POST", /^\/admin\/roles\/(\d+)\/permissions$/, ({ m, body }) => ok(body.permissions || body, "Permissions saved")],
  ...crud("/admin/roles", "roles"),
  ["GET", /^\/admin\/modules$/, () => ok(DEMO_ROLES[0].user.sidebar_modules)],
  ["GET", /^\/admin\/projects\/statuses$/, () => ok(["Planning", "In Progress", "On Hold", "Completed", "Cancelled"])],
  ["GET", /^\/admin\/projects\/(\d+)\/tasks$/, ({ m }) => ok({ project: db.projects.find((p) => String(p.id) === m[1]), tasks: db.tasks.filter((t) => String(t.project_id) === m[1]) })],
  ...crud("/admin/projects", "projects", { shape: "paged" }),
  ["GET", /^\/admin\/tasks\/employees$/, () => ok(db.employees.map((e) => ({ id: e.id, name: e.name })))],
  ...crud("/admin/tasks", "tasks", { shape: "paged" }),
  ["GET", /^\/admin\/attendance\/(absentees|late-comers)$/, ({ m }) => ok(db.attendance.filter((a) => a.status === (m[1] === "absentees" ? "absent" : "late")).slice(0, 5))],
  ["GET", /^\/admin\/attendance\/punch-(in|out)-(today|yesterday)$/, () => ok(db.attendance.filter((a) => a.punch_in).slice(0, 8))],
  ["GET", /^\/admin\/attendance$/, ({ q }) => ok(db.attendance.filter((a) => !q.date || a.date === q.date || true))],
  ...crud("/admin/meetings", "meetings"),
  ["GET", /^\/(admin|employee)\/meetings\/form-options$/, () => ok(commonFormOptions())],
  ["GET", /^\/admin\/notifications(\/(all|read))?$/, ({ m }) => ok(m[2] === "read" ? db.notifications.filter((n) => n.read_at) : db.notifications)],
  ["POST", /^\/admin\/notifications\/mark-all-as-read$/, () => { db.notifications.forEach((n) => (n.read_at = n.read_at || new Date().toISOString())); persist(); return ok(null); }],
  ["POST", /^\/admin\/notifications\/([^/]+)\/mark-as-read$/, ({ m }) => { const n = db.notifications.find((r) => String(r.id) === m[1]); if (n) n.read_at = new Date().toISOString(); persist(); return ok(n); }],

  // ---- employee self-service
  ["GET", /^\/employee\/leaves$/, () => {
    const name = currentRole().user.name;
    const own = db.leaves.filter((l) => l.employee?.name === name);
    return ok(own.length ? own : db.leaves.slice(0, 5));
  }],
  ["GET", /^\/employee\/get-active-leave-types$/, () => ok(db.leaveTypes)],
  ["GET", /^\/employee\/tasks$/, () => ok(db.tasks.slice(0, 8))],
  ["POST", /^\/employee\/(punch-in|punch-out|break\/start|break\/end)$/, () => ok({ time: new Date().toISOString() }, "Recorded")],

  // ---- CRM
  ["GET", /^\/admin\/crm\/leads\/form-options$/, () => ok(leadFormOptions())],
  ["GET", /^\/admin\/crm\/leads\/stats$/, () => {
    const by = countBy(db.leads, "lead_status");
    return ok({ total: db.leads.length, total_leads: db.leads.length, new: by.New || 0, contacted: by.Contacted || 0, working: by.Working || 0, qualified: by.Qualified || 0, converted: by.Converted || 0, lost: by.Lost || 0, by_status: by });
  }],
  ["POST", /^\/admin\/crm\/leads\/(\d+)\/convert$/, ({ m }) => { const l = db.leads.find((r) => String(r.id) === m[1]); if (l) l.lead_status = "Converted"; persist(); return ok(l, "Lead converted"); }],
  ...crud("/admin/crm/leads", "leads", { shape: "paged" }),
  ["GET", /^\/admin\/crm\/customers\/stats$/, () => ({ ...ok({ total: db.customers.length, total_customers: db.customers.length, active: db.customers.filter((c) => c.customer_status === "Active").length, inactive: db.customers.filter((c) => c.customer_status !== "Active").length }) })],
  ...crud("/admin/crm/customers", "customers", { shape: "paged" }),
  ["GET", /^\/admin\/crm\/opportunities\/form-options$/, () => ok(commonFormOptions())],
  ["GET", /^\/admin\/crm\/opportunities\/stats$/, () => {
    const open = db.opportunities.filter((o) => !String(o.stage).startsWith("Closed"));
    return ok({ total: db.opportunities.length, open: open.length, won: db.opportunities.filter((o) => o.stage === "Closed Won").length, lost: db.opportunities.filter((o) => o.stage === "Closed Lost").length, pipeline_value: open.reduce((s, o) => s + o.estimated_value, 0) });
  }],
  ...crud("/admin/crm/opportunities", "opportunities", { shape: "paged" }),
  ["GET", /^\/admin\/crm\/activities\/form-options$/, () => ok(commonFormOptions())],
  ["GET", /^\/admin\/crm\/activities\/export$/, () => ok(null)],
  ...crud("/admin/crm/activities", "activities", { shape: "paged" }),
  ["GET", /^\/admin\/crm\/quotations\/form-options$/, () => ok(commonFormOptions())],
  ...crud("/admin/crm/quotations", "quotations", { shape: "paged" }),
  ["GET", /^\/admin\/crm\/products\/form-options$/, () => ok(commonFormOptions())],
  ["GET", /^\/admin\/crm\/products\/categories$/, () => ok(db.categories)],
  ["GET", /^\/admin\/crm\/products\/export$/, () => ok(null)],
  ...crud("/admin/crm/products", "products", { shape: "paged" }),
  ["GET", /^\/admin\/crm\/proposals\/form-options$/, () => ok(commonFormOptions())],
  ...crud("/admin/crm/proposals", "proposals", { shape: "paged" }),
  ["GET", /^\/admin\/crm\/reports\/filter-options$/, () => ok(commonFormOptions())],
  ["GET", /^\/admin\/crm\/crm-permissions$/, () => ok({})],
  ["GET", /^\/admin\/crm\/(lead|activity|opportunity|quotation|customer|product)-settings(\/.*)?$/, () => ok({})],
];

// ---------------- dispatcher -----------------------------------------------
const parseBody = (data) => {
  if (!data) return {};
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const o = {};
    data.forEach((v, k) => { o[k] = typeof v === "string" ? v : v?.name || ""; });
    return o;
  }
  if (typeof data === "string") { try { return JSON.parse(data); } catch { return {}; } }
  return data;
};

const normalise = (config) => {
  let url = config.url || "";
  const base = config.baseURL || "";
  if (base && url.startsWith(base)) url = url.slice(base.length);
  url = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/api(?=\/)/, "");
  const [path, qs = ""] = url.split("?");
  const q = { ...Object.fromEntries(new URLSearchParams(qs)), ...(config.params || {}) };
  return { path: path.replace(/\/+$/, "") || "/", q };
};

export const mockAdapter = (config) =>
  new Promise((resolve, reject) => {
    const method = (config.method || "get").toUpperCase();
    const { path, q } = normalise(config);
    const body = parseBody(config.data);

    let result;
    try {
      const hit = routes.find(([ms, re]) => (Array.isArray(ms) ? ms : [ms]).includes(method) && re.test(path));
      if (hit) {
        const m = path.match(hit[1]);
        result = hit[2]({ m, q, body, path, method });
      } else if (method === "GET") {
        result = ok(config.responseType === "blob" ? "" : [], "OK (demo: no data for this endpoint)");
      } else {
        result = ok({ id: Date.now(), ...body }, "Saved (demo)");
      }
    } catch (err) {
      result = fail(500, err.message || "Mock backend error");
    }

    const status = result.__status || 200;
    const payload = result.__status ? result.body : result;
    const response = {
      data: config.responseType === "blob" ? new Blob([JSON.stringify(payload)], { type: "application/json" }) : payload,
      status, statusText: status === 200 ? "OK" : "Error", headers: {}, config, request: {},
    };
    const delay = 120 + Math.random() * 180;
    setTimeout(() => {
      if (status >= 200 && status < 300) resolve(response);
      else reject(new AxiosError(payload.message, String(status), config, {}, response));
    }, delay);
  });
