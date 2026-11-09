// ============================================================================
//  MOS ERP — demo roles
//  Each role produces the exact `user` shape the existing Sidebar / ProtectedRoute
//  already understand: { type, role, permissions, sidebar_modules }.
//  Nothing in the app needs to know it is a "demo": switching role just swaps
//  this object in the Redux auth slice (see demoSession.js).
// ============================================================================

// ---- Sidebar catalogue (mirrors PARENT_MENU_CONFIG in components/common/Sidebar.jsx)
export const CRM_CHILDREN = [
  "crm-dashboard", "crm-leads", "crm-customers", "crm-opportunities", "crm-activities",
  "crm-quotations", "crm-proposals", "crm-products", "crm-reports", "crm-settings",
];

export const ACCOUNTS_CHILDREN = [
  "accounts-dashboard", "items",
  "sales", "sales-customers", "sales-quotes", "sales-orders", "sales-invoices",
  "sales-recurring", "sales-challans", "sales-payments", "sales-credits",
  "purchases", "purchases-vendors", "purchases-expenses", "purchases-recurring",
  "purchases-orders", "purchases-bills", "purchases-recurring-bills",
  "purchases-payments", "purchases-credits",
  "time-tracking", "time-projects", "time-timesheet",
  "banking",
  "accountant", "acc-journals", "acc-bulk", "acc-currency", "acc-coa", "acc-budgets", "acc-locking",
  "accounts-reports", "account-documents",
];

const MODULE_NAMES = {
  dashboard: "Dashboard", onboarding: "Onboarding", offboarding: "Offboarding",
  employees: "Employees", attendance: "Attendance", "attendance-requests": "Attendance Requests",
  "wfh-requests": "WFH Requests", documents: "Documents", leaves: "Leaves",
  "my-leaves": "My Leaves", "task-reports": "Task Reports", reports: "Reports",
  projects: "Projects", "project-tasks": "Project Tasks", payroll: "Payroll",
  roles: "Roles", settings: "Settings", "my-tasks": "My Tasks",
  organizations: "Organizations", "my-payroll": "My Payroll", warnings: "Warnings",
  "my-warnings": "My Warnings", meetings: "Meetings", "my-meetings": "My Meetings",
  "my-attendance-requests": "My Attendance Requests",
};

const FULL = { read: true, create: true, update: true, delete: true };
const VIEW = { read: true, create: false, update: false, delete: false };
const EDIT = { read: true, create: true, update: true, delete: false };

// Build a permissions object. `hrms` = { slug: access }, `crm` / `accounts` = array of
// allowed child slugs (everything else in that suite is explicitly denied so the
// sidebar hides it) or `"all"`.
const buildPermissions = ({ hrms = {}, crm = [], accounts = [], crmAccess = EDIT, accountsAccess = EDIT }) => {
  const p = { ...hrms };
  const suite = (parentKeys, children, allowed, access) => {
    const list = allowed === "all" ? children : allowed;
    if (list.length) parentKeys.forEach((k) => (p[k] = access));
    children.forEach((c) => (p[c] = list.includes(c) ? access : { read: false }));
  };
  suite(["crm"], CRM_CHILDREN, crm, crmAccess);
  suite(["accounts"], ACCOUNTS_CHILDREN, accounts, accountsAccess);
  return p;
};

const toModules = (permissions) =>
  Object.keys(permissions)
    .filter((slug) => MODULE_NAMES[slug] && permissions[slug].read)
    .map((slug, i) => ({ id: i + 1, slug, name: MODULE_NAMES[slug], status: "active" }));

const allHrms = (access = FULL) =>
  Object.fromEntries(
    ["dashboard","onboarding","offboarding","employees","attendance","attendance-requests",
     "wfh-requests","documents","leaves","task-reports","reports","projects","project-tasks",
     "payroll","roles","settings","organizations","warnings","meetings"].map((s) => [s, access])
  );

