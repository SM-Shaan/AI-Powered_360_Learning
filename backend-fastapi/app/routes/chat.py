"""
Chat Routes - Part 5: Conversational Chat Interface

Provides chat endpoints for the AI learning assistant.
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List
from app.services.chat_service import get_chat_service
from app.core.security import get_current_user

router = APIRouter(prefix="/chat", tags=["Chat"])


# Request/Response Schemas

class ChatMessageRequest(BaseModel):
    """Request schema for sending a chat message"""
    message: str = Field(..., min_length=1, max_length=4000, description="User message")
    conversation_id: Optional[str] = Field(default="new", description="Conversation ID or 'new'")


class ChatMessageResponse(BaseModel):
    """Response schema for chat message"""
    success: bool
    conversation_id: str
    message: str
    sources: Optional[List[dict]] = None
    intent: Optional[dict] = None
    metadata: Optional[dict] = None
    error: Optional[str] = None


class ConversationResponse(BaseModel):
    """Response schema for conversation info"""
    id: str
    created_at: str
    message_count: int
    last_message: str


# Endpoints

@router.post("/message", response_model=dict)
async def send_message(
    request: ChatMessageRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message to the AI chat assistant.

    The assistant will:
    - Search course materials for relevant context
    - Use Wikipedia for supplementary information
    - Maintain conversation history
    - Provide grounded, educational responses

    Returns AI response with sources and metadata.
    """
    chat_service = get_chat_service()

    try:
        result = await chat_service.chat(
            conversation_id=request.conversation_id,
            user_message=request.message,
            user_id=current_user["id"]
        )

        return {"success": True, "data": result}

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat error: {str(e)}"
        )


@router.get("/conversations", response_model=dict)
async def get_conversations(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all conversations for the current user.

    Returns list of conversations with metadata.
    """
    chat_service = get_chat_service()

    try:
        conversations = chat_service.get_user_conversations(current_user["id"])
        return {"success": True, "data": conversations}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.get("/conversations/{conversation_id}", response_model=dict)
async def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific conversation with full message history.
    """
    chat_service = get_chat_service()
    conv = chat_service.get_conversation(conversation_id)

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if conv.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return {
        "success": True,
        "data": {
            "id": conversation_id,
            "messages": conv.get("messages", []),
            "created_at": conv.get("created_at")
        }
    }


@router.post("/conversations/new", response_model=dict)
async def create_conversation(
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new conversation.

    Returns the new conversation ID.
    """
    chat_service = get_chat_service()

    try:
        conv_id = chat_service.create_conversation(current_user["id"])
        return {
            "success": True,
            "data": {
                "conversation_id": conv_id,
                "message": "New conversation created"
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.delete("/conversations/{conversation_id}", response_model=dict)
async def delete_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a conversation.
    """
    chat_service = get_chat_service()
    conv = chat_service.get_conversation(conversation_id)

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if conv.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    chat_service.delete_conversation(conversation_id)
    return {"success": True, "message": "Conversation deleted"}


@router.post("/conversations/{conversation_id}/clear", response_model=dict)
async def clear_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Clear all messages in a conversation but keep the conversation.
    """
    chat_service = get_chat_service()
    conv = chat_service.get_conversation(conversation_id)

    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    if conv.get("user_id") != current_user["id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    chat_service.clear_conversation(conversation_id)
    return {"success": True, "message": "Conversation cleared"}


@router.get("/debug/search", response_model=dict)
async def debug_search(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Debug endpoint to test search functionality.
    Shows what the system finds for a given query.
    """
    from app.core.supabase import get_supabase_admin

    supabase = get_supabase_admin()
    results = {
        "query": query,
        "content_table": [],
        "content_chunks": [],
        "raw_file_search": []
    }

    # 1. Search content table (metadata)
    try:
        content_result = supabase.table("content").select(
            "id, title, file_name, category"
        ).or_(
            f"title.ilike.%{query}%,file_name.ilike.%{query}%"
        ).limit(5).execute()
        results["content_table"] = content_result.data or []
    except Exception as e:
        results["content_table_error"] = str(e)

    # 2. Search content_chunks table
    try:
        chunks_result = supabase.table("content_chunks").select(
            "id, content_id, chunk_text, chunk_type"
        ).ilike("chunk_text", f"%{query}%").limit(5).execute()
        results["content_chunks"] = chunks_result.data or []
    except Exception as e:
        results["content_chunks_error"] = str(e)

    # 3. Check total chunks count
    try:
        count_result = supabase.table("content_chunks").select("id", count="exact").execute()
        results["total_chunks"] = count_result.count
    except Exception as e:
        results["total_chunks_error"] = str(e)

    # 4. Check if any content has been indexed
    try:
        content_with_chunks = supabase.table("content").select(
            "id, title, file_name"
        ).execute()
        for content in (content_with_chunks.data or []):
            chunk_count = supabase.table("content_chunks").select(
                "id", count="exact"
            ).eq("content_id", content["id"]).execute()
            content["chunk_count"] = chunk_count.count
        results["content_with_chunk_counts"] = content_with_chunks.data
    except Exception as e:
        results["content_check_error"] = str(e)

    return {"success": True, "data": results}


@router.get("/debug/file-search", response_model=dict)
async def debug_file_search(
    query: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Debug endpoint to test file retrieval functionality.
    """
    chat_service = get_chat_service()

    # Test file request detection
    is_file_req, filename = chat_service._is_file_request(query)

    # Try to get full file content
    file_content = await chat_service._get_full_file_content(filename, query)

    # Get list of available files
    from app.core.supabase import get_supabase_admin
    supabase = get_supabase_admin()

    try:
        files_result = supabase.table("content").select(
            "id, title, file_name, file_path, category"
        ).execute()
        available_files = files_result.data or []
    except Exception as e:
        available_files = {"error": str(e)}

    return {
        "success": True,
        "data": {
            "query": query,
            "is_file_request": is_file_req,
            "detected_filename": filename,
            "file_found": file_content is not None and file_content.get('found', False),
            "file_content_preview": file_content.get('content', '')[:500] if file_content else None,
            "file_metadata": {
                "title": file_content.get('title') if file_content else None,
                "file_name": file_content.get('file_name') if file_content else None,
                "language": file_content.get('language') if file_content else None,
            } if file_content else None,
            "available_files": available_files
        }
    }


@router.get("/suggestions", response_model=dict)
async def get_suggestions(
    current_user: dict = Depends(get_current_user)
):
    """
    Get suggested prompts/questions for the chat.
    """
    suggestions = [
        {
            "category": "Search",
            "prompts": [
                "Find materials about data structures",
                "Search for content on machine learning",
                "Show me resources about algorithms"
            ]
        },
        {
            "category": "Explain",
            "prompts": [
                "Explain how binary search works",
                "What is object-oriented programming?",
                "How does recursion work?"
            ]
        },
        {
            "category": "Generate",
            "prompts": [
                "Generate a quiz about sorting algorithms",
                "Create study notes on databases",
                "Write a Python function for linked lists"
            ]
        },
        {
            "category": "Summarize",
            "prompts": [
                "Summarize the key concepts of networking",
                "Give me an overview of SQL basics",
                "Brief summary of software testing"
            ]
        }
    ]

    return {"success": True, "data": suggestions}
