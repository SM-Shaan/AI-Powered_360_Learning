from app.routes.auth import router as auth_router
from app.routes.content import router as content_router
from app.routes.generation import router as generation_router

__all__ = ["auth_router", "content_router", "generation_router"]
