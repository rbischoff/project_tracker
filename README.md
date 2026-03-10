# 🏠 Home Improvement Tracker

A full-stack web application to plan and track home improvement projects with priorities, costs, materials, and progress.

## Tech Stack

- **Backend**: FastAPI + SQLAlchemy ORM + PostgreSQL
- **Frontend**: React + Vite
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose
- **Styling**: Pure CSS with DM Sans/Serif fonts

## Features

- **Dashboard** – Overview of urgent items, in-progress projects, and summary stats
- **Projects** – Grid/list view with filtering by status, priority, and category
- **Project Detail** – Full edit mode with progress slider, material checklist, cost tracking
- **Analytics** – Donut charts, category breakdowns, budget variance
- **Materials** – Track items needed, quantity, cost, and purchased status
- **Progress Tracking** – Visual progress bars; auto-complete at 100%

## Backend Architecture

The backend uses **SQLAlchemy ORM** for all database operations, providing:
- Type-safe database queries with IDE autocomplete
- Automatic SQL injection protection
- Relationship management between models (User → Projects, Projects → Sessions, etc.)
- Clean, maintainable code without raw SQL strings
- Ready for future migrations with Alembic

**Core Models:**
- `User` – Authentication and role-based access (admin/user)
- `Session` – Token-based session management
- `Project` – Home improvement projects with full details
- `Config` – Dynamic configuration (priorities, statuses, categories)

## Security Features

- **Password Hashing**: Bcrypt with configurable work factor (replaces weak SHA256)
- **HttpOnly Cookies**: Secure token storage immune to XSS attacks
- **Authorization Headers**: Fallback support for API clients without cookies
- **Input Validation**: Pydantic field constraints on all project operations
  - Progress: Must be 0-100
  - Costs: Must be non-negative
- **Role-Based Access**: Admin-only endpoints properly protected
- **Unique Constraints**: Database-level uniqueness enforced on config items
- **Type Hints**: Full Python type annotations for better IDE support and maintainability

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Copy environment variables
cp .env.example .env

# Start services
docker-compose up -d

# App is ready at http://localhost:5173
```

### Option 2: Manual Development Setup

**Backend** (Python 3.11+):
```bash
cd backend
pip install -r requirements.txt
export POSTGRES_HOST=localhost
export POSTGRES_DB=project_tracker
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
uvicorn main:app --reload --port 8000
```

**Frontend** (Node 18+):
```bash
cd frontend
npm install
npm run dev
```

Then open: http://localhost:5173

## Environment Variables

Configure database and frontend API via environment variables:

**Backend (Database):**
```env
POSTGRES_HOST=postgres         # Database host
POSTGRES_PORT=5432             # Database port
POSTGRES_DB=project_tracker    # Database name
POSTGRES_USER=postgres         # Database user
POSTGRES_PASSWORD=postgres     # Database password
```

**Frontend (API Configuration):**
```env
VITE_API_URL=http://backend:8000   # Backend API URL (use service name in Docker)
```

In development on localhost, `VITE_API_URL` defaults to `/api` (proxy), which works automatically.

## API Endpoints

**Authentication:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Login with username/email and password |
| POST | /auth/logout | Logout (requires valid token) |
| GET | /auth/me | Get current user info |

**Projects:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /projects | List all projects (filterable by status, priority, category) |
| GET | /projects/{id} | Get single project |
| POST | /projects | Create project |
| PUT | /projects/{id} | Update project |
| DELETE | /projects/{id} | Delete project |

**Stats & Config:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /config | Get active config (priorities, statuses, categories) |
| GET | /stats | Aggregate statistics for dashboard |
| GET | /admin/config | Get all config (admin only) |
| POST | /admin/config | Create config item (admin only) |
| PUT | /admin/config/{id} | Update config (admin only) |
| DELETE | /admin/config/{id} | Delete config (admin only) |

**User Management (Admin):**
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/users | List all users |
| POST | /admin/users | Create user |
| PUT | /admin/users/{id} | Update user |
| DELETE | /admin/users/{id} | Delete user |

Interactive API docs: http://localhost:8001/docs

## Project Fields

- **Name, Description, Notes**
- **Priority**: Critical / High / Medium / Low
- **Status**: Planned / In Progress / On Hold / Completed
- **Category**: Kitchen, Bathroom, Outdoor, Electrical, etc.
- **Estimated & Actual Cost**
- **Progress** (0–100%)
- **Materials**: Name, Quantity, Cost, Purchased checkbox
- **Start Date, Target Date**

## Database

PostgreSQL database is created automatically on first run. Tables and default configuration data are initialized via the backend's `init_db()` function on startup.

**ORM Models** (defined in `backend/models.py`):
- All database operations use SQLAlchemy ORM instead of raw SQL
- Models define relationships automatically (User ↔ Projects, Sessions, etc.)
- Type-safe queries with proper foreign key constraints
- Built-in protection against SQL injection
- Unique constraints enforced on config items

**Authentication & Security:**
- Passwords hashed with bcrypt (industry standard)
- Table-level unique constraints prevent duplicate configurations
- Sessions automatically expire after 24 hours
- User accounts can be disabled without deletion

**Default Credentials** (created automatically on first run):
   - **Admin**: `admin@home.local` / `admin123`
   - **User**: `user@home.local` / `user123`

## Input Validation

All project data is validated server-side using Pydantic:

- **Progress**: 0-100% (prevents invalid progress values)
- **Costs**: Non-negative (prevents negative estimated/actual costs)
- **Fields**: Required fields enforced, optional fields have sensible defaults
- **Error Responses**: Clear validation error messages returned to client

Example error response:
```json
{
  "detail": [{
    "type": "less_than_equal",
    "loc": ["body", "progress"],
    "msg": "Input should be less than or equal to 100",
    "input": 150
  }]
}
```

## Recent Improvements (v2.0)

- ✅ **Bcrypt Password Hashing** – Replaced SHA256 with industry-standard bcrypt
- ✅ **HttpOnly Cookies** – Tokens stored securely, immune to XSS attacks
- ✅ **Input Validation** – Pydantic constraints on all numeric fields
- ✅ **Type Hints** – Python type annotations for better IDE support
- ✅ **Unique Constraints** – Database-level enforcement on config items
- ✅ **Docker API URL** – Proper service discovery for containerized deployments
- ✅ **Logout Validation** – Token verification before session deletion
