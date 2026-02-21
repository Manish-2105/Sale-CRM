import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("crm.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL, -- 'admin' or 'employee'
    designation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS targets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL,
    sales_target_yearly REAL DEFAULT 0,
    sales_target_monthly REAL DEFAULT 0,
    call_target_monthly INTEGER DEFAULT 0,
    email_target_monthly INTEGER DEFAULT 0,
    whatsapp_target_monthly INTEGER DEFAULT 0,
    social_target_monthly INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    calls INTEGER DEFAULT 0,
    emails INTEGER DEFAULT 0,
    whatsapp INTEGER DEFAULT 0,
    social INTEGER DEFAULT 0,
    revenue REAL DEFAULT 0,
    leads INTEGER DEFAULT 0,
    followups INTEGER DEFAULT 0,
    remarks TEXT,
    kpi_data TEXT, -- JSON string for dynamic KPIs
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1
  );
`);

// Seed initial data if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  // Admin
  db.prepare("INSERT INTO users (name, email, password, role, designation) VALUES (?, ?, ?, ?, ?)")
    .run("Admin Manager", "admin@scholar.com", "admin123", "admin", "Manager");
  
  // Employees
  const emp1 = db.prepare("INSERT INTO users (name, email, password, role, designation) VALUES (?, ?, ?, ?, ?)")
    .run("Rajesh Kumar", "rajesh@scholar.com", "emp123", "employee", "Sr. Sales Executive");
  const emp2 = db.prepare("INSERT INTO users (name, email, password, role, designation) VALUES (?, ?, ?, ?, ?)")
    .run("Priya Sharma", "priya@scholar.com", "emp123", "employee", "Sales Executive");
  const emp3 = db.prepare("INSERT INTO users (name, email, password, role, designation) VALUES (?, ?, ?, ?, ?)")
    .run("Amit Patel", "amit@scholar.com", "emp123", "employee", "Team Leader");

  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();

  // Targets
  const insertTarget = db.prepare(`
    INSERT INTO targets (user_id, year, month, sales_target_yearly, sales_target_monthly, call_target_monthly, email_target_monthly, whatsapp_target_monthly, social_target_monthly)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertTarget.run(emp1.lastInsertRowid, year, month, 5000000, 400000, 500, 300, 200, 100);
  insertTarget.run(emp2.lastInsertRowid, year, month, 3000000, 250000, 600, 400, 300, 150);
  insertTarget.run(emp3.lastInsertRowid, year, month, 8000000, 700000, 400, 200, 100, 50);

  // Reports (Sample for last 5 days)
  const insertReport = db.prepare(`
    INSERT INTO reports (user_id, date, calls, emails, whatsapp, social, revenue, leads, followups, remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (let i = 0; i < 5; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    insertReport.run(emp1.lastInsertRowid, dateStr, 25, 15, 10, 5, 15000, 3, 5, "Good day, closed one library subscription.");
    insertReport.run(emp2.lastInsertRowid, dateStr, 30, 20, 15, 8, 12000, 5, 8, "Followed up with 3 universities.");
    insertReport.run(emp3.lastInsertRowid, dateStr, 20, 10, 5, 3, 45000, 2, 3, "Institutional meeting successful.");
  }

  // KPIs
  db.prepare("INSERT INTO kpis (name, description) VALUES (?, ?)").run("Library Visits", "Number of physical library visits conducted.");
  db.prepare("INSERT INTO kpis (name, description) VALUES (?, ?)").run("Webinar Attendance", "Number of institutional webinars hosted.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role, designation FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Users Management
  app.get("/api/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, designation FROM users").all();
    res.json(users);
  });

  app.post("/api/users", (req, res) => {
    const { name, email, password, role, designation } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (name, email, password, role, designation) VALUES (?, ?, ?, ?, ?)")
        .run(name, email, password, role, designation);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.delete("/api/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Targets
  app.get("/api/targets/:userId", (req, res) => {
    const target = db.prepare("SELECT * FROM targets WHERE user_id = ? ORDER BY year DESC, month DESC LIMIT 1").get(req.params.userId);
    res.json(target || {});
  });

  app.post("/api/targets", (req, res) => {
    const { user_id, year, month, sales_target_yearly, sales_target_monthly, call_target_monthly, email_target_monthly, whatsapp_target_monthly, social_target_monthly } = req.body;
    const existing = db.prepare("SELECT id FROM targets WHERE user_id = ? AND year = ? AND month = ?").get(user_id, year, month);
    
    if (existing) {
      db.prepare(`
        UPDATE targets SET 
          sales_target_yearly = ?, sales_target_monthly = ?, call_target_monthly = ?, 
          email_target_monthly = ?, whatsapp_target_monthly = ?, social_target_monthly = ?
        WHERE id = ?
      `).run(sales_target_yearly, sales_target_monthly, call_target_monthly, email_target_monthly, whatsapp_target_monthly, social_target_monthly, existing.id);
    } else {
      db.prepare(`
        INSERT INTO targets (user_id, year, month, sales_target_yearly, sales_target_monthly, call_target_monthly, email_target_monthly, whatsapp_target_monthly, social_target_monthly)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(user_id, year, month, sales_target_yearly, sales_target_monthly, call_target_monthly, email_target_monthly, whatsapp_target_monthly, social_target_monthly);
    }
    res.json({ success: true });
  });

  // Reports
  app.get("/api/reports/:userId", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports WHERE user_id = ? ORDER BY date DESC").all(req.params.userId);
    res.json(reports);
  });

  app.post("/api/reports", (req, res) => {
    const { user_id, date, calls, emails, whatsapp, social, revenue, leads, followups, remarks, kpi_data } = req.body;
    db.prepare(`
      INSERT INTO reports (user_id, date, calls, emails, whatsapp, social, revenue, leads, followups, remarks, kpi_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, date, calls, emails, whatsapp, social, revenue, leads, followups, remarks, JSON.stringify(kpi_data));
    res.json({ success: true });
  });

  // Dashboard Stats (Admin)
  app.get("/api/admin/stats", (req, res) => {
    const month = new Date().getMonth() + 1;
    const year = new Date().getFullYear();

    const teamStats = db.prepare(`
      SELECT 
        SUM(r.calls) as total_calls,
        SUM(r.emails) as total_emails,
        SUM(r.whatsapp) as total_whatsapp,
        SUM(r.social) as total_social,
        SUM(r.revenue) as total_revenue
      FROM reports r
      WHERE strftime('%m', r.date) = ? AND strftime('%Y', r.date) = ?
    `).get(month.toString().padStart(2, '0'), year.toString());

    const teamTargets = db.prepare(`
      SELECT 
        SUM(sales_target_monthly) as total_sales_target,
        SUM(call_target_monthly) as total_call_target
      FROM targets
      WHERE month = ? AND year = ?
    `).get(month, year);

    const individualPerformance = db.prepare(`
      SELECT 
        u.name, 
        u.designation,
        SUM(r.revenue) as achieved_revenue,
        t.sales_target_monthly as target_revenue,
        SUM(r.calls) as achieved_calls,
        t.call_target_monthly as target_calls
      FROM users u
      LEFT JOIN reports r ON u.id = r.user_id AND strftime('%m', r.date) = ? AND strftime('%Y', r.date) = ?
      LEFT JOIN targets t ON u.id = t.user_id AND t.month = ? AND t.year = ?
      WHERE u.role = 'employee'
      GROUP BY u.id
      ORDER BY achieved_revenue DESC
    `).all(month.toString().padStart(2, '0'), year.toString(), month, year);

    res.json({
      teamStats,
      teamTargets,
      individualPerformance
    });
  });

  // KPIs
  app.get("/api/kpis", (req, res) => {
    res.json(db.prepare("SELECT * FROM kpis WHERE is_active = 1").all());
  });

  app.post("/api/kpis", (req, res) => {
    const { name, description } = req.body;
    db.prepare("INSERT INTO kpis (name, description) VALUES (?, ?)").run(name, description);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
