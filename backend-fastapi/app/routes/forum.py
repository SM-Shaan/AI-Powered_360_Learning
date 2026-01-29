"""
Forum Routes for Community Forum & Bot Support
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional, List
from app.models.forum_schemas import (
    CreatePostRequest, UpdatePostRequest, CreateCommentRequest,
    VoteRequest, MarkAnswerRequest, PostResponse, PostDetailResponse,
    PostListResponse, CommentResponse
)
from app.services.forum_service import get_forum_service
from app.routes.auth import get_current_user, require_admin

router = APIRouter(prefix="/forum", tags=["Forum"])


# ==================== POSTS ====================

@router.post("/posts", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_post(
    request: CreatePostRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new forum post.

    For question posts, an AI bot will automatically attempt to answer.
    """
    forum_service = get_forum_service()

    try:
        post = await forum_service.create_post(
            title=request.title,
            content=request.content,
            author_id=current_user["id"],
            post_type=request.post_type.value,
            tags=request.tags,
            request_bot_answer=request.request_bot_answer
        )

        return {"success": True, "data": post}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/posts", response_model=dict)
async def get_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    post_type: Optional[str] = Query(None, description="Filter by post type"),
    status: Optional[str] = Query(None, description="Filter by status"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    search: Optional[str] = Query(None, description="Search in title and content"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get paginated list of forum posts."""
    forum_service = get_forum_service()

    try:
        result = await forum_service.get_posts(
            page=page,
            per_page=per_page,
            post_type=post_type,
            status=status,
            tag=tag,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order
        )

        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/posts/{post_id}", response_model=dict)
async def get_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a single post with all comments."""
    forum_service = get_forum_service()

    post = await forum_service.get_post(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )

    return {"success": True, "data": post}


@router.put("/posts/{post_id}", response_model=dict)
async def update_post(
    post_id: str,
    request: UpdatePostRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update a forum post (author only)."""
    forum_service = get_forum_service()

    try:
        updates = request.dict(exclude_unset=True)
        if "status" in updates and updates["status"]:
            updates["status"] = updates["status"].value

        post = await forum_service.update_post(
            post_id=post_id,
            user_id=current_user["id"],
            updates=updates
        )

        return {"success": True, "data": post}
    except Exception as e:
        if "Not authorized" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.delete("/posts/{post_id}", response_model=dict)
async def delete_post(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a forum post (author or admin only)."""
    forum_service = get_forum_service()

    try:
        await forum_service.delete_post(
            post_id=post_id,
            user_id=current_user["id"],
            is_admin=current_user.get("role") == "admin"
        )

        return {"success": True, "message": "Post deleted"}
    except Exception as e:
        if "Not authorized" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== COMMENTS ====================

@router.post("/posts/{post_id}/comments", response_model=dict, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: str,
    request: CreateCommentRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a comment to a post."""
    forum_service = get_forum_service()

    try:
        comment = await forum_service.create_comment(
            post_id=post_id,
            content=request.content,
            author_id=current_user["id"],
            parent_id=request.parent_id
        )

        return {"success": True, "data": comment}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/comments/{comment_id}", response_model=dict)
async def delete_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a comment (author or admin only)."""
    forum_service = get_forum_service()

    try:
        await forum_service.delete_comment(
            comment_id=comment_id,
            user_id=current_user["id"],
            is_admin=current_user.get("role") == "admin"
        )

        return {"success": True, "message": "Comment deleted"}
    except Exception as e:
        if "Not authorized" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/posts/{post_id}/accept-answer", response_model=dict)
async def mark_accepted_answer(
    post_id: str,
    request: MarkAnswerRequest,
    current_user: dict = Depends(get_current_user)
):
    """Mark a comment as the accepted answer (post author only)."""
    forum_service = get_forum_service()

    try:
        await forum_service.mark_accepted_answer(
            post_id=post_id,
            comment_id=request.comment_id,
            user_id=current_user["id"]
        )

        return {"success": True, "message": "Answer accepted"}
    except Exception as e:
        if "Only the post author" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==================== VOTING ====================

@router.post("/posts/{post_id}/vote", response_model=dict)
async def vote_post(
    post_id: str,
    request: VoteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Vote on a post (upvote or downvote)."""
    forum_service = get_forum_service()

    try:
        result = await forum_service.vote(
            user_id=current_user["id"],
            vote_type=request.vote_type,
            post_id=post_id
        )

        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/comments/{comment_id}/vote", response_model=dict)
async def vote_comment(
    comment_id: str,
    request: VoteRequest,
    current_user: dict = Depends(get_current_user)
):
    """Vote on a comment (upvote or downvote)."""
    forum_service = get_forum_service()

    try:
        result = await forum_service.vote(
            user_id=current_user["id"],
            vote_type=request.vote_type,
            comment_id=comment_id
        )

        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== BOT ====================

@router.post("/posts/{post_id}/bot-answer", response_model=dict)
async def request_bot_answer(
    post_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Manually request an AI bot answer for a post."""
    forum_service = get_forum_service()

    try:
        result = await forum_service.request_bot_answer(post_id)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== TAGS ====================

@router.get("/tags", response_model=dict)
async def get_popular_tags(
    limit: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get popular forum tags."""
    forum_service = get_forum_service()

    try:
        tags = await forum_service.get_popular_tags(limit=limit)
        return {"success": True, "data": tags}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ==================== USER POSTS ====================

@router.get("/users/{user_id}/posts", response_model=dict)
async def get_user_posts(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get posts by a specific user."""
    forum_service = get_forum_service()

    try:
        result = await forum_service.get_user_posts(
            user_id=user_id,
            page=page,
            per_page=per_page
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/my-posts", response_model=dict)
async def get_my_posts(
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    current_user: dict = Depends(get_current_user)
):
    """Get current user's posts."""
    forum_service = get_forum_service()

    try:
        result = await forum_service.get_user_posts(
            user_id=current_user["id"],
            page=page,
            per_page=per_page
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