// ----------------------------------------------------------------------------
//  Demo roles
// ----------------------------------------------------------------------------
const DEFS = [
  {
    id: "super_admin", label: "Super Admin", suite: "All modules", icon: "fa-crown", color: "#2ecc71",
    description: "Full access to HRMS, CRM and Accounts, plus roles & settings.",
    type: "admin", roleName: "Super Admin", person: { name: "Aisha Rahman", email: "aisha@mostech.ae" },
    permissions: { all: true },
  },
  {
    id: "hr_manager", label: "HR Manager", suite: "HRMS", icon: "fa-users", color: "#3498db",
    description: "People operations: employees, onboarding, attendance, leave, payroll.",
    type: "admin", roleName: "HR Manager", person: { name: "Fatima Noor", email: "fatima.hr@mostech.ae" },
    permissions: buildPermissions({
      hrms: {
        ...allHrms(EDIT),
        roles: { read: false }, settings: VIEW, meetings: EDIT, payroll: FULL, employees: FULL,
      },
    }),
  },
  {
    id: "sales_manager", label: "Sales Manager", suite: "CRM", icon: "fa-handshake", color: "#f39c12",
    description: "Leads, opportunities, quotations, products, CRM reports & settings.",
    type: "admin", roleName: "Sales Manager", person: { name: "Rohan Mehta", email: "rohan.sales@mostech.ae" },
    permissions: buildPermissions({
      hrms: {
        dashboard: VIEW, meetings: EDIT, projects: VIEW, "project-tasks": VIEW,
        reports: { read: false }, settings: VIEW,
      },
      crm: "all", crmAccess: FULL,
      accounts: ["accounts-dashboard", "sales", "sales-customers", "sales-quotes", "sales-orders", "sales-invoices"],
      accountsAccess: VIEW,
    }),
  },
  {
    id: "accountant", label: "Accountant", suite: "Accounts", icon: "fa-calculator", color: "#9b59b6",
    description: "Books of accounts: sales, purchases, banking, journals, reports.",
    type: "admin", roleName: "Accountant", person: { name: "Priya Nair", email: "priya.acc@mostech.ae" },
    permissions: buildPermissions({
      hrms: { dashboard: VIEW, payroll: VIEW, settings: VIEW },
      accounts: "all", accountsAccess: FULL,
      crm: ["crm-dashboard", "crm-customers", "crm-quotations"], crmAccess: VIEW,
    }),
  },
  {
    id: "finance_head", label: "Finance Head", suite: "Accounts + Payroll", icon: "fa-chart-line", color: "#e74c3c",
    description: "Approvals and oversight: accounts, budgets, locking, payroll, reports.",
    type: "admin", roleName: "Finance Head", person: { name: "Imran Siddiqui", email: "imran.fin@mostech.ae" },
    permissions: buildPermissions({
      hrms: { dashboard: VIEW, payroll: FULL, reports: VIEW, "my-payroll": VIEW, settings: VIEW },
      accounts: "all", accountsAccess: FULL,
      crm: ["crm-dashboard", "crm-reports"], crmAccess: VIEW,
    }),
  },
  {
    id: "project_manager", label: "Project Manager", suite: "Projects", icon: "fa-diagram-project", color: "#1abc9c",
    description: "Manager portal: projects, project tasks, team task reports, meetings.",
    type: "manager", roleName: "Project Manager", person: { name: "Karthik Varma", email: "karthik.pm@mostech.ae" },
    permissions: buildPermissions({
      hrms: {
        dashboard: VIEW, projects: FULL, "project-tasks": FULL, "task-reports": EDIT,
        "my-tasks": EDIT, "my-leaves": EDIT, attendance: VIEW, "attendance-requests": EDIT,
        "wfh-requests": EDIT, meetings: EDIT, "my-meetings": VIEW, "my-payroll": VIEW,
        "my-warnings": VIEW,
      },
      crm: ["crm-dashboard", "crm-customers", "crm-activities"], crmAccess: VIEW,
    }),
  },
  {
    id: "sales_exec", label: "Sales Executive", suite: "CRM (own work)", icon: "fa-user-tag", color: "#e67e22",
    description: "Employee portal with CRM: leads, activities, quotations. No settings.",
    type: "employee", roleName: "Sales Executive", person: { name: "Sneha Pillai", email: "sneha.sales@mostech.ae" },
    permissions: buildPermissions({
      hrms: {
        dashboard: VIEW, "my-leaves": EDIT, "my-tasks": EDIT, "my-payroll": VIEW,
        "my-warnings": VIEW, "my-meetings": VIEW, meetings: EDIT, "wfh-requests": EDIT,
        "my-attendance-requests": EDIT,
      },
      crm: ["crm-dashboard", "crm-leads", "crm-customers", "crm-opportunities", "crm-activities", "crm-quotations", "crm-products"],
      crmAccess: EDIT,
    }),
  },
  {
    id: "employee", label: "Employee", suite: "Self-service", icon: "fa-user", color: "#7f8c8d",
    description: "Self-service: attendance, leave, WFH, tasks, payslips, warnings.",
    type: "employee", roleName: "Employee", person: { name: "Arjun Das", email: "arjun.das@mostech.ae" },
    permissions: buildPermissions({
      hrms: {
        dashboard: VIEW, "my-leaves": EDIT, "my-tasks": EDIT, "task-reports": EDIT,
        "my-payroll": VIEW, "my-warnings": VIEW, "my-meetings": VIEW, meetings: EDIT,
        "wfh-requests": EDIT, "my-attendance-requests": EDIT,
      },
    }),
  },
];

