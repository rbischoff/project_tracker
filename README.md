# 🏠 Home Improvement Tracker

A full-stack web application to plan and track home improvement projects with priorities, costs, materials, and progress.

## Tech Stack

- **Backend**: FastAPI + SQLite
- **Frontend**: React + Vite
- **Styling**: Pure CSS with DM Sans/Serif fonts

## Features

- **Dashboard** – Overview of urgent items, in-progress projects, and summary stats
- **Projects** – Grid/list view with filtering by status, priority, and category
- **Project Detail** – Full edit mode with progress slider, material checklist, cost tracking
- **Analytics** – Donut charts, category breakdowns, budget variance
- **Materials** – Track items needed, quantity, cost, and purchased status
- **Progress Tracking** – Visual progress bars; auto-complete at 100%

## Quick Start

### Option 1: One-command startup
```bash
chmod +x start.sh
./start.sh
```

### Option 2: Manual

**Backend** (Python 3.8+):
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Frontend** (Node 16+):
```bash
cd frontend
npm install
npm run dev
```

Then open: http://localhost:5173

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /projects | List all projects (filterable) |
| GET | /projects/{id} | Get single project |
| POST | /projects | Create project |
| PUT | /projects/{id} | Update project |
| DELETE | /projects/{id} | Delete project |
| GET | /stats | Aggregate statistics |

Interactive API docs: http://localhost:8000/docs

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

SQLite database (`backend/projects.db`) is auto-created on first run. No configuration needed.
