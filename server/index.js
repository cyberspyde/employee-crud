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

const UNASSIGNED_DEPARTMENT_NAME = "Unassigned";

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
  "department_id",
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

  if (field === "department_id") {
    if (value === "" || value === null) {
      return null;
    }
    return value;
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
  const departmentName =
    row.department_name ?? row.department ?? UNASSIGNED_DEPARTMENT_NAME;
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
    department_id: row.department_id ?? undefined,
    department: departmentName,
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

function createHttpError(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  return error;
}

async function ensureDepartmentByName(client, name, description = null) {
  const normalized = (name ?? "").trim();
  if (!normalized) {
    throw createHttpError(400, "Bo'lim nomi kiritilmadi");
  }
  const existing = await client.query(
    "SELECT * FROM departments WHERE LOWER(name) = LOWER($1) LIMIT 1",
    [normalized],
  );
  if (existing.rowCount > 0) {
    return existing.rows[0];
  }
  const inserted = await client.query(
    "INSERT INTO departments (name, description) VALUES ($1, $2) RETURNING *",
    [normalized, description ?? null],
  );
  return inserted.rows[0];
}

async function syncDepartmentAssociation(client, payload) {
  const hasDepartmentField =
    Object.prototype.hasOwnProperty.call(payload, "department") ||
    Object.prototype.hasOwnProperty.call(payload, "department_id");

  if (!hasDepartmentField) {
    return;
  }

  const rawDepartmentId = payload.department_id;
  const trimmedId =
    typeof rawDepartmentId === "string"
      ? rawDepartmentId.trim()
      : rawDepartmentId ?? null;

  if (trimmedId) {
    const result = await client.query(
      "SELECT id, name FROM departments WHERE id = $1 LIMIT 1",
      [trimmedId],
    );
    if (result.rowCount === 0) {
      throw createHttpError(400, "Tanlangan bo'lim topilmadi");
    }
    payload.department_id = result.rows[0].id;
    payload.department = result.rows[0].name;
    return;
  }

  const rawDepartmentName =
    typeof payload.department === "string"
      ? payload.department.trim()
      : "";

  if (rawDepartmentName) {
    const result = await client.query(
      "SELECT id, name FROM departments WHERE LOWER(name) = LOWER($1) LIMIT 1",
      [rawDepartmentName],
    );
    if (result.rowCount > 0) {
      payload.department_id = result.rows[0].id;
      payload.department = result.rows[0].name;
      return;
    }
    const inserted = await client.query(
      "INSERT INTO departments (name) VALUES ($1) RETURNING id, name",
      [rawDepartmentName],
    );
    payload.department_id = inserted.rows[0].id;
    payload.department = inserted.rows[0].name;
    return;
  }

  payload.department_id = null;
  delete payload.department;
}

async function ensureDepartmentAssignment(client, payload) {
  if (payload.department_id) {
    return;
  }
  const fallback = await ensureDepartmentByName(
    client,
    UNASSIGNED_DEPARTMENT_NAME,
    "Default holding department for employees awaiting assignment",
  );
  payload.department_id = fallback.id;
  payload.department = fallback.name;
}

async function fetchDepartmentById(client, departmentId) {
  const result = await client.query(
    "SELECT * FROM departments WHERE id = $1 LIMIT 1",
    [departmentId],
  );
  if (result.rowCount === 0) {
    throw createHttpError(404, "Bo'lim topilmadi");
  }
  return result.rows[0];
}

function mapDepartment(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    parent_id: row.parent_id ?? undefined,
    head_id: row.head_id ?? undefined,
    member_count:
      row.member_count !== undefined && row.member_count !== null
        ? Number(row.member_count)
        : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function toMinimalEmployee(row) {
  return {
    id: row.id,
    employee_id: row.employee_id,
    first_name: row.first_name,
    last_name: row.last_name,
    position: row.position,
  };
}

async function buildDepartmentTree(client) {
  const { rows: departmentRows } = await client.query(`
    SELECT
      d.*,
      COUNT(e.id) AS member_count
    FROM departments d
    LEFT JOIN employees e ON e.department_id = d.id
    GROUP BY d.id
    ORDER BY d.name;
  `);

  const { rows: employeeRows } = await client.query(`
    SELECT
      id,
      employee_id,
      first_name,
      last_name,
      position,
      department_id
    FROM employees
    WHERE department_id IS NOT NULL
    ORDER BY last_name, first_name;
  `);

  const nodeMap = new Map();
  const orderedNodes = [];

  for (const row of departmentRows) {
    const node = {
      ...mapDepartment(row),
      member_count: Number(row.member_count ?? 0),
      employees: [],
      children: [],
      depth: 0,
      path: [],
      path_names: [],
    };
    nodeMap.set(node.id, node);
    orderedNodes.push(node);
  }

  for (const employee of employeeRows) {
    const node = nodeMap.get(employee.department_id);
    if (node) {
      node.employees.push(toMinimalEmployee(employee));
    }
  }

  const roots = [];

  for (const node of orderedNodes) {
    node.employees.sort((a, b) => {
      const last = a.last_name.localeCompare(b.last_name);
      return last !== 0 ? last : a.first_name.localeCompare(b.first_name);
    });
    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const traverse = (current, ancestors = []) => {
    current.depth = ancestors.length;
    current.path = [...ancestors.map((item) => item.id), current.id];
    current.path_names = [...ancestors.map((item) => item.name), current.name];
    current.children.sort((a, b) => a.name.localeCompare(b.name));
    current.children.forEach((child) =>
      traverse(child, [...ancestors, current]),
    );
  };

  roots.sort((a, b) => a.name.localeCompare(b.name));
  roots.forEach((root) => traverse(root, []));

  return roots;
}

async function assertHierarchyIntegrity(client, departmentId, parentId) {
  if (!parentId) {
    return;
  }
  if (departmentId === parentId) {
    throw createHttpError(400, "Bo'lim o'zini ota qilib bo'lmaydi");
  }
  const { rowCount } = await client.query(
    `WITH RECURSIVE ancestors AS (
       SELECT id, parent_id FROM departments WHERE id = $1
       UNION ALL
       SELECT d.id, d.parent_id
       FROM departments d
       JOIN ancestors a ON d.id = a.parent_id
     )
     SELECT 1 FROM ancestors WHERE id = $2 LIMIT 1;`,
    [parentId, departmentId],
  );
  if (rowCount > 0) {
    throw createHttpError(
      400,
      "Bo'limni o'z avlodlariga bog'lab bo'lmaydi",
    );
  }
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
    const { query, department, department_id, position, employment_status } =
      req.query;
    const search = typeof query === "string" ? query.trim() : "";
    const departmentFilter =
      typeof department === "string" ? department : undefined;
    const departmentIdFilter =
      typeof department_id === "string" ? department_id : undefined;
    const positionFilter = typeof position === "string" ? position : undefined;
    const statusFilter =
      typeof employment_status === "string" ? employment_status : undefined;

    const clauses = [];
    const values = [];
    let idx = 1;

    if (search) {
      clauses.push(
        `(e.first_name ILIKE $${idx} OR e.last_name ILIKE $${idx} OR e.email ILIKE $${idx} OR e.employee_id ILIKE $${idx})`,
      );
      values.push(`%${search}%`);
      idx += 1;
    }

    if (departmentIdFilter) {
      clauses.push(`e.department_id = $${idx}`);
      values.push(departmentIdFilter);
      idx += 1;
    } else if (departmentFilter && departmentFilter !== "all") {
      clauses.push(`e.department = $${idx}`);
      values.push(departmentFilter);
      idx += 1;
    }

    if (positionFilter && positionFilter !== "all") {
      clauses.push(`e.position = $${idx}`);
      values.push(positionFilter);
      idx += 1;
    }

    if (statusFilter && statusFilter !== "all") {
      clauses.push(`e.employment_status = $${idx}`);
      values.push(statusFilter);
      idx += 1;
    }

    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const result = await client.query(
      `SELECT e.*, d.name AS department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       ${where}
       ORDER BY e.created_at DESC`,
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
      `SELECT e.*, d.name AS department_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = $1
       LIMIT 1`,
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

    await syncDepartmentAssociation(client, payload);
    await ensureDepartmentAssignment(client, payload);

    if (!("skills" in payload)) {
      payload.skills = [];
    }
    payload.employee_id = await getNextEmployeeId(client);
    const statement = buildInsertStatement(payload);
    const result = await client.query(statement.text, statement.values);
    res.status(201).json(mapEmployee(result.rows[0]));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
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

    await syncDepartmentAssociation(client, payload);
    if (
      Object.prototype.hasOwnProperty.call(payload, "department") ||
      Object.prototype.hasOwnProperty.call(payload, "department_id")
    ) {
      await ensureDepartmentAssignment(client, payload);
    }

    const statement = buildUpdateStatement(payload, req.params.id);
    const result = await client.query(statement.text, statement.values);
    if (result.rowCount === 0) {
      res.status(404).json({ error: "Xodim topilmadi" });
      return;
    }
    res.json(mapEmployee(result.rows[0]));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
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


﻿// ==================== DEPARTMENT ENDPOINTS ====================

app.get("/departments", async (req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(`
      SELECT
        d.*,
        COUNT(e.id) AS member_count
      FROM departments d
      LEFT JOIN employees e ON e.department_id = d.id
      GROUP BY d.id
      ORDER BY d.name;
    `);
    res.json(rows.map(mapDepartment));
  } catch (error) {
    console.error("[server] Bo'limlarni olishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Bo'limlarni olishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.get("/departments/tree", async (req, res) => {
  const client = await pool.connect();
  try {
    const tree = await buildDepartmentTree(client);
    res.json(tree);
  } catch (error) {
    console.error("[server] Bo'limlar daraxtini olishda xatolik yuz berdi", error);
    res
      .status(500)
      .json({ error: "Bo'limlar daraxtini olishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.post("/departments", async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, description, parent_id, head_id } = req.body ?? {};
    const normalizedName = typeof name === "string" ? name.trim() : "";
    if (!normalizedName) {
      res.status(400).json({ error: "Bo'lim nomi kiritilishi shart" });
      return;
    }

    let parentId = null;
    if (parent_id) {
      const parent = await fetchDepartmentById(client, parent_id);
      parentId = parent.id;
    }

    let headId = null;
    if (head_id) {
      const headResult = await client.query(
        "SELECT id FROM employees WHERE id = $1 LIMIT 1",
        [head_id],
      );
      if (headResult.rowCount === 0) {
        res.status(400).json({ error: "Ko'rsatilgan rahbar topilmadi" });
        return;
      }
      headId = headResult.rows[0].id;
    }

    const result = await client.query(
      `INSERT INTO departments (name, description, parent_id, head_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        normalizedName,
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
        parentId,
        headId,
      ],
    );
    res.status(201).json(mapDepartment(result.rows[0]));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("[server] Bo'limni yaratishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Bo'limni yaratishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.put("/departments/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const departmentId = req.params.id;
    await fetchDepartmentById(client, departmentId);
    const { name, description, parent_id, head_id } = req.body ?? {};

    const updates = [];
    const values = [];
    let idx = 1;

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (!trimmedName) {
        res.status(400).json({ error: "Bo'lim nomi bo'sh bo'lishi mumkin emas" });
        return;
      }
      updates.push(`name = $${idx}`);
      values.push(trimmedName);
      idx += 1;
    }

    if (description !== undefined) {
      const trimmedDescription =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;
      updates.push(`description = $${idx}`);
      values.push(trimmedDescription);
      idx += 1;
    }

    if (parent_id !== undefined) {
      let parentId = null;
      if (parent_id) {
        const parent = await fetchDepartmentById(client, parent_id);
        await assertHierarchyIntegrity(client, departmentId, parent.id);
        parentId = parent.id;
      }
      updates.push(`parent_id = $${idx}`);
      values.push(parentId);
      idx += 1;
    }

    if (head_id !== undefined) {
      let headId = null;
      if (head_id) {
        const headResult = await client.query(
          "SELECT id FROM employees WHERE id = $1 LIMIT 1",
          [head_id],
        );
        if (headResult.rowCount === 0) {
          res.status(400).json({ error: "Ko'rsatilgan rahbar topilmadi" });
          return;
        }
        headId = headResult.rows[0].id;
      }
      updates.push(`head_id = $${idx}`);
      values.push(headId);
      idx += 1;
    }

    if (updates.length === 0) {
      res.status(400).json({ error: "Yangilash uchun maydonlar kiritilmagan" });
      return;
    }

    values.push(departmentId);
    const result = await client.query(
      `UPDATE departments
       SET ${updates.join(", ")}, updated_at = now()
       WHERE id = $${idx} RETURNING *`,
      values,
    );
    res.json(mapDepartment(result.rows[0]));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("[server] Bo'limni yangilashda xatolik yuz berdi", error);
    res.status(500).json({ error: "Bo'limni yangilashda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.delete("/departments/:id", async (req, res) => {
  const client = await pool.connect();
  try {
    const department = await fetchDepartmentById(client, req.params.id);
    if (department.name.toLowerCase() === UNASSIGNED_DEPARTMENT_NAME.toLowerCase()) {
      res.status(400).json({ error: "'Unassigned' bo'limi o'chirilmaydi" });
      return;
    }

    const childCheck = await client.query(
      "SELECT 1 FROM departments WHERE parent_id = $1 LIMIT 1",
      [department.id],
    );
    if (childCheck.rowCount > 0) {
      res.status(400).json({ error: "Avval avlod bo'limlarini olib tashlang" });
      return;
    }

    const memberCheck = await client.query(
      "SELECT 1 FROM employees WHERE department_id = $1 LIMIT 1",
      [department.id],
    );
    if (memberCheck.rowCount > 0) {
      res.status(400).json({ error: "Avval xodimlarni boshqa bo'limga o'tkazing" });
      return;
    }

    await client.query("DELETE FROM departments WHERE id = $1", [department.id]);
    res.status(204).end();
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("[server] Bo'limni o'chirishda xatolik yuz berdi", error);
    res.status(500).json({ error: "Bo'limni o'chirishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.post("/departments/:id/employees", async (req, res) => {
  const client = await pool.connect();
  try {
    const department = await fetchDepartmentById(client, req.params.id);
    const { employeeIds, employeeId } = req.body ?? {};
    let ids = Array.isArray(employeeIds) ? employeeIds : [];
    if (employeeId) {
      ids = ids.concat(employeeId);
    }
    const uniqueIds = [...new Set(ids.map((value) => String(value).trim()))].filter(
      Boolean,
    );
    if (uniqueIds.length === 0) {
      res.status(400).json({ error: "Xodim identifikatorlari kiritilmadi" });
      return;
    }

    const { rows } = await client.query(
      `UPDATE employees
       SET department_id = $1, department = $2, updated_at = now()
       WHERE id = ANY($3::uuid[])
       RETURNING *`,
      [department.id, department.name, uniqueIds],
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "Ko'rsatilgan xodimlar topilmadi" });
      return;
    }
    res.json({ department: mapDepartment(department), employees: rows.map(mapEmployee) });
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("[server] Xodimni bo'limga biriktirishda xatolik yuz berdi", error);
    res
      .status(500)
      .json({ error: "Xodimni bo'limga biriktirishda xatolik yuz berdi" });
  } finally {
    client.release();
  }
});

app.delete("/departments/:id/employees/:employeeId", async (req, res) => {
  const client = await pool.connect();
  try {
    const department = await fetchDepartmentById(client, req.params.id);
    const fallback = await ensureDepartmentByName(
      client,
      UNASSIGNED_DEPARTMENT_NAME,
      "Default holding department for employees awaiting assignment",
    );

    const result = await client.query(
      `UPDATE employees
       SET department_id = $1, department = $2, updated_at = now()
       WHERE id = $3 AND department_id = $4
       RETURNING *`,
      [fallback.id, fallback.name, req.params.employeeId, department.id],
    );
    if (result.rowCount === 0) {
      res
        .status(404)
        .json({ error: "Xodim topilmadi yoki ushbu bo'limga biriktirilmagan" });
      return;
    }
    res.json(mapEmployee(result.rows[0]));
  } catch (error) {
    if (error.statusCode) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }
    console.error("[server] Xodimni bo'limdan ajratishda xatolik yuz berdi", error);
    res
      .status(500)
      .json({ error: "Xodimni bo'limdan ajratishda xatolik yuz berdi" });
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
