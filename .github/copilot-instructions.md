# Employee CRUD Application - AI Agent Instructions

## Architecture Overview

This is a **full-stack Employee Management System** with a React/TypeScript frontend (Vite) and an Express.js backend (Node.js) connected to PostgreSQL.

**Stack**: React 18 + TypeScript + Vite + TailwindCSS (dark mode) + Express.js + PostgreSQL + Framer Motion

**Key Pattern**: The app uses a **single concurrent dev command** (`npm run dev`) that runs both client (port 4183) and server (port 4000) using `concurrently`.

### Project Structure

```
src/                    # React frontend
├── components/         # UI components (all functional, hook-based)
├── hooks/             # Custom React hooks (useEmployees, useDatabaseStatus)
├── context/           # React Context (ThemeContext for dark/light mode)
├── lib/               # API client (api.ts) with centralized fetch logic
└── types/             # TypeScript interfaces (employee.ts)

server/                # Express.js backend
└── index.js           # Single-file server with all REST endpoints

database/migrations/   # PostgreSQL schema migrations
```

## Critical Developer Workflows

### Running the Application

- **Development**: `npm run dev` - Runs BOTH client and server concurrently
- **Client only**: `npm run dev:client` (Vite on port 4183)
- **Server only**: `npm run dev:server` (Express on port 4000)
- **Build**: `npm run build` (Vite production build)
- **Type check**: `npm run typecheck` (TSC validation without emit)

### Environment Configuration

The app requires a `.env` file at the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/employee_crud
SERVER_PORT=4000
DISABLE_RLS=true                        # Disables PostgreSQL Row-Level Security
VITE_API_BASE_URL=http://localhost:4000 # Optional: frontend API endpoint
```

**Important**: `DISABLE_RLS=true` is used for local development to bypass RLS policies. The server automatically drops RLS and policies at startup when this flag is enabled (see `disableSecurityFeatures()` in `server/index.js`).

### Database Setup

1. Create PostgreSQL database: `employee_crud`
2. Run migration: `psql -U user -d employee_crud -f database/migrations/20250929042848_lingering_glitter.sql`
3. The migration includes sample data (5 employees) for testing

## Project-Specific Conventions

### API Client Pattern (`src/lib/api.ts`)

The API client uses a **centralized `request()` wrapper** that handles:
- Dynamic API URL resolution (checks `VITE_API_BASE_URL` → falls back to `window.location.origin` with port 4000)
- JSON serialization/deserialization
- HTTP 204 (No Content) handling
- Error message extraction from response payloads

**Example**:
```typescript
const response = await request<Employee>('/employees', { 
  method: 'POST', 
  body: payload 
});
```

### State Management Pattern

**No Redux/Zustand** - State is managed via:
1. **Custom hooks** (`useEmployees.ts`) - Encapsulates all employee CRUD operations and state
2. **React Context** (`ThemeContext.tsx`) - Theme toggle (dark/light mode with localStorage persistence)
3. **Local component state** (`useState`) - Form data, modal visibility, UI state

### Backend Data Handling

The server (`server/index.js`) has **strict data sanitization**:

- **`sanitizeEmployeePayload()`**: Whitelist-based field filtering (only `EMPLOYEE_FIELDS` are accepted)
- **`normalizeValue()`**: Type coercion and null handling (empty strings → null for optional fields, arrays for `skills`)
- **`mapEmployee()`**: Database row → API response transformation (converts nulls to undefined, ensures `skills` is array)
- **Auto-generated `employee_id`**: The `POST /employees` endpoint auto-assigns sequential numeric IDs via `getNextEmployeeId()`

**Critical**: Never send `employee_id` in POST requests - it's auto-generated. For PUT requests, the ID is immutable.

### Form Validation Pattern

Forms use **uncontrolled validation** (see `EmployeeForm.tsx`):
- No inline validation during typing
- Validation runs on submit via `validateForm()`
- Error state stored in `errors` object keyed by field name
- Required fields: `first_name`, `last_name`, `email`, `hire_date`, `position`, `department`, `employment_status`

### Image Upload

The app supports profile images via a **separate upload endpoint**:
1. POST multipart form data to `/upload` (handled by Multer middleware)
2. Server returns `{ filePath: '/uploads/filename.ext' }`
3. Store `filePath` in `profile_image_url` field
4. Static files served at `http://localhost:4000/uploads/`

