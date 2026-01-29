"""
Forum Schemas for Community Forum & Bot Support
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PostType(str, Enum):
    question = "question"
    discussion = "discussion"
    resource = "resource"
    announcement = "announcement"


class PostStatus(str, Enum):
    open = "open"
    answered = "answered"
    closed = "closed"


# Request Schemas
class CreatePostRequest(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    content: str = Field(..., min_length=10)
    post_type: PostType = PostType.question
    tags: Optional[List[str]] = []
    request_bot_answer: bool = True  # Auto-request bot answer for questions


class UpdatePostRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=5, max_length=200)
    content: Optional[str] = Field(None, min_length=10)
    tags: Optional[List[str]] = None
    status: Optional[PostStatus] = None


class CreateCommentRequest(BaseModel):
    content: str = Field(..., min_length=1)
    parent_id: Optional[str] = None  # For nested replies


class VoteRequest(BaseModel):
    vote_type: str = Field(..., pattern="^(up|down)$")


class MarkAnswerRequest(BaseModel):
    comment_id: str


# Response Schemas
class UserInfo(BaseModel):
    id: str
    username: str
    role: str


class CommentResponse(BaseModel):
    id: str
    content: str
    author: UserInfo
    is_bot: bool = False
    is_accepted_answer: bool = False
    upvotes: int = 0
    downvotes: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    replies: List["CommentResponse"] = []

    class Config:
        from_attributes = True


class PostResponse(BaseModel):
    id: str
    title: str
    content: str
    post_type: PostType
    status: PostStatus
    author: UserInfo
    tags: List[str] = []
    upvotes: int = 0
    downvotes: int = 0
    view_count: int = 0
    comment_count: int = 0
    has_accepted_answer: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PostDetailResponse(PostResponse):
    comments: List[CommentResponse] = []


class PostListResponse(BaseModel):
    posts: List[PostResponse]
    total: int
    page: int
    per_page: int
    total_pages: int


class BotAnswerResponse(BaseModel):
    answer: str
    confidence: float
    sources: List[dict] = []
    generated_at: datetime


# Allow recursive model
CommentResponse.model_rebuild()
