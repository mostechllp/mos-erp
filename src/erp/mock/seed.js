// ============================================================================
//  Seed data for the in-browser demo backend. Company: "Gulf Horizon Trading LLC"
//  (fictional). Dates are relative to today so the demo never looks stale.
// ============================================================================
const DAY = 86400000;
const now = Date.now();
export const iso = (offsetDays = 0, hour) => {
  const d = new Date(now + offsetDays * DAY);
  if (hour !== undefined) d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
export const ymd = (offsetDays = 0) => iso(offsetDays).slice(0, 10);
const pick = (arr, i) => arr[i % arr.length];

// ---------------- HRMS master data ----------------
export const departments = ["Engineering", "Sales & Marketing", "Finance & Accounts", "Human Resources", "Operations", "Customer Support"]
  .map((name, i) => ({ id: i + 1, name, created_at: iso(-300 + i), updated_at: iso(-30 + i) }));

export const designations = ["Software Engineer", "Senior Engineer", "Sales Executive", "Sales Manager", "Accountant", "HR Executive", "Project Manager", "Support Specialist", "Operations Lead"]
  .map((name, i) => ({ id: i + 1, name, default_punch_access: i % 2, created_at: iso(-300), updated_at: iso(-20) }));

export const organizations = [
  { id: 1, name: "Gulf Horizon Group", phone: "+971 4 555 0100", email: "info@gulfhorizon.ae", address: "Business Bay, Dubai, UAE", has_multiple_companies: 1, logo: null, parent_organization: null, created_at: iso(-400) },
  { id: 2, name: "Horizon Technologies", phone: "+971 4 555 0121", email: "tech@gulfhorizon.ae", address: "Dubai Internet City, UAE", has_multiple_companies: 0, logo: null, parent_organization: { id: 1, name: "Gulf Horizon Group" }, created_at: iso(-380) },
];

export const companies = [
  { id: 1, organization_id: 1, name: "Gulf Horizon Trading LLC", email: "trading@gulfhorizon.ae", phone: "+971 4 555 0110", trade_license_no: "TL-884213", license_expiry: ymd(48), address: "Business Bay, Dubai", created_at: iso(-390) },
  { id: 2, organization_id: 1, name: "Horizon Logistics FZE", email: "logistics@gulfhorizon.ae", phone: "+971 6 555 0130", trade_license_no: "TL-773102", license_expiry: ymd(130), address: "Sharjah Airport Free Zone", created_at: iso(-300) },
  { id: 3, organization_id: 2, name: "Horizon Technologies LLC", email: "tech@gulfhorizon.ae", phone: "+971 4 555 0121", trade_license_no: "TL-992001", license_expiry: ymd(220), address: "Dubai Internet City", created_at: iso(-250) },
];

const NAMES = [
  ["Aisha", "Rahman"], ["Fatima", "Noor"], ["Rohan", "Mehta"], ["Priya", "Nair"], ["Imran", "Siddiqui"],
  ["Karthik", "Varma"], ["Sneha", "Pillai"], ["Arjun", "Das"], ["Meera", "Krishnan"], ["Omar", "Khalid"],
  ["Layla", "Hassan"], ["Vikram", "Singh"], ["Nadia", "Farooq"], ["Suresh", "Kumar"], ["Hana", "Yusuf"],
  ["Daniel", "Thomas"], ["Anita", "Joseph"], ["Yusuf", "Ali"], ["Reema", "Shah"], ["Tariq", "Mahmood"],
];
export const employees = NAMES.map(([first_name, last_name], i) => {
  const dept = departments[i % departments.length];
  const des = designations[(i * 2) % designations.length];
  const company = companies[i % 3];
  const status = i === 17 ? "onboarding" : i === 19 ? "inactive" : "active";
  return {
    id: i + 1,
    employee_code: `EMP-${String(1001 + i)}`,
    first_name, last_name,
    name: `${first_name} ${last_name}`,
    email: `${first_name.toLowerCase()}.${last_name.toLowerCase()}@gulfhorizon.ae`,
    phone: `+971 50 ${String(1000000 + i * 7331).slice(0, 7)}`,
    gender: i % 3 === 1 ? "Female" : "Male",
    nationality: pick(["India", "UAE", "Pakistan", "Egypt", "Philippines"], i),
    date_of_birth: `199${i % 10}-0${(i % 9) + 1}-1${i % 9}`,
    joining_date: ymd(-900 + i * 37),
    visa_expiry: ymd(25 + i * 9),
    passport_expiry: ymd(200 + i * 20),
    emirates_id_expiry: ymd(60 + i * 12),
    basic_salary: 4500 + i * 450,
    avatar: null,
    user_id: 100 + i,
    user: { id: 100 + i, status, designation: des, department: dept, company, role: { id: (i % 8) + 1, name: "Employee" } },
    department_id: dept.id, designation_id: des.id, company_id: company.id,
    created_at: iso(-900 + i * 37),
  };
});

export const leaveTypes = [
  { id: 1, name: "Annual Leave", days_per_year: 30, status: "active", is_paid: 1 },
  { id: 2, name: "Sick Leave", days_per_year: 15, status: "active", is_paid: 1 },
  { id: 3, name: "Casual Leave", days_per_year: 6, status: "active", is_paid: 1 },
  { id: 4, name: "Unpaid Leave", days_per_year: 0, status: "active", is_paid: 0 },
];

export const leaves = Array.from({ length: 14 }, (_, i) => {
  const emp = employees[(i * 3) % employees.length];
  const status = ["pending", "approved", "approved", "rejected"][i % 4];
  const start = -20 + i * 3;
  return {
    id: i + 1, employee_id: emp.id, employee: { id: emp.id, name: emp.name, first_name: emp.first_name, last_name: emp.last_name },
    leave_type_id: (i % 3) + 1, leave_type: leaveTypes[i % 3],
    start_date: ymd(start), end_date: ymd(start + (i % 3)), duration_days: (i % 3) + 1,
    reason: pick(["Family function", "Medical appointment", "Travel", "Personal work"], i), status,
    created_at: iso(start - 3), updated_at: iso(start - 2),
  };
});

export const holidays = [
  { id: 1, name: "New Year's Day", date: ymd(-308), type: "public" },
  { id: 2, name: "Eid Al Fitr", date: ymd(-230), type: "public" },
  { id: 3, name: "Eid Al Adha", date: ymd(-160), type: "public" },
  { id: 4, name: "UAE National Day", date: ymd(27), type: "public" },
  { id: 5, name: "Commemoration Day", date: ymd(-4), type: "public" },
];

export const projects = [
  { id: 1, name: "Customer Portal Revamp", project_name: "Customer Portal Revamp", client_name: "Al Noor Retail", description: "Rebuild the customer self-service portal.", start_date: ymd(-60), end_date: ymd(40), status: "In Progress", website_url: "https://portal.example.com" },
  { id: 2, name: "Warehouse Management Rollout", project_name: "Warehouse Management Rollout", client_name: "Horizon Logistics", description: "WMS rollout across 3 warehouses.", start_date: ymd(-30), end_date: ymd(90), status: "In Progress", website_url: "" },
  { id: 3, name: "Mobile Sales App", project_name: "Mobile Sales App", client_name: "Internal", description: "Field-sales app with offline quotes.", start_date: ymd(-120), end_date: ymd(-10), status: "Completed", website_url: "" },
  { id: 4, name: "Payroll Automation", project_name: "Payroll Automation", client_name: "Internal", description: "WPS-compliant payroll automation.", start_date: ymd(5), end_date: ymd(75), status: "Planning", website_url: "" },
];

export const tasks = Array.from({ length: 16 }, (_, i) => ({
  id: i + 1,
  name: pick(["Design dashboard wireframes", "Set up CI pipeline", "Migrate customer data", "Write API docs", "UAT with client", "Fix invoice rounding bug", "Prepare payroll WPS file", "Review vendor contracts"], i),
  title: pick(["Design dashboard wireframes", "Set up CI pipeline", "Migrate customer data", "Write API docs", "UAT with client", "Fix invoice rounding bug", "Prepare payroll WPS file", "Review vendor contracts"], i),
  task_description: "Demo task generated for the walkthrough.",
  description: "Demo task generated for the walkthrough.",
  status: pick(["Todo", "In Progress", "In Review", "Completed"], i),
  priority: pick(["Low", "Medium", "High", "Urgent"], i + 1),
  due_date: ymd(-3 + i * 2),
  project_id: (i % 4) + 1, project: { id: (i % 4) + 1, name: projects[i % 4].name },
  assigned_to: employees[i % employees.length].id,
  assigned_user: { id: employees[i % employees.length].id, name: employees[i % employees.length].name },
  created_at: iso(-10 - i),
}));

export const notifications = [
  { id: "n1", type: "leave", title: "Leave Request", data: { type: "leave", message: "Rohan Mehta applied for 2 days of annual leave." }, read_at: null, created_at: iso(0, 9) },
  { id: "n2", type: "document", title: "Document Expiry", data: { type: "employee_document", message: "Visa for Priya Nair expires in 25 days." }, read_at: null, created_at: iso(-1, 14) },
  { id: "n3", type: "crm", title: "New Lead", data: { type: "lead", message: "New lead 'Falcon Foods' assigned to you." }, read_at: null, created_at: iso(-1, 10) },
  { id: "n4", type: "accounts", title: "Invoice Overdue", data: { type: "invoice", message: "Invoice INV-000112 is 7 days overdue." }, read_at: iso(-2), created_at: iso(-2, 16) },
];

export const roles = [
  "Super Admin", "HR Manager", "Sales Manager", "Accountant", "Finance Head", "Project Manager", "Sales Executive", "Employee",
].map((name, i) => ({ id: i + 1, name, description: `${name} role`, users_count: i === 7 ? 11 : 1 + (i % 3), created_at: iso(-300) }));

// ---------------- CRM ----------------
const salespeople = employees.slice(2, 8).map((e) => ({ id: e.id, name: e.name }));
export const salesTeams = ["Enterprise", "SMB", "Channel Partners"];

const COMPANIES = ["Falcon Foods", "Al Noor Retail", "Desert Rose Hospitality", "Skyline Builders", "BlueWave Logistics", "Oasis Healthcare", "Gulfstream Motors", "Pearl Education Group", "Zenith Pharma", "Marina Properties", "Atlas Steel Trading", "Sahara Telecom"];
const INDUSTRIES = ["Retail & E-commerce", "Healthcare & Medical", "Real Estate & Construction", "Logistics & Supply Chain", "Education", "Manufacturing", "Financial Services", "IT Services & Software"];

export const leads = COMPANIES.map((company_name, i) => {
  const sp = salespeople[i % salespeople.length];
  return {
    id: i + 1, lead_id: `LD-${String(i + 1).padStart(4, "0")}`,
    lead_type: i % 3 ? "Company" : "Enterprise", lead_name: NAMES[(i + 5) % 20].join(" "), company_name,
    designation: pick(["Procurement Head", "Operations Director", "CEO", "IT Manager"], i), industry: pick(INDUSTRIES, i),
    website: `www.${company_name.toLowerCase().replace(/[^a-z]/g, "")}.ae`,
    lead_source: pick(["Website", "Referral", "LinkedIn", "Event", "Cold Call", "Campaign"], i),
    lead_status: pick(["New", "Contacted", "Working", "Qualified", "Converted", "Lost"], i),
    priority: pick(["Low", "Medium", "High", "Urgent"], i + 2),
    email: `contact@${company_name.toLowerCase().replace(/[^a-z]/g, "")}.ae`, primary_phone: `+971 4 ${300 + i} ${2000 + i * 13}`,
    alternate_phone: "", address: "Dubai, UAE", city: "Dubai", state: "Dubai", country: "United Arab Emirates", postal_code: "",
    expected_value: 15000 + i * 8500, expected_closing_date: ymd(10 + i * 4),
    assigned_salesperson: sp, assigned_salesperson_id: sp.id, sales_team: pick(salesTeams, i),
    interested_products: [pick(["HRMS", "ERP", "CRM", "Payroll", "Attendance System"], i)],
    follow_up_type: "Call", follow_up_notes: "Share product deck and book a demo.", next_follow_up_at: iso(1 + (i % 5), 11),
    notes: "Demo lead.", created_at: iso(-40 + i * 3), updated_at: iso(-i), follow_ups: [],
  };
});

export const customers = COMPANIES.slice(0, 8).map((company_name, i) => {
  const am = salespeople[i % salespeople.length];
  return {
    id: i + 1, customer_id: `CU-${String(i + 1).padStart(4, "0")}`, company_name,
    contact_person_name: NAMES[(i + 8) % 20].join(" "), contact_designation: "Procurement Manager",
    contact_email: `accounts@${company_name.toLowerCase().replace(/[^a-z]/g, "")}.ae`, contact_phone: `+971 4 ${400 + i} ${3000 + i * 17}`,
    contact_alternate_phone: "", customer_type: pick(["Company", "Enterprise", "SMB"], i), customer_status: i === 6 ? "Inactive" : "Active",
    customer_category: pick(["Gold", "Silver", "Platinum"], i), customer_source: pick(["Referral", "Website", "Event"], i),
    industry: pick(INDUSTRIES, i), website: "", country: "United Arab Emirates", state: "Dubai", city: "Dubai", postal_code: "",
    billing_address: "Dubai, UAE", shipping_address: "Dubai, UAE", tax_gst_no: `1000${i}2345600003`,
    company_registration_no: `CN-${5000 + i}`, credit_limit: 50000 + i * 10000, payment_terms: pick(["Net 15", "Net 30", "Net 45"], i),
    preferred_communication: "Email", customer_since: ymd(-700 + i * 60), account_manager: am, account_manager_id: am.id,
    notes: "", created_at: iso(-700 + i * 60), updated_at: iso(-i),
  };
});

export const STAGES = ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
export const opportunities = Array.from({ length: 12 }, (_, i) => {
  const cust = customers[i % customers.length];
  const sp = salespeople[i % salespeople.length];
  const stage = STAGES[i % STAGES.length];
  return {
    id: i + 1, opportunity_number: `OPP-${String(i + 1).padStart(4, "0")}`,
    name: `${cust.company_name} – ${pick(["ERP Implementation", "HRMS Licences", "Annual Support", "CRM Rollout"], i)}`,
    title: `${cust.company_name} – ${pick(["ERP Implementation", "HRMS Licences", "Annual Support", "CRM Rollout"], i)}`,
    customer_id: cust.id, customer_name: cust.company_name, customer: { id: cust.id, company_name: cust.company_name },
    stage, estimated_value: 20000 + i * 11000, value: 20000 + i * 11000, currency: "AED",
    probability: stage === "Closed Won" ? 100 : stage === "Closed Lost" ? 0 : 20 + (i % 4) * 20,
    expected_close_date: ymd(7 + i * 5), expected_closing_date: ymd(7 + i * 5),
    priority: pick(["Low", "Medium", "High"], i), lead_source: pick(["Website", "Referral", "Event"], i),
    assigned_salesperson: sp, assigned_salesperson_id: sp.id, assigned_salesperson_name: sp.name,
    sales_team: pick(salesTeams, i), description: "Demo opportunity.", next_action: "Send revised proposal",
    products: [], activities: [], quotations: [], created_at: iso(-30 + i * 2), updated_at: iso(-i),
  };
});

export const crmProducts = [
  ["HRMS Licence (per user)", "Software", 45], ["ERP Core Licence", "Software", 120], ["CRM Licence (per user)", "Software", 55],
  ["Implementation Services", "Services", 900], ["Annual Support Plan", "Services", 6500], ["Biometric Device", "Hardware", 1450],
  ["Custom Development (day)", "Services", 1200], ["Payroll Module", "Software", 30],
].map(([product_name, category_name, unit_price], i) => ({
  id: i + 1, product_code: `PRD-${String(i + 1).padStart(3, "0")}`, name: product_name, product_name, category_name, category_id: ["Software", "Services", "Hardware"].indexOf(category_name) + 1,
  product_type: category_name === "Services" ? "Service" : "Product", unit_price, price: unit_price, default_price: unit_price, tax_percent: 5, tax_rate: 5,
  unit: category_name === "Services" ? "Day" : "Nos", currency: "AED", status: "Active", description: "", created_at: iso(-200 + i), updated_at: iso(-i),
}));

export const crmCategories = ["Software", "Services", "Hardware"].map((name, i) => ({
  id: i + 1, name, category_name: name, status: "Active", products_count: crmProducts.filter((p) => p.category_name === name).length,
}));

export const quotations = Array.from({ length: 8 }, (_, i) => {
  const cust = customers[i % customers.length];
  const subtotal = 12000 + i * 5400;
  const tax = Math.round(subtotal * 0.05);
  return {
    id: i + 1, quotation_number: `QT-${String(2400 + i)}`, number: `QT-${String(2400 + i)}`,
    customer_id: cust.id, customer_name: cust.company_name, customer: { id: cust.id, company_name: cust.company_name },
    contact_person: cust.contact_person_name, contact_email: cust.contact_email, contact_phone: cust.contact_phone,
    quotation_date: ymd(-20 + i * 2), valid_until: ymd(10 + i * 2),
    status: pick(["Draft", "Sent", "Accepted", "Rejected", "Sent"], i), currency: "AED",
    subtotal, tax_total: tax, grand_total: subtotal + tax, total: subtotal + tax, additional_charges: 0,
    payment_terms: "Net 30", delivery_timeline: "2 weeks", notes: "", terms_and_conditions: "Prices exclude installation unless stated.",
    items: [
      { id: 1, product_id: 1, description: "HRMS Licence (per user)", quantity: 100, unit_price: 45, tax_percent: 5, total: 4725 },
      { id: 2, product_id: 4, description: "Implementation Services", quantity: 8, unit_price: 900, tax_percent: 5, total: 7560 },
    ],
    created_by_name: "Rohan Mehta", created_at: iso(-20 + i * 2), updated_at: iso(-i),
  };
});

export const activities = Array.from({ length: 14 }, (_, i) => {
  const emp = salespeople[i % salespeople.length];
  const cust = customers[i % customers.length];
  return {
    id: i + 1, activity_id: `ACT-${String(i + 1).padStart(4, "0")}`, subject: pick(["Discovery call", "Product demo", "Send proposal", "Follow-up email", "Contract review", "Site visit"], i),
    title: pick(["Discovery call", "Product demo", "Send proposal", "Follow-up email", "Contract review", "Site visit"], i),
    activity_type: pick(["Call", "Meeting", "Email", "Demo", "Task"], i), type: pick(["Call", "Meeting", "Email", "Demo", "Task"], i),
    status: pick(["Pending", "Completed", "Pending", "Overdue"], i), priority: pick(["Low", "Medium", "High"], i),
    start_date_time: iso(-3 + i, 10), end_date_time: iso(-3 + i, 11), start_at: iso(-3 + i, 10), end_at: iso(-3 + i, 11),
    related_record_type: "Customer", related_record_id: cust.id, related_record_label: cust.company_name, related_name: cust.company_name,
    assigned_employee_id: emp.id, assigned_employee: emp, assigned_employee_name: emp.name, assigned_to_name: emp.name,
    description: "", reminder: "30 minutes before", created_at: iso(-5 + i),
  };
});

export const proposals = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1, proposal_number: `PR-${String(300 + i)}`, proposal_reference: `PR-${String(300 + i)}`, serial_no: i + 1,
  customer_id: customers[i].id, customer_name: customers[i].company_name, date: ymd(-30 + i * 4),
  status: pick(["Draft", "Shared", "Accepted"], i), drive_link: "https://drive.google.com/", created_at: iso(-30 + i * 4),
}));

