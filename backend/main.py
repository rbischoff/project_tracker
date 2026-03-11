from fastapi import FastAPI, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List
from sqlalchemy import create_engine, Column, String, and_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import IntegrityError
import json
import secrets
import re
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from passlib.context import CryptContext
from models import Base, User, Session as SessionModel, Config, Project

load_dotenv()

app = FastAPI(title="Home Improvement Tracker")

# CORS configuration with production URL from environment
PRODUCTION_URL = os.getenv("PRODUCTION_URL", "https://projects.grovelab.net")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://frontend:5173", f"{PRODUCTION_URL}"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "project_tracker")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Initialize default config if empty
    if db.query(Config).count() == 0:
        defaults = [
            Config(type='priority', key='critical', label='Critical', color='#B84040', bg_color='#FDEAEA', sort_order=1),
            Config(type='priority', key='high', label='High', color='#8B5A1A', bg_color='#FBF0DC', sort_order=2),
            Config(type='priority', key='medium', label='Medium', color='#2B5278', bg_color='#E8F0F8', sort_order=3),
            Config(type='priority', key='low', label='Low', color='#3A6B4E', bg_color='#E8F4ED', sort_order=4),
            Config(type='status', key='planned', label='Planned', color='#5A5A5A', bg_color='#F0EDEA', sort_order=1),
            Config(type='status', key='in_progress', label='In Progress', color='#2B5278', bg_color='#E8F0F8', sort_order=2),
            Config(type='status', key='on_hold', label='On Hold', color='#8B5A1A', bg_color='#FBF0DC', sort_order=3),
            Config(type='status', key='completed', label='Completed', color='#3A6B4E', bg_color='#E8F4ED', sort_order=4),
            Config(type='category', key='kitchen', label='Kitchen', sort_order=1),
            Config(type='category', key='bathroom', label='Bathroom', sort_order=2),
            Config(type='category', key='bedroom', label='Bedroom', sort_order=3),
            Config(type='category', key='living_room', label='Living Room', sort_order=4),
            Config(type='category', key='outdoor', label='Outdoor', sort_order=5),
            Config(type='category', key='basement', label='Basement', sort_order=6),
            Config(type='category', key='garage', label='Garage', sort_order=7),
            Config(type='category', key='roof', label='Roof', sort_order=8),
            Config(type='category', key='plumbing', label='Plumbing', sort_order=9),
            Config(type='category', key='electrical', label='Electrical', sort_order=10),
            Config(type='category', key='flooring', label='Flooring', sort_order=11),
            Config(type='category', key='painting', label='Painting', sort_order=12),
            Config(type='category', key='general', label='General', sort_order=13),
        ]
        db.add_all(defaults)
        db.commit()
    
    # Initialize default users if empty
    if db.query(User).count() == 0:
        now = datetime.now().isoformat()
        admin = User(
            username="admin",
            email="admin@home.local",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            created_at=now
        )
        user = User(
            username="user",
            email="user@home.local",
            password_hash=pwd_context.hash("user123"),
            role="user",
            created_at=now
        )
        db.add(admin)
        db.add(user)
        db.commit()
    
    db.close()

def hash_password(p: str) -> str:
    return pwd_context.hash(p)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_session(user_id: int, db: Session) -> str:
    token = secrets.token_urlsafe(32)
    expires = (datetime.now() + timedelta(hours=24)).isoformat()
    session = SessionModel(token=token, user_id=user_id, expires_at=expires)
    db.add(session)
    db.commit()
    return token

def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security), db: Session = Depends(get_db)) -> dict:
    # Try to get token from Authorization header first, then from cookie
    token = None
    if credentials:
        token = credentials.credentials
    elif request.cookies.get("hit_token"):
        token = request.cookies.get("hit_token")
    
    if not token:
        raise HTTPException(401, "Invalid session")
    
    session = db.query(SessionModel).filter(SessionModel.token == token).first()
    if not session:
        raise HTTPException(401, "Invalid session")
    if datetime.fromisoformat(session.expires_at) < datetime.now():
        raise HTTPException(401, "Session expired")
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(403, "Account disabled")
    return {"id": user.id, "username": user.username, "email": user.email, "role": user.role}

def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Admin access required")
    return user

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    # Normalize input - trim whitespace and lowercase for comparison
    input_value = req.username.strip().lower()
    
    user = db.query(User).filter(
        and_(
            ((User.username.ilike(input_value)) | (User.email.ilike(input_value))),
            User.is_active == 1
        )
    ).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "Invalid username or password")
    user.last_login = datetime.now().isoformat()
    db.commit()
    token = create_session(user.id, db)
    
    response = JSONResponse(
        status_code=200,
        content={
            "token": token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": user.role
            }
        }
    )
    # Set secure httpOnly cookie for token
    response.set_cookie(
        key="hit_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=86400  # 24 hours
    )
    return response

