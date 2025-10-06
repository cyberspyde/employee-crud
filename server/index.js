import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";
import path from "node:path";
import process from "node:process";
import multer from "multer";

const envFile = process.env.ENV_PATH
  ? path.resolve(process.cwd(), process.env.ENV_PATH)
  : path.resolve(process.cwd(), ".env");

dotenv.config({ path: envFile });

if (!process.env.DATABASE_URL) {
  console.error("[server] Atrof-muhitda DATABASE_URL topilmadi");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false,
  max: Number(process.env.DB_POOL_MAX ?? 10),
});

pool.on("error", (error) => {
  console.error("[server] Kutilmagan ma'lumotlar bazasi xatosi", error);
});

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "server/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use("/uploads", express.static("server/uploads"));

app.post("/upload", upload.single("profile_image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }
  res.json({ filePath: `/uploads/${req.file.filename}` });
});

app.get("/health", async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      // Simple query to test database connection
      await client.query("SELECT 1");
      res.json({
        status: "ok",
        database: "connected",
        timestamp: new Date().toISOString(),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("[server] Health check failed:", error);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

const EMPLOYEE_FIELDS = [
  "employee_id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "date_of_birth",
  "hire_date",
  "position",
  "department",
  "salary",
  "manager_id",
  "employment_status",
  "address_street",
  "address_city",
  "address_state",
  "address_zip",
  "address_country",
  "emergency_contact_name",
  "emergency_contact_phone",
  "skills",
  "years_experience",
  "education_level",
  "profile_image_url",
  "notes",
];

const REQUIRED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "hire_date",
  "position",
  "department",
  "employment_status",
];

const OPTIONAL_STRING_FIELDS = new Set([
  "phone",
  "date_of_birth",
  "manager_id",
  "address_street",
  "address_city",
  "address_state",
  "address_zip",
  "address_country",
  "emergency_contact_name",
  "emergency_contact_phone",
  "education_level",
  "profile_image_url",
  "notes",
]);

function normalizeValue(field, value) {
  if (value === undefined) {
    return undefined;
  }

  if (value === "" && OPTIONAL_STRING_FIELDS.has(field)) {
    return null;
  }

  if (field === "salary") {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (field === "skills") {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map((item) => String(item));
  }

  if (field === "years_experience") {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return value;
}

function sanitizeEmployeePayload(payload) {
  const result = {};
  for (const field of EMPLOYEE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(payload, field)) {
      const normalized = normalizeValue(field, payload[field]);
      if (normalized !== undefined) {
        result[field] = normalized;
      }
    }
  }
  return result;
}

function mapEmployee(row) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email,
    phone: row.phone ?? undefined,
    date_of_birth: row.date_of_birth ?? undefined,
    hire_date: row.hire_date,
    position: row.position,
    department: row.department,
    salary:
      row.salary !== null && row.salary !== undefined
        ? Number(row.salary)
        : undefined,
    manager_id: row.manager_id ?? undefined,
    employment_status: row.employment_status,
    address_street: row.address_street ?? undefined,
    address_city: row.address_city ?? undefined,
    address_state: row.address_state ?? undefined,
    address_zip: row.address_zip ?? undefined,
    address_country: row.address_country ?? undefined,
    emergency_contact_name: row.emergency_contact_name ?? undefined,
    emergency_contact_phone: row.emergency_contact_phone ?? undefined,
    skills: Array.isArray(row.skills) ? row.skills : [],
    years_experience: Number(row.years_experience ?? 0),
    education_level: row.education_level ?? undefined,
    profile_image_url: row.profile_image_url ?? undefined,
    notes: row.notes ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function disableSecurityFeatures() {
  if (String(process.env.DISABLE_RLS ?? "").toLowerCase() !== "true") {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("ALTER TABLE employees DISABLE ROW LEVEL SECURITY;");
    const policies = [
      "Authenticated users can view employees",
      "Authenticated users can insert employees",
      "Authenticated users can update employees",
      "Authenticated users can delete employees",
    ];
    for (const policy of policies) {
      await client.query(
        'DROP POLICY IF EXISTS "' + policy + '" ON employees;',
      );
    }
    console.log(
      "[server] Xodimlar jadvali uchun qatordan darajali xavfsizlik o'chirildi",
    );
  } catch (error) {
    console.warn(
      "[server] Xavfsizlik sozlamalarini o'chirib bo'lmadi:",
      error.message,
    );
  } finally {
    client.release();
  }
}

function buildInsertStatement(payload) {
  const columns = Object.keys(payload);
  const placeholders = columns.map((_, index) => `$${index + 1}`);
  return {
    text: `INSERT INTO employees (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
    values: columns.map((column) => payload[column]),
  };
}

function buildUpdateStatement(payload, id) {
  const columns = Object.keys(payload);
  const setClauses = columns.map(
    (column, index) => `${column} = $${index + 1}`,
  );
  return {
    text: `UPDATE employees SET ${setClauses.join(", ")}, updated_at = now() WHERE id = $${columns.length + 1} RETURNING *`,
    values: [...columns.map((column) => payload[column]), id],
  };
}

async function getNextEmployeeId(client) {
  const result = await client.query(
    "SELECT employee_id FROM employees WHERE employee_id ~ '^[0-9]+$' ORDER BY CAST(employee_id AS INTEGER) DESC LIMIT 1",
  );
  if (result.rows.length === 0) {
    return "1";
  }
  const lastId = parseInt(result.rows[0].employee_id, 10);
  return (lastId + 1).toString();
}

app.get("/employees", async (req, res) => {
  const client = await pool.connect();
  try {
    const { query, department, position, employment_status } = req.query;
    const search = typeof query === "string" ? query.trim() : "";
    const departmentFilter =
      typeof department === "string" ? department : undefined;
    const positionFilter = typeof position === "string" ? position : undefined;
    const statusFilter =
      typeof employment_status === "string" ? employment_status : undefined;

    const clauses = [];
    const values = [];
    let idx = 1;

    if (search) {
      clauses.push(
        `(first_name ILIKE $${idx} OR last_name ILIKE $${idx} OR email ILIKE $${idx} OR employee_id ILIKE $${idx})`,
      );
      values.push(`%${search}%`);
      idx += 1;
    }

    if (departmentFilter && departmentFilter !== "all") {
      clauses.push(`department = $${idx}`);
      values.push(departmentFilter);
      idx += 1;
    }

    if (positionFilter && positionFilter !== "all") {
      clauses.push(`position = $${idx}`);
      values.push(positionFilter);
      idx += 1;
    }

    if (statusFilter && statusFilter !== "all") {
      clauses.push(`employment_status = $${idx}`);
      values.push(statusFilter);
      idx += 1;
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const result = await client.query(
      `SELECT * FROM employees ${where} ORDER BY created_at DESC`,
      values,
    );
    res.json(result.rows.map(mapEmployee));
  } catch (error) {
    console.error("[server] Xodimlarni olishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Xodimlarni olishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.get("/employees/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const employeeId = req.params.id;
    const result = await client.query(
      "SELECT * FROM employees WHERE id = $1 LIMIT 1",
      [employeeId],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Xodim topilmadi" });
      return;
    }
    
    // Fetch experiences and education
    const experiencesResult = await client.query(
      "SELECT * FROM employee_experiences WHERE employee_id = $1 ORDER BY start_date DESC",
      [employeeId]
    );
    const educationResult = await client.query(
      "SELECT * FROM employee_education WHERE employee_id = $1 ORDER BY start_date DESC",
      [employeeId]
    );
    
    const employee = mapEmployee(result.rows[0]);
    employee.experiences = experiencesResult.rows;
    employee.education = educationResult.rows;
    
    res.json(employee);
  } catch (error) {
    console.error("[server] Xodimni olishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Xodimni olishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.post("/employees", async (req, res) => {
  const client = await pool.connect();
  try {
    const payload = sanitizeEmployeePayload(req.body ?? {});
    for (const field of REQUIRED_FIELDS) {
      if (!payload[field]) {
        res
          .status(400)
          .json({ error: `Majburiy maydon kiritilmadi: ${field}` });
        return;
      }
    }
    if (!("skills" in payload)) {
      payload.skills = [];
    }
    payload.employee_id = await getNextEmployeeId(client);
    const statement = buildInsertStatement(payload);
    const result = await client.query(statement.text, statement.values);
    res.status(201).json(mapEmployee(result.rows[0]));
  } catch (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "Xodim allaqachon mavjud" });
      return;
    }
    console.error("[server] Xodimni yaratishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Xodimni yaratishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.put("/employees/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const payload = sanitizeEmployeePayload(req.body ?? {});
    if (Object.keys(payload).length === 0) {
      res.status(400).json({ error: "Yangilash uchun maydonlar kiritilmagan" });
      return;
    }
    const statement = buildUpdateStatement(payload, req.params.id);
    const result = await client.query(statement.text, statement.values);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Xodim topilmadi" });
      return;
    }
    res.json(mapEmployee(result.rows[0]));
  } catch (error) {
    if (error.code === "23505") {
      res.status(409).json({ error: "Xodim allaqachon mavjud" });
      return;
    }
    console.error("[server] Xodimni yangilashda xatolik yuz berdi", error);
    res.status(500).json({ error: "Xodimni yangilashda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.delete("/employees/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query("DELETE FROM employees WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Xodim topilmadi" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error("[server] Xodimni o'chirishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Xodimni o'chirishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

// ==================== EXPERIENCE ENDPOINTS ====================

app.get("/employees/:id/experiences", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM employee_experiences WHERE employee_id = $1 ORDER BY start_date DESC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[server] Tajribalarni olishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Tajribalarni olishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.post("/employees/:id/experiences", async (req, res) => {
  const client = await pool.connect();
  try {
    const { company, position, start_date, end_date, description } = req.body;
    
    if (!company || !position || !start_date) {
      res.status(400).json({ error: "Kompaniya, lavozim va boshlanish sanasi kiritilishi shart" });
      return;
    }

    const result = await client.query(
      `INSERT INTO employee_experiences (employee_id, company, position, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, company, position, start_date, end_date || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("[server] Tajriba qo'shishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Tajriba qo'shishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.put("/employees/:employeeId/experiences/:experienceId", async (req, res) => {
  const client = await pool.connect();
  try {
    const { company, position, start_date, end_date, description } = req.body;
    const result = await client.query(
      `UPDATE employee_experiences 
       SET company = $1, position = $2, start_date = $3, end_date = $4, description = $5, updated_at = now()
       WHERE id = $6 AND employee_id = $7 RETURNING *`,
      [company, position, start_date, end_date || null, description || null, req.params.experienceId, req.params.employeeId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Tajriba topilmadi" });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[server] Tajribani yangilashda xatolik yuz berdi", error);
    res.status(500).json({ error: "Tajribani yangilashda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.delete("/employees/:employeeId/experiences/:experienceId", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "DELETE FROM employee_experiences WHERE id = $1 AND employee_id = $2",
      [req.params.experienceId, req.params.employeeId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Tajriba topilmadi" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error("[server] Tajribani o'chirishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Tajribani o'chirishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

// ==================== EDUCATION ENDPOINTS ====================

app.get("/employees/:id/education", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT * FROM employee_education WHERE employee_id = $1 ORDER BY start_date DESC",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[server] Ta'limni olishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Ta'limni olishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.post("/employees/:id/education", async (req, res) => {
  const client = await pool.connect();
  try {
    const { institution, degree, field_of_study, start_date, end_date, description } = req.body;
    
    if (!institution || !degree || !start_date) {
      res.status(400).json({ error: "Muassasa, daraja va boshlanish sanasi kiritilishi shart" });
      return;
    }

    const result = await client.query(
      `INSERT INTO employee_education (employee_id, institution, degree, field_of_study, start_date, end_date, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, institution, degree, field_of_study || null, start_date, end_date || null, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("[server] Ta'lim qo'shishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Ta'lim qo'shishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.put("/employees/:employeeId/education/:educationId", async (req, res) => {
  const client = await pool.connect();
  try {
    const { institution, degree, field_of_study, start_date, end_date, description } = req.body;
    const result = await client.query(
      `UPDATE employee_education 
       SET institution = $1, degree = $2, field_of_study = $3, start_date = $4, end_date = $5, description = $6, updated_at = now()
       WHERE id = $7 AND employee_id = $8 RETURNING *`,
      [institution, degree, field_of_study || null, start_date, end_date || null, description || null, req.params.educationId, req.params.employeeId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Ta'lim topilmadi" });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("[server] Ta'limni yangilashda xatolik yuz berdi", error);
    res.status(500).json({ error: "Ta'limni yangilashda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.delete("/employees/:employeeId/education/:educationId", async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "DELETE FROM employee_education WHERE id = $1 AND employee_id = $2",
      [req.params.educationId, req.params.employeeId]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Ta'lim topilmadi" });
      return;
    }
    res.status(204).end();
  } catch (error) {
    console.error("[server] Ta'limni o'chirishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Ta'limni o'chirishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

const port = Number(process.env.SERVER_PORT ?? 4000);
const host = process.env.SERVER_HOST ?? "0.0.0.0";

disableSecurityFeatures()
  .catch((error) => {
    console.warn(
      "[server] Xavfsizlikni o'chirish jarayoni muvaffaqiyatsiz bo'ldi:",
      error.message,
    );
  })
  .finally(() => {
    app.listen(port, host, () => {
      console.log(`[server] API listening on http://${host}:${port}`);
    });
  });