// ---------------- Employee-self-service ----------------
export const attendance = Array.from({ length: 60 }, (_, i) => {
  const emp = employees[i % 15];
  const day = -Math.floor(i / 15);
  const late = i % 7 === 0;
  const absent = i % 11 === 0;
  return {
    id: i + 1, employee_id: emp.id, employee: { id: emp.id, name: emp.name, first_name: emp.first_name, last_name: emp.last_name, department: emp.user.department },
    date: ymd(day), status: absent ? "absent" : late ? "late" : "present",
    punch_in: absent ? null : iso(day, late ? 10 : 9), punch_out: absent ? null : iso(day, 18),
    working_hours: absent ? 0 : late ? 7.5 : 8.5, punch_in_address: "Business Bay, Dubai", punch_out_address: "Business Bay, Dubai",
    punch_in_latitude: 25.1858, punch_in_longitude: 55.2744, punch_out_latitude: 25.1858, punch_out_longitude: 55.2744,
  };
});

export const meetings = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1, title: pick(["Sprint planning", "Client kickoff", "Monthly all-hands", "Sales pipeline review", "Finance close sync", "HR policy review"], i),
  description: "", date: ymd(-2 + i), start_time: "10:00", end_time: "11:00", status: pick(["Scheduled", "Completed", "Scheduled"], i),
  location: pick(["Meeting Room 2", "Zoom", "Boardroom"], i), organizer: employees[i % 5], created_at: iso(-5 + i),
}));
