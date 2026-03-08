from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import json
import hashlib
import secrets
import re
from datetime import datetime, timedelta

app = FastAPI(title="Home Improvement Tracker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "projects.db"
security = HTTPBearer()

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.execute("""CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        last_login TEXT
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        key TEXT NOT NULL,
        label TEXT NOT NULL,
        color TEXT,
        bg_color TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        UNIQUE(type, key)
    )""")
    conn.execute("""CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
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
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )""")

    if conn.execute("SELECT COUNT(*) FROM config").fetchone()[0] == 0:
        defaults = [
            ('priority','critical','Critical','#B84040','#FDEAEA',1),
            ('priority','high','High','#8B5A1A','#FBF0DC',2),
            ('priority','medium','Medium','#2B5278','#E8F0F8',3),
            ('priority','low','Low','#3A6B4E','#E8F4ED',4),
            ('status','planned','Planned','#5A5A5A','#F0EDEA',1),
            ('status','in_progress','In Progress','#2B5278','#E8F0F8',2),
            ('status','on_hold','On Hold','#8B5A1A','#FBF0DC',3),
            ('status','completed','Completed','#3A6B4E','#E8F4ED',4),
            ('category','kitchen','Kitchen',None,None,1),
            ('category','bathroom','Bathroom',None,None,2),
            ('category','bedroom','Bedroom',None,None,3),
            ('category','living_room','Living Room',None,None,4),
            ('category','outdoor','Outdoor',None,None,5),
            ('category','basement','Basement',None,None,6),
            ('category','garage','Garage',None,None,7),
            ('category','roof','Roof',None,None,8),
            ('category','plumbing','Plumbing',None,None,9),
            ('category','electrical','Electrical',None,None,10),
            ('category','flooring','Flooring',None,None,11),
            ('category','painting','Painting',None,None,12),
            ('category','general','General',None,None,13),
        ]
        conn.executemany("INSERT INTO config (type,key,label,color,bg_color,sort_order) VALUES (?,?,?,?,?,?)", defaults)

    if conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0:
        now = datetime.now().isoformat()
        conn.execute("INSERT INTO users (username,email,password_hash,role,created_at) VALUES (?,?,?,?,?)",
            ("admin","admin@home.local",hashlib.sha256(b"admin123").hexdigest(),"admin",now))
        conn.execute("INSERT INTO users (username,email,password_hash,role,created_at) VALUES (?,?,?,?,?)",
            ("user","user@home.local",hashlib.sha256(b"user123").hexdigest(),"user",now))

    conn.commit()
    conn.close()

def hash_password(p): return hashlib.sha256(p.encode()).hexdigest()

def create_session(user_id):
    token = secrets.token_urlsafe(32)
    expires = (datetime.now() + timedelta(hours=24)).isoformat()
    conn = get_db()
    conn.execute("INSERT INTO sessions (token,user_id,expires_at) VALUES (?,?,?)",(token,user_id,expires))
    conn.commit(); conn.close()
    return token

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    conn = get_db()
    row = conn.execute(
        "SELECT s.user_id,s.expires_at,u.id,u.username,u.email,u.role,u.is_active "
        "FROM sessions s JOIN users u ON s.user_id=u.id WHERE s.token=?",(token,)
    ).fetchone()
    conn.close()
    if not row: raise HTTPException(401, "Invalid session")
    if datetime.fromisoformat(row["expires_at"]) < datetime.now(): raise HTTPException(401,"Session expired")
    if not row["is_active"]: raise HTTPException(403,"Account disabled")
    return dict(row)

def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin": raise HTTPException(403,"Admin access required")
    return user

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str

@app.post("/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    user = conn.execute(
        "SELECT * FROM users WHERE (username=? OR email=?) AND is_active=1",
        (req.username, req.username)
    ).fetchone()
    if not user or user["password_hash"] != hash_password(req.password):
        conn.close(); raise HTTPException(401,"Invalid username or password")
    conn.execute("UPDATE users SET last_login=? WHERE id=?",(datetime.now().isoformat(),user["id"]))
    conn.commit(); conn.close()
    token = create_session(user["id"])
    return {"token":token,"user":{"id":user["id"],"username":user["username"],"email":user["email"],"role":user["role"]}}

@app.post("/auth/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    conn = get_db()
    conn.execute("DELETE FROM sessions WHERE token=?",(credentials.credentials,))
    conn.commit(); conn.close()
    return {"message":"Logged out"}

@app.get("/auth/me")
def me(user=Depends(get_current_user)):
    return {"id":user["id"],"username":user["username"],"email":user["email"],"role":user["role"]}

# Config
@app.get("/config")
def get_config(user=Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM config WHERE is_active=1 ORDER BY type,sort_order").fetchall()
    conn.close()
    result = {"priorities":[],"statuses":[],"categories":[]}
    for r in rows:
        d = dict(r)
        if d["type"]=="priority": result["priorities"].append(d)
        elif d["type"]=="status": result["statuses"].append(d)
        elif d["type"]=="category": result["categories"].append(d)
    return result

@app.get("/admin/config")
def get_all_config(user=Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT * FROM config ORDER BY type,sort_order").fetchall()
    conn.close()
    return [dict(r) for r in rows]

class ConfigItem(BaseModel):
    type: str
    key: str
    label: str
    color: Optional[str] = None
    bg_color: Optional[str] = None
    sort_order: int = 0

class ConfigUpdate(BaseModel):
    label: Optional[str] = None
    color: Optional[str] = None
    bg_color: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[int] = None

@app.post("/admin/config")
def create_config(item: ConfigItem, user=Depends(require_admin)):
    key = re.sub(r'[^a-z0-9_]','_',item.key.lower().strip())
    conn = get_db()
    try:
        conn.execute("INSERT INTO config (type,key,label,color,bg_color,sort_order) VALUES (?,?,?,?,?,?)",
            (item.type,key,item.label,item.color,item.bg_color,item.sort_order))
        conn.commit()
        row = conn.execute("SELECT * FROM config WHERE type=? AND key=?",(item.type,key)).fetchone()
        conn.close(); return dict(row)
    except sqlite3.IntegrityError:
        conn.close(); raise HTTPException(400,f"Key '{key}' already exists for type '{item.type}'")

@app.put("/admin/config/{config_id}")
def update_config(config_id: int, item: ConfigUpdate, user=Depends(require_admin)):
    conn = get_db()
    existing = conn.execute("SELECT * FROM config WHERE id=?",(config_id,)).fetchone()
    if not existing: conn.close(); raise HTTPException(404,"Not found")
    updates = {k:v for k,v in item.dict().items() if v is not None}
    if not updates: conn.close(); return dict(existing)
    set_clause = ", ".join([f"{k}=?" for k in updates])
    conn.execute(f"UPDATE config SET {set_clause} WHERE id=?",list(updates.values())+[config_id])
    conn.commit()
    row = conn.execute("SELECT * FROM config WHERE id=?",(config_id,)).fetchone()
    conn.close(); return dict(row)

@app.delete("/admin/config/{config_id}")
def delete_config(config_id: int, user=Depends(require_admin)):
    conn = get_db()
    conn.execute("DELETE FROM config WHERE id=?",(config_id,))
    conn.commit(); conn.close()
    return {"message":"Deleted"}

# Users
class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str = "user"

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[int] = None
    password: Optional[str] = None

@app.get("/admin/users")
def get_users(user=Depends(require_admin)):
    conn = get_db()
    rows = conn.execute("SELECT id,username,email,role,is_active,created_at,last_login FROM users ORDER BY created_at DESC").fetchall()
    conn.close(); return [dict(r) for r in rows]

@app.post("/admin/users")
def create_user(req: UserCreate, user=Depends(require_admin)):
    conn = get_db()
    try:
        now = datetime.now().isoformat()
        cur = conn.execute("INSERT INTO users (username,email,password_hash,role,created_at) VALUES (?,?,?,?,?)",
            (req.username,req.email,hash_password(req.password),req.role,now))
        conn.commit()
        row = conn.execute("SELECT id,username,email,role,is_active,created_at FROM users WHERE id=?",(cur.lastrowid,)).fetchone()
        conn.close(); return dict(row)
    except sqlite3.IntegrityError:
        conn.close(); raise HTTPException(400,"Username or email already exists")

@app.put("/admin/users/{user_id}")
def update_user(user_id: int, req: UserUpdate, user=Depends(require_admin)):
    conn = get_db()
    updates = {k:v for k,v in req.dict().items() if v is not None}
    if 'password' in updates: updates['password_hash'] = hash_password(updates.pop('password'))
    if not updates: conn.close(); raise HTTPException(400,"No updates")
    set_clause = ", ".join([f"{k}=?" for k in updates])
    conn.execute(f"UPDATE users SET {set_clause} WHERE id=?",list(updates.values())+[user_id])
    conn.commit()
    row = conn.execute("SELECT id,username,email,role,is_active,created_at,last_login FROM users WHERE id=?",(user_id,)).fetchone()
    conn.close(); return dict(row)

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, current_user=Depends(require_admin)):
    if user_id == current_user["id"]: raise HTTPException(400,"Cannot delete your own account")
    conn = get_db()
    conn.execute("DELETE FROM users WHERE id=?",(user_id,))
    conn.execute("DELETE FROM sessions WHERE user_id=?",(user_id,))
    conn.commit(); conn.close()
    return {"message":"Deleted"}

# Projects
def row_to_dict(row):
    d = dict(row)
    d['materials'] = json.loads(d['materials']) if d['materials'] else []
    return d

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

@app.get("/projects")
def get_projects(status: Optional[str]=None, priority: Optional[str]=None,
                 category: Optional[str]=None, user=Depends(get_current_user)):
    conn = get_db()
    if user["role"]=="admin":
        query="SELECT p.*,u.username as owner FROM projects p LEFT JOIN users u ON p.user_id=u.id WHERE 1=1"
        params=[]
    else:
        query="SELECT p.*,u.username as owner FROM projects p LEFT JOIN users u ON p.user_id=u.id WHERE p.user_id=?"
        params=[user["id"]]
    if status: query+=" AND p.status=?"; params.append(status)
    if priority: query+=" AND p.priority=?"; params.append(priority)
    if category: query+=" AND p.category=?"; params.append(category)
    query+=" ORDER BY CASE p.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END,p.created_at DESC"
    rows=conn.execute(query,params).fetchall(); conn.close()
    return [row_to_dict(r) for r in rows]

@app.get("/projects/{project_id}")
def get_project(project_id: int, user=Depends(get_current_user)):
    conn = get_db()
    row = conn.execute("SELECT p.*,u.username as owner FROM projects p LEFT JOIN users u ON p.user_id=u.id WHERE p.id=?",(project_id,)).fetchone()
    conn.close()
    if not row: raise HTTPException(404,"Not found")
    p = row_to_dict(row)
    if user["role"]!="admin" and p.get("user_id")!=user["id"]: raise HTTPException(403,"Access denied")
    return p

@app.post("/projects")
def create_project(project: ProjectCreate, user=Depends(get_current_user)):
    now = datetime.now().isoformat()
    conn = get_db()
    cur = conn.execute("""INSERT INTO projects (user_id,name,description,priority,status,estimated_cost,actual_cost,
        progress,materials,category,start_date,target_date,notes,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (user["id"],project.name,project.description,project.priority,project.status,
         project.estimated_cost,project.actual_cost,project.progress,
         json.dumps([m.dict() for m in project.materials]),
         project.category,project.start_date,project.target_date,project.notes,now,now))
    conn.commit()
    row = conn.execute("SELECT p.*,u.username as owner FROM projects p LEFT JOIN users u ON p.user_id=u.id WHERE p.id=?",(cur.lastrowid,)).fetchone()
    conn.close(); return row_to_dict(row)

@app.put("/projects/{project_id}")
def update_project(project_id: int, project: ProjectUpdate, user=Depends(get_current_user)):
    conn = get_db()
    existing = conn.execute("SELECT * FROM projects WHERE id=?",(project_id,)).fetchone()
    if not existing: conn.close(); raise HTTPException(404,"Not found")
    if user["role"]!="admin" and existing["user_id"]!=user["id"]: conn.close(); raise HTTPException(403,"Access denied")
    updates = {k:v for k,v in project.dict().items() if v is not None}
    if 'materials' in updates:
        updates['materials'] = json.dumps([m if isinstance(m,dict) else m.dict() for m in updates['materials']])
    if project.progress==100 and project.status!='completed':
        updates['status']='completed'; updates['completed_date']=datetime.now().isoformat()
    updates['updated_at']=datetime.now().isoformat()
    set_clause=", ".join([f"{k}=?" for k in updates])
    conn.execute(f"UPDATE projects SET {set_clause} WHERE id=?",list(updates.values())+[project_id])
    conn.commit()
    row = conn.execute("SELECT p.*,u.username as owner FROM projects p LEFT JOIN users u ON p.user_id=u.id WHERE p.id=?",(project_id,)).fetchone()
    conn.close(); return row_to_dict(row)

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, user=Depends(get_current_user)):
    conn = get_db()
    existing = conn.execute("SELECT * FROM projects WHERE id=?",(project_id,)).fetchone()
    if not existing: conn.close(); raise HTTPException(404,"Not found")
    if user["role"]!="admin" and existing["user_id"]!=user["id"]: conn.close(); raise HTTPException(403,"Access denied")
    conn.execute("DELETE FROM projects WHERE id=?",(project_id,))
    conn.commit(); conn.close()
    return {"message":"Deleted"}

@app.get("/stats")
def get_stats(user=Depends(get_current_user)):
    conn = get_db()
    if user["role"]=="admin":
        rows=conn.execute("SELECT * FROM projects").fetchall()
    else:
        rows=conn.execute("SELECT * FROM projects WHERE user_id=?",(user["id"],)).fetchall()
    conn.close()
    projects=[row_to_dict(r) for r in rows]
    total=len(projects)
    by_status,by_priority={},{}
    for p in projects:
        by_status[p['status']]=by_status.get(p['status'],0)+1
        by_priority[p['priority']]=by_priority.get(p['priority'],0)+1
    avg=sum(p['progress'] for p in projects)/total if total else 0
    return {"total":total,"by_status":by_status,"by_priority":by_priority,
            "total_estimated_cost":sum(p['estimated_cost'] for p in projects),
            "total_actual_cost":sum(p['actual_cost'] for p in projects),
            "average_progress":round(avg,1)}

init_db()