// ---- route allow-list used by the demo route guard --------------------------
const SLUG_PREFIX = {
  dashboard: ["/dashboard"], onboarding: ["/employees/onboarding", "/onboarding"],
  offboarding: ["/employees/offboarding", "/offboarding", "/employees/asset", "/employees/assets", "/employees/visa", "/employees/exit", "/employees/final", "/employees/letters", "/employees/checklist"],
  employees: ["/employees", "/designations", "/departments"], attendance: ["/attendance", "/attendances"],
  "attendance-requests": ["/attendance-requests"], "my-attendance-requests": ["/my-attendance-requests"],
  "wfh-requests": ["/wfh"], documents: ["/documents"], leaves: ["/leaves", "/leave-management", "/request-leave"],
  "my-leaves": ["/my-leaves", "/leaves", "/request-leave"],
  "task-reports": ["/task-reports"], reports: ["/reports"], projects: ["/projects"],
  "project-tasks": ["/project-tasks", "/tasks"], payroll: ["/payroll"], roles: ["/role-management", "/modules"],
  settings: ["/settings"], "my-tasks": ["/my-tasks", "/tasks"], organizations: ["/organizations"],
  "my-payroll": ["/my-payroll"], warnings: ["/warnings"], "my-warnings": ["/my-warnings"],
  meetings: ["/meetings"], "my-meetings": ["/my-meetings"],
};
const ACCOUNT_PREFIX = {
  "accounts-dashboard": ["/accounts/dashboard", "/accounts"], items: ["/accounts/items"],
  "sales-customers": ["/accounts/sales/customers"], "sales-quotes": ["/accounts/sales/quotes"],
  "sales-orders": ["/accounts/sales/orders"], "sales-invoices": ["/accounts/sales/invoices"],
  "sales-recurring": ["/accounts/sales/recurring"], "sales-challans": ["/accounts/sales/challans"],
  "sales-payments": ["/accounts/sales/payments"], "sales-credits": ["/accounts/sales/credit-notes"],
  "purchases-vendors": ["/accounts/purchases/vendors"], "purchases-expenses": ["/accounts/purchases/expenses"],
  "purchases-recurring": ["/accounts/purchases/recurring-expenses", "/accounts/purchases/recurring"],
  "purchases-orders": ["/accounts/purchases/purchase-orders"], "purchases-bills": ["/accounts/purchases/bills"],
  "purchases-recurring-bills": ["/accounts/purchases/recurring-bills"],
  "purchases-payments": ["/accounts/purchases/payments-made"], "purchases-credits": ["/accounts/purchases/vendor-credits"],
  "time-projects": ["/accounts/time-tracking/projects"], "time-timesheet": ["/accounts/time-tracking/timesheet"],
  banking: ["/accounts/banking"], "acc-journals": ["/accounts/accountant/manual-journals"],
  "acc-bulk": ["/accounts/accountant/bulk-update"], "acc-currency": ["/accounts/accountant/currency-adjustments"],
  "acc-coa": ["/accounts/accountant/chart-of-accounts"], "acc-budgets": ["/accounts/accountant/budgets"],
  "acc-locking": ["/accounts/accountant/transaction-locking"], "accounts-reports": ["/accounts/reports"],
  "account-documents": ["/accounts/documents"],
};
const CRM_PREFIX = Object.fromEntries(CRM_CHILDREN.map((c) => [c, [`/crm/${c.replace("crm-", "")}`]]));

const COMMON = ["/notifications", "/profile", "/home", "/approvals"];

const buildAllowedPrefixes = (permissions) => {
  if (permissions.all) return null; // null = everything
  const out = new Set(COMMON);
  const add = (map) =>
    Object.entries(map).forEach(([slug, prefixes]) => {
      if (permissions[slug]?.read) prefixes.forEach((p) => out.add(p));
    });
  add(SLUG_PREFIX); add(ACCOUNT_PREFIX); add(CRM_PREFIX);
  if (permissions["crm-dashboard"]?.read) out.add("/crm/dashboard");
  return [...out];
};

// ---- exported, ready-to-use roles ------------------------------------------
// Every role lands on the ERP Home (launchpad), which only shows what that role can use.
const homeFor = (def) => `${def.type === "admin" ? "/admin" : "/employee"}/home`;

export const DEMO_ROLES = DEFS.map((d, i) => {
  const sidebar_modules = d.permissions.all
    ? Object.keys(MODULE_NAMES).map((slug, n) => ({ id: n + 1, slug, name: MODULE_NAMES[slug], status: "active" }))
    : toModules(d.permissions);
  const user = {
    id: 100 + i,
    type: d.type,
    username: d.person.email,
    name: d.person.name,
    email: d.person.email,
    status: "active",
    role: { id: i + 1, name: d.roleName },
    permissions: d.permissions,
    sidebar_modules,
    employee: { id: 100 + i, name: d.person.name, first_name: d.person.name.split(" ")[0], last_name: d.person.name.split(" ")[1] },
    avatar: null,
  };
  return {
    id: d.id, label: d.label, suite: d.suite, icon: d.icon, color: d.color,
    description: d.description, type: d.type, home: homeFor(d),
    allowedPrefixes: buildAllowedPrefixes(d.permissions), user,
  };
});

export const DEFAULT_ROLE_ID = "super_admin";
export const getRole = (id) => DEMO_ROLES.find((r) => r.id === id) || DEMO_ROLES[0];

// Can `path` (e.g. /admin/crm/leads) be opened by this role?
export const canOpenPath = (role, path) => {
  if (!role?.allowedPrefixes) return true;
  const rest = path.replace(/^\/(admin|employee)/, "") || "/";
  return role.allowedPrefixes.some((p) => rest === p || rest.startsWith(`${p}/`));
};
