from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes import auth_router, content_router, generation_router, validation_router, search_router, chat_router, forum_router
from app.core.config import settings
import traceback

app = FastAPI(
    title="AI-Powered Learning Platform API",
    description="Backend API for the AI-Powered Supplementary Learning Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler for debugging
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_detail = str(exc)
    tb = traceback.format_exc()
    print(f"Error: {error_detail}")
    print(f"Traceback: {tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": error_detail, "traceback": tb if settings.debug else None}
    )

# Include routers
app.include_router(auth_router, prefix="/api")
app.include_router(content_router, prefix="/api")
app.include_router(generation_router, prefix="/api")
app.include_router(validation_router, prefix="/api")
app.include_router(search_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(forum_router, prefix="/api")

@app.get("/")
async def root():
    return {
        "message": "AI-Powered Learning Platform API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "ok",
        "message": "AI Learning Platform API is running"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )
