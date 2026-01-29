from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    admin = "admin"
    student = "student"

class ContentCategory(str, Enum):
    theory = "theory"
    lab = "lab"

class ContentType(str, Enum):
    slides = "slides"
    pdf = "pdf"
    code = "code"
    notes = "notes"
    reference = "reference"

# Auth Schemas
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: UserRole = UserRole.student

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    role: str
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ProfileUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None

# Content Schemas
class ContentBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: ContentCategory
    content_type: ContentType
    topic: Optional[str] = None
    week: Optional[int] = Field(None, ge=1, le=52)
    tags: Optional[List[str]] = []

class ContentCreate(ContentBase):
    pass

class ContentUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[ContentCategory] = None
    content_type: Optional[ContentType] = None
    topic: Optional[str] = None
    week: Optional[int] = Field(None, ge=1, le=52)
    tags: Optional[List[str]] = None

class ContentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    category: str
    content_type: str
    file_path: Optional[str]
    file_name: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    topic: Optional[str]
    week: Optional[int]
    tags: List[str] = []
    uploaded_by: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]

class ContentStats(BaseModel):
    total: int
    byCategory: dict
    byType: dict
    byWeek: dict

# API Response Schemas
class APIResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None
    message: Optional[str] = None
