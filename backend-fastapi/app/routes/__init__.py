from app.routes.auth import router as auth_router
from app.routes.content import router as content_router
from app.routes.generation import router as generation_router
from app.routes.validation import router as validation_router
from app.routes.search import router as search_router

__all__ = ["auth_router", "content_router", "generation_router", "validation_router", "search_router"]