@app.post("/auth/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    session = db.query(SessionModel).filter(SessionModel.token == credentials.credentials).first()
    if not session:
        raise HTTPException(401, "Invalid session")
    db.delete(session)
    db.commit()
    
    response = JSONResponse(status_code=200, content={"message": "Logged out"})
    response.delete_cookie(key="hit_token")
    return response

@app.get("/auth/me")
def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "username": user["username"], "email": user["email"], "role": user["role"]}

@app.get("/config")
def get_config(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    configs = db.query(Config).filter(Config.is_active == 1).order_by(Config.type, Config.sort_order).all()
    result = {"priorities": [], "statuses": [], "categories": []}
    for config in configs:
        config_dict = {
            "id": config.id,
            "type": config.type,
            "key": config.key,
            "label": config.label,
            "color": config.color,
            "bg_color": config.bg_color,
            "sort_order": config.sort_order
        }
        if config.type == "priority":
            result["priorities"].append(config_dict)
        elif config.type == "status":
            result["statuses"].append(config_dict)
        elif config.type == "category":
            result["categories"].append(config_dict)
    return result

@app.get("/admin/config")
def get_all_config(user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    configs = db.query(Config).order_by(Config.type, Config.sort_order).all()
    return [
        {
            "id": c.id,
            "type": c.type,
            "key": c.key,
            "label": c.label,
            "color": c.color,
            "bg_color": c.bg_color,
            "sort_order": c.sort_order,
            "is_active": c.is_active
        }
        for c in configs
    ]

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
def create_config(item: ConfigItem, user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    key = re.sub(r'[^a-z0-9_]', '_', item.key.lower().strip())
    try:
        config = Config(
            type=item.type,
            key=key,
            label=item.label,
            color=item.color,
            bg_color=item.bg_color,
            sort_order=item.sort_order
        )
        db.add(config)
        db.commit()
        db.refresh(config)
        return {
            "id": config.id,
            "type": config.type,
            "key": config.key,
            "label": config.label,
            "color": config.color,
            "bg_color": config.bg_color,
            "sort_order": config.sort_order
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, f"Key '{key}' already exists for type '{item.type}'")

@app.put("/admin/config/{config_id}")
def update_config(config_id: int, item: ConfigUpdate, user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    config = db.query(Config).filter(Config.id == config_id).first()
    if not config:
        raise HTTPException(404, "Not found")
    for key, value in item.model_dump().items():
        if value is not None:
            setattr(config, key, value)
    db.commit()
    db.refresh(config)
    return {
        "id": config.id,
        "type": config.type,
        "key": config.key,
        "label": config.label,
        "color": config.color,
        "bg_color": config.bg_color,
        "sort_order": config.sort_order,
        "is_active": config.is_active
    }

@app.delete("/admin/config/{config_id}")
def delete_config(config_id: int, user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    config = db.query(Config).filter(Config.id == config_id).first()
    if config:
        db.delete(config)
        db.commit()
    return {"message": "Deleted"}

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
def get_users(user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at,
            "last_login": u.last_login
        }
        for u in users
    ]

@app.post("/admin/users")
def create_user(req: UserCreate, user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    try:
        new_user = User(
            username=req.username,
            email=req.email,
            password_hash=hash_password(req.password),
            role=req.role,
            created_at=datetime.now().isoformat()
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "created_at": new_user.created_at
        }
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Username or email already exists")

@app.put("/admin/users/{user_id}")
def update_user(user_id: int, req: UserUpdate, user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(404, "Not found")
    if req.password:
        db_user.password_hash = hash_password(req.password)
    if req.email:
        db_user.email = req.email
    if req.role:
        db_user.role = req.role
    if req.is_active is not None:
        db_user.is_active = req.is_active
    db.commit()
    db.refresh(db_user)
    return {
        "id": db_user.id,
        "username": db_user.username,
        "email": db_user.email,
        "role": db_user.role,
        "is_active": db_user.is_active,
        "created_at": db_user.created_at,
        "last_login": db_user.last_login
    }

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, current_user: dict = Depends(require_admin), db: Session = Depends(get_db)):
    if user_id == current_user["id"]:
        raise HTTPException(400, "Cannot delete your own account")
    db.query(SessionModel).filter(SessionModel.user_id == user_id).delete()
    db_user = db.query(User).filter(User.id == user_id).first()
    if db_user:
        db.delete(db_user)
        db.commit()
    return {"message": "Deleted"}

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
    estimated_cost: float = Field(default=0, ge=0)
    actual_cost: float = Field(default=0, ge=0)
    progress: int = Field(default=0, ge=0, le=100)
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
    estimated_cost: Optional[float] = Field(default=None, ge=0)
    actual_cost: Optional[float] = Field(default=None, ge=0)
    progress: Optional[int] = Field(default=None, ge=0, le=100)
    materials: Optional[List[MaterialItem]] = None
    category: Optional[str] = None
    start_date: Optional[str] = None
    target_date: Optional[str] = None
    completed_date: Optional[str] = None
    notes: Optional[str] = None

def project_to_dict(project: Project, owner_name: Optional[str] = None) -> dict:
    return {
        "id": project.id,
        "user_id": project.user_id,
        "name": project.name,
        "description": project.description,
        "priority": project.priority,
        "status": project.status,
        "estimated_cost": project.estimated_cost,
        "actual_cost": project.actual_cost,
        "progress": project.progress,
        "materials": json.loads(project.materials) if project.materials else [],
        "category": project.category,
        "start_date": project.start_date,
        "target_date": project.target_date,
        "completed_date": project.completed_date,
        "notes": project.notes,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
        "owner": owner_name
    }

@app.get("/projects")
def get_projects(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Project, User.username)
    
    if user["role"] != "admin":
        query = query.filter(Project.user_id == user["id"])
    
    query = query.outerjoin(User, Project.user_id == User.id)
    
    if status:
        query = query.filter(Project.status == status)
    if priority:
        query = query.filter(Project.priority == priority)
    if category:
        query = query.filter(Project.category == category)
    
    # Priority ordering
    priority_order = {"critical": 1, "high": 2, "medium": 3, "low": 4}
    
    results = query.all()
    projects = [
        project_to_dict(proj, owner)
        for proj, owner in results
    ]
    
    projects.sort(key=lambda p: (priority_order.get(p["priority"], 5), p["created_at"]), reverse=True)
    return projects

@app.get("/projects/{project_id}")
def get_project(project_id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and project.user_id != user["id"]:
        raise HTTPException(403, "Access denied")
    owner = db.query(User).filter(User.id == project.user_id).first()
    owner_name = owner.username if owner else None
    return project_to_dict(project, owner_name)

@app.post("/projects")
def create_project(project: ProjectCreate, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.now().isoformat()
    new_project = Project(
        user_id=user["id"],
        name=project.name,
        description=project.description,
        priority=project.priority,
        status=project.status,
        estimated_cost=project.estimated_cost,
        actual_cost=project.actual_cost,
        progress=project.progress,
        materials=json.dumps([m.model_dump() for m in project.materials]),
        category=project.category,
        start_date=project.start_date,
        target_date=project.target_date,
        notes=project.notes,
        created_at=now,
        updated_at=now
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    owner = db.query(User).filter(User.id == new_project.user_id).first()
    return project_to_dict(new_project, owner.username if owner else None)

@app.put("/projects/{project_id}")
def update_project(project_id: int, project: ProjectUpdate, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and db_project.user_id != user["id"]:
        raise HTTPException(403, "Access denied")
    
    for key, value in project.model_dump().items():
        if value is not None:
            if key == "materials":
                setattr(db_project, key, json.dumps(value))
            else:
                setattr(db_project, key, value)
    
    if project.progress == 100 and project.status != "completed":
        db_project.status = "completed"
        db_project.completed_date = datetime.now().isoformat()
    
    db_project.updated_at = datetime.now().isoformat()
    db.commit()
    db.refresh(db_project)
    owner = db.query(User).filter(User.id == db_project.user_id).first()
    return project_to_dict(db_project, owner.username if owner else None)

@app.delete("/projects/{project_id}")
def delete_project(project_id: int, user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(404, "Not found")
    if user["role"] != "admin" and project.user_id != user["id"]:
        raise HTTPException(403, "Access denied")
    db.delete(project)
    db.commit()
    return {"message": "Deleted"}

@app.get("/stats")
def get_stats(user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Project)
    if user["role"] != "admin":
        query = query.filter(Project.user_id == user["id"])
    
    projects = query.all()
    total = len(projects)
    by_status = {}
    by_priority = {}
    
    for p in projects:
        by_status[p.status] = by_status.get(p.status, 0) + 1
        by_priority[p.priority] = by_priority.get(p.priority, 0) + 1
    
    avg = sum(p.progress for p in projects) / total if total else 0
    
    return {
        "total": total,
        "by_status": by_status,
        "by_priority": by_priority,
        "total_estimated_cost": sum(p.estimated_cost for p in projects),
        "total_actual_cost": sum(p.actual_cost for p in projects),
        "average_progress": round(avg, 1)
    }

init_db()