**Constraints**: Max 3MB, accepts JPEG/PNG/WEBP only (enforced in frontend)

### Authentication/Security

The app has a **simple admin unlock modal** (`AdminUnlockModal.tsx`):
- Default password: `admin123` (stored in `localStorage.adminPassword`)
- No JWT/session management - just a client-side gate
- **Not production-ready** - This is a demo/prototype security layer

### Dark Mode Implementation

Theme is handled via:
1. `ThemeContext` provides `theme`, `toggleTheme()`, `setTheme()`
2. Theme stored in `localStorage` (key: `theme`)
3. Defaults to system preference or `dark`
4. CSS classes applied to `<html>` and `<body>` elements
5. TailwindCSS `dark:` variant classes used throughout

**Example component pattern**:
```tsx
<div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white">
```

### TypeScript Types

All employee data flows through `src/types/employee.ts`:
- `Employee` - Full entity with metadata (`id`, `created_at`, `updated_at`)
- `EmployeeFormData` - Subset for create/update operations (excludes metadata)
- `SearchFilters` - Query parameters for GET `/employees`
- `Experience` - Work experience record (company, position, dates, description)
- `Education` - Education record (institution, degree, field_of_study, dates, description)

**Key distinction**: `Employee` includes system fields, `EmployeeFormData` is user-editable only.

### Multi-Record Pattern (Experiences & Education)

Employees can have **multiple work experiences and education records**:

**Database Structure**:
- `employee_experiences` table with foreign key to `employees(id)`
- `employee_education` table with foreign key to `employees(id)`
- CASCADE DELETE ensures related records are removed when employee is deleted

**API Pattern**:
- Nested endpoints: `/employees/:id/experiences`, `/employees/:id/education`
- Full CRUD operations available for both experiences and education
- GET `/employees/:id` automatically includes `experiences[]` and `education[]` arrays

**Form UI Pattern** (`EmployeeForm.tsx`):
- Uses local state arrays (`newExperience`, `newEducation`) for building new entries
- Add button validates required fields (company/position/start_date for experience, institution/degree/start_date for education)
- Displays existing records with remove buttons
- Color-coded: blue backgrounds for experience, green for education

### Component Patterns

- All components are **functional with hooks** (no class components)
- **Framer Motion** used for animations (modal overlays, list transitions)
- **Lucide React** for all icons (no other icon libraries)
- Components are **modals-in-place** (rendered conditionally in `App.tsx`, not via router)

### View-Based Navigation

The app uses **client-side view switching** (no React Router):
- Views: `dashboard`, `employees`, `search`, `settings`, `add`
- Managed via `currentView` state in `App.tsx`
- Layout component (`Layout.tsx`) handles sidebar navigation

## Error Messages and Localization

**Important**: All user-facing error messages and UI text are in **Uzbek** (Latin script):
- "Xatolik yuz berdi" (Error occurred)
- "Xodimni qo'shishda xatolik" (Error adding employee)
- "Xodim topilmadi" (Employee not found)

When adding new features, maintain this localization pattern.

## Common Pitfalls

1. **Port conflicts**: Ensure ports 4000 (server) and 4183 (client) are available
2. **Database connection**: `DATABASE_URL` must be set before starting server (server exits with error if missing)
3. **Skills array handling**: Always initialize `skills` as empty array `[]`, never null/undefined
4. **Salary field**: Can be null/undefined - backend converts empty strings to null
5. **CORS**: Server uses `cors({ origin: "*" })` - adjust for production
6. **File uploads**: Uploads directory (`server/uploads/`) must exist or Multer will fail

## Health Check Endpoint

`GET /health` returns database connection status:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2025-10-06T..."
}
```

Use this endpoint to debug connection issues before making other API calls.
