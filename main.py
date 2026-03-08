from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import json
from datetime import datetime

app = FastAPI(title="Home Improvement Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "projects.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            priority TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'planned',
            estimated_cost REAL DEFAULT 0,
            actual_cost REAL DEFAULT 0,
            progress INTEGER DEFAULT 0,
            materials TEXT DEFAULT '[]',
            category TEXT DEFAULT 'general',
            start_date TEXT,
            target_date TEXT,
            completed_date TEXT,
            notes TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

init_db()

class MaterialItem(BaseModel):
    name: str
    quantity: str
    cost: float = 0
    purchased: bool = False

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    priority: str = "medium"
    status: str = "planned"
    estimated_cost: float = 0
    actual_cost: float = 0
    progress: int = 0
    materials: List[MaterialItem] = []
    category: str = "general"
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    notes: Optional[str] = ""

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    progress: Optional[int] = None
    materials: Optional[List[MaterialItem]] = None
    category: Optional[str] = None
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    completed_date: Optional[str] = None
    notes: Optional[str] = None

def row_to_dict(row):
    d = dict(row)
    d['materials'] = json.loads(d['materials']) if d['materials'] else []
    return d

@app.get("/projects", response_model=List[dict])
def get_projects(status: Optional[str] = None, priority: Optional[str] = None, category: Optional[str] = None):
    conn = get_db()
    query = "SELECT * FROM projects WHERE 1=1"
    params = []
    if status:
        query += " AND status = ?"
        params.append(status)
    if priority:
        query += " AND priority = ?"
        params.append(priority)
    if category:
        query += " AND category = ?"
        params.append(category)
    query += " ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END, created_at DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]

@app.get("/projects/{project_id}")
def get_project(project_id: int):
    conn = get_db()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    return row_to_dict(row)

@app.post("/projects", response_model=dict)
def create_project(project: ProjectCreate):
    now = datetime.now().isoformat()
    conn = get_db()
    cursor = conn.execute("""
        INSERT INTO projects (name, description, priority, status, estimated_cost, actual_cost,
            progress, materials, category, start_date, target_date, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        project.name, project.description, project.priority, project.status,
        project.estimated_cost, project.actual_cost, project.progress,
        json.dumps([m.dict() for m in project.materials]),
        project.category, project.start_date, project.target_date,
        project.notes, now, now
    ))
    conn.commit()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return row_to_dict(row)

@app.put("/projects/{project_id}", response_model=dict)
def update_project(project_id: int, project: ProjectUpdate):
    conn = get_db()
    existing = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")
    
    updates = {k: v for k, v in project.dict().items() if v is not None}
    if 'materials' in updates:
        updates['materials'] = json.dumps([m if isinstance(m, dict) else m.dict() for m in updates['materials']])
    
    if project.progress == 100 and project.status != 'completed':
        updates['status'] = 'completed'
        updates['completed_date'] = datetime.now().isoformat()
    
    updates['updated_at'] = datetime.now().isoformat()
    
    set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
    values = list(updates.values()) + [project_id]
    conn.execute(f"UPDATE projects SET {set_clause} WHERE id = ?", values)
    conn.commit()
    row = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    conn.close()
    return row_to_dict(row)

@app.delete("/projects/{project_id}")
def delete_project(project_id: int):
    conn = get_db()
    existing = conn.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Project not found")
    conn.execute("DELETE FROM projects WHERE id = ?", (project_id,))
    conn.commit()
    conn.close()
    return {"message": "Project deleted"}

@app.get("/stats")
def get_stats():
    conn = get_db()
    rows = conn.execute("SELECT * FROM projects").fetchall()
    conn.close()
    projects = [row_to_dict(r) for r in rows]
    
    total = len(projects)
    by_status = {}
    by_priority = {}
    total_estimated = sum(p['estimated_cost'] for p in projects)
    total_actual = sum(p['actual_cost'] for p in projects)
    
    for p in projects:
        by_status[p['status']] = by_status.get(p['status'], 0) + 1
        by_priority[p['priority']] = by_priority.get(p['priority'], 0) + 1
    
    avg_progress = sum(p['progress'] for p in projects) / total if total > 0 else 0
    
    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "total_estimated_cost": total_estimated,
        "total_actual_cost": total_actual,
        "average_progress": round(avg_progress, 1)
    }
