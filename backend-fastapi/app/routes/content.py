from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, status
from fastapi.responses import StreamingResponse
from typing import Optional, List
from app.models.schemas import ContentUpdate, ContentResponse, ContentStats
from app.core.supabase import get_supabase
from app.core.security import get_current_user, get_current_user_optional, require_admin
from app.core.config import settings
import uuid
import json
import os
import aiofiles

router = APIRouter(prefix="/content", tags=["Content"])

ALLOWED_EXTENSIONS = {
    '.pdf', '.ppt', '.pptx', '.txt', '.md',
    '.py', '.js', '.ts', '.java', '.c', '.cpp', '.h', '.hpp',
    '.cs', '.go', '.rs', '.rb', '.php', '.sql', '.sh',
    '.ipynb', '.json', '.html', '.css', '.xml', '.yaml', '.yml'
}

def validate_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS

@router.get("/", response_model=dict)
async def get_all_content(
    category: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    week: Optional[int] = Query(None),
    tags: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Get all content with optional filters (Public)"""
    supabase = get_supabase()

    query = supabase.table("content").select("*")

    if category:
        query = query.eq("category", category)
    if content_type:
        query = query.eq("content_type", content_type)
    if topic:
        query = query.ilike("topic", f"%{topic}%")
    if week:
        query = query.eq("week", week)
    if search:
        query = query.or_(f"title.ilike.%{search}%,description.ilike.%{search}%,topic.ilike.%{search}%")

    query = query.order("created_at", desc=True)
    result = query.execute()

    # Parse tags from JSON string
    content_list = []
    for item in result.data:
        if item.get("tags"):
            try:
                item["tags"] = json.loads(item["tags"]) if isinstance(item["tags"], str) else item["tags"]
            except:
                item["tags"] = []
        else:
            item["tags"] = []
        content_list.append(item)

    # Filter by tags if specified
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",")]
        content_list = [
            item for item in content_list
            if any(tag.lower() in [t.lower() for t in item.get("tags", [])] for tag in tag_list)
        ]

    return {"success": True, "data": content_list}

@router.get("/stats/overview", response_model=dict)
async def get_content_stats():
    """Get content statistics (Public)"""
    supabase = get_supabase()

    # Get total count
    total_result = supabase.table("content").select("id", count="exact").execute()
    total = total_result.count or 0

    # Get all content for aggregation
    all_content = supabase.table("content").select("category, content_type, week").execute()

    by_category = {"theory": 0, "lab": 0}
    by_type = {}
    by_week = {}

    for item in all_content.data:
        # Category counts
        cat = item.get("category")
        if cat in by_category:
            by_category[cat] += 1

        # Type counts
        ctype = item.get("content_type")
        if ctype:
            by_type[ctype] = by_type.get(ctype, 0) + 1

        # Week counts
        week = item.get("week")
        if week:
            week_key = f"week_{week}"
            by_week[week_key] = by_week.get(week_key, 0) + 1

    stats = {
        "total": total,
        "byCategory": by_category,
        "byType": by_type,
        "byWeek": by_week
    }

    return {"success": True, "data": stats}

@router.get("/{content_id}", response_model=dict)
async def get_content_by_id(content_id: str):
    """Get single content by ID (Public)"""
    supabase = get_supabase()

    result = supabase.table("content").select("*").eq("id", content_id).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    content = result.data[0]
    if content.get("tags"):
        try:
            content["tags"] = json.loads(content["tags"]) if isinstance(content["tags"], str) else content["tags"]
        except:
            content["tags"] = []
    else:
        content["tags"] = []

    return {"success": True, "data": content}

@router.post("/", response_model=dict)
async def upload_content(
    file: UploadFile = File(...),
    title: str = Form(...),
    category: str = Form(...),
    content_type: str = Form(...),
    description: Optional[str] = Form(None),
    topic: Optional[str] = Form(None),
    week: Optional[int] = Form(None),
    tags: Optional[str] = Form(None),
    admin: dict = Depends(require_admin)
):
    """Upload new content (Admin only)"""

    # Validate file
    if not validate_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type"
        )

    # Check file size
    file_content = await file.read()
    if len(file_content) > settings.max_file_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {settings.max_file_size // (1024*1024)}MB"
        )

    supabase = get_supabase()
    content_id = str(uuid.uuid4())

    # Upload file to Supabase Storage
    file_ext = os.path.splitext(file.filename)[1]
    storage_path = f"{category}/{content_id}{file_ext}"

    try:
        # Upload to Supabase storage
        storage_result = supabase.storage.from_("materials").upload(
            storage_path,
            file_content,
            {"content-type": file.content_type}
        )

        # Get public URL
        file_url = supabase.storage.from_("materials").get_public_url(storage_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

    # Parse tags
    tags_list = []
    if tags:
        tags_list = [t.strip() for t in tags.split(",") if t.strip()]

    # Create content record
    content_data = {
        "id": content_id,
        "title": title,
        "description": description or "",
        "category": category,
        "content_type": content_type,
        "file_path": storage_path,
        "file_name": file.filename,
        "file_size": len(file_content),
        "mime_type": file.content_type,
        "topic": topic,
        "week": week,
        "tags": json.dumps(tags_list),
        "uploaded_by": admin["id"]
    }

    result = supabase.table("content").insert(content_data).execute()

    if not result.data:
        # Clean up uploaded file
        try:
            supabase.storage.from_("materials").remove([storage_path])
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create content record"
        )

    content = result.data[0]
    content["tags"] = tags_list

    return {"success": True, "data": content}

@router.put("/{content_id}", response_model=dict)
async def update_content(
    content_id: str,
    update_data: ContentUpdate,
    admin: dict = Depends(require_admin)
):
    """Update content metadata (Admin only)"""
    supabase = get_supabase()

    # Check if content exists
    existing = supabase.table("content").select("*").eq("id", content_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    # Build update dict
    updates = {}
    if update_data.title is not None:
        updates["title"] = update_data.title
    if update_data.description is not None:
        updates["description"] = update_data.description
    if update_data.category is not None:
        updates["category"] = update_data.category.value
    if update_data.content_type is not None:
        updates["content_type"] = update_data.content_type.value
    if update_data.topic is not None:
        updates["topic"] = update_data.topic
    if update_data.week is not None:
        updates["week"] = update_data.week
    if update_data.tags is not None:
        updates["tags"] = json.dumps(update_data.tags)

    if updates:
        result = supabase.table("content").update(updates).eq("id", content_id).execute()
        content = result.data[0]
    else:
        content = existing.data[0]

    # Parse tags
    if content.get("tags"):
        try:
            content["tags"] = json.loads(content["tags"]) if isinstance(content["tags"], str) else content["tags"]
        except:
            content["tags"] = []
    else:
        content["tags"] = []

    return {"success": True, "data": content}

@router.delete("/{content_id}", response_model=dict)
async def delete_content(
    content_id: str,
    admin: dict = Depends(require_admin)
):
    """Delete content (Admin only)"""
    supabase = get_supabase()

    # Check if content exists
    existing = supabase.table("content").select("*").eq("id", content_id).execute()
    if not existing.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    content = existing.data[0]

    # Delete file from storage
    try:
        if content.get("file_path"):
            supabase.storage.from_("materials").remove([content["file_path"]])
    except Exception as e:
        print(f"Warning: Failed to delete file from storage: {e}")

    # Delete content record
    supabase.table("content").delete().eq("id", content_id).execute()

    return {"success": True, "message": "Content deleted successfully"}

@router.get("/{content_id}/download")
async def download_content(
    content_id: str,
    current_user: Optional[dict] = Depends(get_current_user_optional)
):
    """Download content file"""
    supabase = get_supabase()

    # Get content
    result = supabase.table("content").select("*").eq("id", content_id).execute()
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )

    content = result.data[0]

    # Get file from storage
    try:
        file_data = supabase.storage.from_("materials").download(content["file_path"])

        return StreamingResponse(
            iter([file_data]),
            media_type=content.get("mime_type", "application/octet-stream"),
            headers={
                "Content-Disposition": f'attachment; filename="{content["file_name"]}"'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found in storage"
        )
