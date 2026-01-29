"""
Forum Service for Community Forum & Bot Support
Handles posts, comments, voting, and AI bot responses
"""

import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from app.core.supabase import get_supabase_admin
from app.services.retrieval_service import get_retrieval_service
from app.services.generation_service import get_generation_service


class ForumService:
    """Service for managing forum posts, comments, and bot interactions."""

    def __init__(self):
        self.supabase = get_supabase_admin()
        self.bot_user_id = "bot-assistant"
        self.bot_username = "AI Assistant"

    # ==================== POSTS ====================

    async def create_post(
        self,
        title: str,
        content: str,
        author_id: str,
        post_type: str = "question",
        tags: List[str] = None,
        request_bot_answer: bool = True
    ) -> Dict[str, Any]:
        """Create a new forum post."""
        post_id = str(uuid.uuid4())

        post_data = {
            "id": post_id,
            "title": title,
            "content": content,
            "post_type": post_type,
            "status": "open",
            "author_id": author_id,
            "tags": tags or [],
            "upvotes": 0,
            "downvotes": 0,
            "view_count": 0,
            "comment_count": 0,
            "has_accepted_answer": False,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }

        result = self.supabase.table("forum_posts").insert(post_data).execute()

        if not result.data:
            raise Exception("Failed to create post")

        post = result.data[0]

        # Auto-generate bot answer for questions
        if post_type == "question" and request_bot_answer:
            try:
                bot_answer = await self.generate_bot_answer(post_id, f"{title}\n\n{content}")
                post["bot_answer"] = bot_answer
            except Exception as e:
                print(f"Bot answer generation failed: {e}")
                post["bot_answer"] = None

        # Fetch author info
        post["author"] = await self._get_user_info(author_id)

        return post

    async def get_posts(
        self,
        page: int = 1,
        per_page: int = 20,
        post_type: Optional[str] = None,
        status: Optional[str] = None,
        tag: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "created_at",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        """Get paginated list of forum posts."""
        query = self.supabase.table("forum_posts").select("*", count="exact")

        # Apply filters
        if post_type:
            query = query.eq("post_type", post_type)
        if status:
            query = query.eq("status", status)
        if tag:
            query = query.contains("tags", [tag])
        if search:
            query = query.or_(f"title.ilike.%{search}%,content.ilike.%{search}%")

        # Sorting
        query = query.order(sort_by, desc=(sort_order == "desc"))

        # Pagination
        offset = (page - 1) * per_page
        query = query.range(offset, offset + per_page - 1)

        result = query.execute()

        posts = result.data or []
        total = result.count or 0

        # Fetch author info for each post
        for post in posts:
            post["author"] = await self._get_user_info(post["author_id"])

        return {
            "posts": posts,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": (total + per_page - 1) // per_page
        }

    async def get_post(self, post_id: str, increment_view: bool = True) -> Optional[Dict[str, Any]]:
        """Get a single post with all comments."""
        result = self.supabase.table("forum_posts").select("*").eq("id", post_id).execute()

        if not result.data:
            return None

        post = result.data[0]

        # Increment view count
        if increment_view:
            self.supabase.table("forum_posts").update({
                "view_count": post["view_count"] + 1
            }).eq("id", post_id).execute()
            post["view_count"] += 1

        # Fetch author info
        post["author"] = await self._get_user_info(post["author_id"])

        # Fetch comments
        post["comments"] = await self.get_comments(post_id)

        return post

    async def update_post(
        self,
        post_id: str,
        user_id: str,
        updates: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update a forum post."""
        # Verify ownership
        post = self.supabase.table("forum_posts").select("author_id").eq("id", post_id).execute()
        if not post.data or post.data[0]["author_id"] != user_id:
            raise Exception("Not authorized to update this post")

        updates["updated_at"] = datetime.utcnow().isoformat()

        result = self.supabase.table("forum_posts").update(updates).eq("id", post_id).execute()

        if not result.data:
            raise Exception("Failed to update post")

        return result.data[0]

    async def delete_post(self, post_id: str, user_id: str, is_admin: bool = False) -> bool:
        """Delete a forum post."""
        # Verify ownership or admin
        if not is_admin:
            post = self.supabase.table("forum_posts").select("author_id").eq("id", post_id).execute()
            if not post.data or post.data[0]["author_id"] != user_id:
                raise Exception("Not authorized to delete this post")

        # Delete comments first
        self.supabase.table("forum_comments").delete().eq("post_id", post_id).execute()

        # Delete votes
        self.supabase.table("forum_votes").delete().eq("post_id", post_id).execute()

        # Delete post
        self.supabase.table("forum_posts").delete().eq("id", post_id).execute()

        return True

    # ==================== COMMENTS ====================

    async def create_comment(
        self,
        post_id: str,
        content: str,
        author_id: str,
        is_bot: bool = False,
        parent_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create a comment on a post."""
        comment_id = str(uuid.uuid4())

        comment_data = {
            "id": comment_id,
            "post_id": post_id,
            "content": content,
            "author_id": author_id,
            "is_bot": is_bot,
            "is_accepted_answer": False,
            "parent_id": parent_id,
            "upvotes": 0,
            "downvotes": 0,
            "created_at": datetime.utcnow().isoformat()
        }

        result = self.supabase.table("forum_comments").insert(comment_data).execute()

        if not result.data:
            raise Exception("Failed to create comment")

        # Update post comment count
        self.supabase.rpc("increment_comment_count", {"post_id_param": post_id}).execute()

        comment = result.data[0]
        comment["author"] = await self._get_user_info(author_id)
        comment["replies"] = []

        return comment

    async def get_comments(self, post_id: str) -> List[Dict[str, Any]]:
        """Get all comments for a post, organized in a tree structure."""
        result = self.supabase.table("forum_comments").select("*").eq("post_id", post_id).order("created_at").execute()

        comments = result.data or []

        # Fetch author info for each comment
        for comment in comments:
            if comment["is_bot"]:
                comment["author"] = {
                    "id": self.bot_user_id,
                    "username": self.bot_username,
                    "role": "bot"
                }
            else:
                comment["author"] = await self._get_user_info(comment["author_id"])

        # Build tree structure
        comment_map = {c["id"]: {**c, "replies": []} for c in comments}
        root_comments = []

        for comment in comments:
            if comment["parent_id"] and comment["parent_id"] in comment_map:
                comment_map[comment["parent_id"]]["replies"].append(comment_map[comment["id"]])
            else:
                root_comments.append(comment_map[comment["id"]])

        return root_comments

    async def delete_comment(self, comment_id: str, user_id: str, is_admin: bool = False) -> bool:
        """Delete a comment."""
        # Verify ownership or admin
        if not is_admin:
            comment = self.supabase.table("forum_comments").select("author_id, post_id").eq("id", comment_id).execute()
            if not comment.data or comment.data[0]["author_id"] != user_id:
                raise Exception("Not authorized to delete this comment")
            post_id = comment.data[0]["post_id"]
        else:
            comment = self.supabase.table("forum_comments").select("post_id").eq("id", comment_id).execute()
            post_id = comment.data[0]["post_id"] if comment.data else None

        # Delete comment and its replies
        self.supabase.table("forum_comments").delete().eq("id", comment_id).execute()
        self.supabase.table("forum_comments").delete().eq("parent_id", comment_id).execute()

        # Decrement post comment count
        if post_id:
            self.supabase.rpc("decrement_comment_count", {"post_id_param": post_id}).execute()

        return True

    async def mark_accepted_answer(self, post_id: str, comment_id: str, user_id: str) -> bool:
        """Mark a comment as the accepted answer."""
        # Verify post ownership
        post = self.supabase.table("forum_posts").select("author_id").eq("id", post_id).execute()
        if not post.data or post.data[0]["author_id"] != user_id:
            raise Exception("Only the post author can mark accepted answers")

        # Clear previous accepted answer
        self.supabase.table("forum_comments").update({
            "is_accepted_answer": False
        }).eq("post_id", post_id).execute()

        # Mark new accepted answer
        self.supabase.table("forum_comments").update({
            "is_accepted_answer": True
        }).eq("id", comment_id).execute()

        # Update post status
        self.supabase.table("forum_posts").update({
            "status": "answered",
            "has_accepted_answer": True
        }).eq("id", post_id).execute()

        return True

    # ==================== VOTING ====================

    async def vote(
        self,
        user_id: str,
        vote_type: str,  # "up" or "down"
        post_id: Optional[str] = None,
        comment_id: Optional[str] = None
    ) -> Dict[str, int]:
        """Vote on a post or comment."""
        if not post_id and not comment_id:
            raise Exception("Must specify post_id or comment_id")

        vote_id = str(uuid.uuid4())
        target_type = "post" if post_id else "comment"
        target_id = post_id or comment_id

        # Check existing vote
        existing = self.supabase.table("forum_votes").select("*").eq("user_id", user_id)
        if post_id:
            existing = existing.eq("post_id", post_id)
        else:
            existing = existing.eq("comment_id", comment_id)
        existing = existing.execute()

        table = "forum_posts" if post_id else "forum_comments"

        if existing.data:
            old_vote = existing.data[0]
            if old_vote["vote_type"] == vote_type:
                # Remove vote (toggle off)
                self.supabase.table("forum_votes").delete().eq("id", old_vote["id"]).execute()

                # Update counts
                field = "upvotes" if vote_type == "up" else "downvotes"
                self.supabase.rpc(f"decrement_{field}", {
                    "target_table": table,
                    "target_id": target_id
                }).execute()
            else:
                # Change vote
                self.supabase.table("forum_votes").update({
                    "vote_type": vote_type
                }).eq("id", old_vote["id"]).execute()

                # Update counts
                old_field = "upvotes" if old_vote["vote_type"] == "up" else "downvotes"
                new_field = "upvotes" if vote_type == "up" else "downvotes"

                # Use direct SQL update
                current = self.supabase.table(table).select("upvotes, downvotes").eq("id", target_id).execute()
                if current.data:
                    updates = {
                        old_field: max(0, current.data[0][old_field] - 1),
                        new_field: current.data[0][new_field] + 1
                    }
                    self.supabase.table(table).update(updates).eq("id", target_id).execute()
        else:
            # New vote
            vote_data = {
                "id": vote_id,
                "user_id": user_id,
                "vote_type": vote_type,
                "post_id": post_id,
                "comment_id": comment_id,
                "created_at": datetime.utcnow().isoformat()
            }
            self.supabase.table("forum_votes").insert(vote_data).execute()

            # Update counts
            current = self.supabase.table(table).select("upvotes, downvotes").eq("id", target_id).execute()
            if current.data:
                field = "upvotes" if vote_type == "up" else "downvotes"
                self.supabase.table(table).update({
                    field: current.data[0][field] + 1
                }).eq("id", target_id).execute()

        # Return updated counts
        updated = self.supabase.table(table).select("upvotes, downvotes").eq("id", target_id).execute()
        if updated.data:
            return {"upvotes": updated.data[0]["upvotes"], "downvotes": updated.data[0]["downvotes"]}
        return {"upvotes": 0, "downvotes": 0}

    # ==================== BOT ====================

    async def generate_bot_answer(self, post_id: str, question: str) -> Dict[str, Any]:
        """Generate an AI bot answer for a question post."""
        retrieval_service = get_retrieval_service()

        try:
            # Use RAG to generate answer
            answer_data = await retrieval_service.answer_question(
                question=question,
                max_context_chunks=5,
                include_sources=True
            )

            answer_content = answer_data.get("answer", "I couldn't find a relevant answer in the course materials.")
            sources = answer_data.get("sources", [])
            confidence = answer_data.get("confidence", 0.5)

            # Format the answer with sources
            formatted_answer = f"{answer_content}"

            if sources:
                formatted_answer += "\n\n---\n**Sources from course materials:**\n"
                for source in sources[:3]:
                    formatted_answer += f"- {source.get('content_title', 'Unknown')} ({source.get('similarity', 0):.0%} match)\n"

            # Create bot comment
            bot_comment = await self.create_comment(
                post_id=post_id,
                content=formatted_answer,
                author_id=self.bot_user_id,
                is_bot=True
            )

            return {
                "comment": bot_comment,
                "confidence": confidence,
                "sources": sources,
                "generated_at": datetime.utcnow().isoformat()
            }

        except Exception as e:
            print(f"Bot answer generation error: {e}")
            # Create a fallback response
            fallback_content = (
                "I couldn't find a specific answer in the course materials. "
                "This question might be better answered by your classmates or instructor. "
                "You can also try:\n"
                "- Rephrasing your question with more specific terms\n"
                "- Checking the relevant week's materials\n"
                "- Using the AI Search feature for related content"
            )

            bot_comment = await self.create_comment(
                post_id=post_id,
                content=fallback_content,
                author_id=self.bot_user_id,
                is_bot=True
            )

            return {
                "comment": bot_comment,
                "confidence": 0.0,
                "sources": [],
                "generated_at": datetime.utcnow().isoformat()
            }

    async def request_bot_answer(self, post_id: str) -> Dict[str, Any]:
        """Manually request a bot answer for an existing post."""
        post = await self.get_post(post_id, increment_view=False)
        if not post:
            raise Exception("Post not found")

        question = f"{post['title']}\n\n{post['content']}"
        return await self.generate_bot_answer(post_id, question)

    # ==================== HELPERS ====================

    async def _get_user_info(self, user_id: str) -> Dict[str, Any]:
        """Get basic user info."""
        if user_id == self.bot_user_id:
            return {
                "id": self.bot_user_id,
                "username": self.bot_username,
                "role": "bot"
            }

        result = self.supabase.table("users").select("id, username, role").eq("id", user_id).execute()
        if result.data:
            return result.data[0]
        return {"id": user_id, "username": "Unknown", "role": "student"}

    async def get_user_posts(self, user_id: str, page: int = 1, per_page: int = 10) -> Dict[str, Any]:
        """Get posts by a specific user."""
        return await self.get_posts(page=page, per_page=per_page, author_id=user_id)

    async def get_popular_tags(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get most used tags."""
        result = self.supabase.table("forum_posts").select("tags").execute()

        tag_counts = {}
        for post in result.data or []:
            for tag in post.get("tags", []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1

        sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:limit]
        return [{"tag": tag, "count": count} for tag, count in sorted_tags]


# Singleton instance
_forum_service: Optional[ForumService] = None


def get_forum_service() -> ForumService:
    """Get or create forum service instance."""
    global _forum_service
    if _forum_service is None:
        _forum_service = ForumService()
    return _forum_service
