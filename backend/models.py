from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Boolean, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user", nullable=False)
    is_active = Column(Integer, default=1, nullable=False)
    created_at = Column(String, nullable=False)
    last_login = Column(String, nullable=True)

    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Session(Base):
    __tablename__ = "sessions"

    token = Column(String, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    expires_at = Column(String, nullable=False)

    user = relationship("User", back_populates="sessions")


class Config(Base):
    __tablename__ = "config"

    id = Column(Integer, primary_key=True)
    type = Column(String, nullable=False)
    key = Column(String, nullable=False)
    label = Column(String, nullable=False)
    color = Column(String, nullable=True)
    bg_color = Column(String, nullable=True)
    sort_order = Column(Integer, default=0)
    is_active = Column(Integer, default=1)

    __table_args__ = (
        UniqueConstraint('type', 'key', name='uq_config_type_key'),
    )


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String, default="medium", nullable=False)
    status = Column(String, default="planned", nullable=False)
    estimated_cost = Column(Float, default=0)
    actual_cost = Column(Float, default=0)
    progress = Column(Integer, default=0)
    materials = Column(String, default="[]")  # JSON stored as string
    category = Column(String, default="general")
    start_date = Column(String, nullable=True)
    target_date = Column(String, nullable=True)
    completed_date = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(String, nullable=False)
    updated_at = Column(String, nullable=False)

    user = relationship("User", back_populates="projects")
