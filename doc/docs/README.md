# AI-Powered 360 Learning Platform - Documentation

## Project Overview

An AI-powered supplementary learning platform for university courses that organizes content, enables intelligent retrieval, generates validated learning materials, and provides a conversational interface.

## Documentation Index

| Part | Feature | Status | Documentation |
|------|---------|--------|---------------|
| Part 1 | Content Management System (CMS) | ✅ Complete | [See below](#part-1-cms) |
| Part 2 | Intelligent Search (RAG) | 🔄 Pending | - |
| Part 3 | AI-Generated Learning Materials | ✅ Complete | [PART3_AI_GENERATION.md](./PART3_AI_GENERATION.md) |
| Part 4 | Content Validation & Evaluation | 🔄 Pending | - |
| Part 5 | Conversational Chat Interface | 🔄 Pending | - |

---

## Part 1: CMS

### Features
- File upload (PDF, PPT, code files, notes)
- Content categorization (Theory/Lab)
- Metadata support (topic, week, tags, content type)
- Student browsing and filtering
- Admin content management

### API Endpoints
```
GET    /api/content          - List all content (with filters)
GET    /api/content/{id}     - Get single content
POST   /api/content          - Upload content (Admin)
PUT    /api/content/{id}     - Update content (Admin)
DELETE /api/content/{id}     - Delete content (Admin)
GET    /api/content/stats/overview - Get statistics
```

### Frontend Pages
- `/browse` - Browse and filter materials
- `/upload` - Admin upload interface
- `/dashboard` - Statistics and recent content

---

## Quick Start

### Backend
```bash
cd backend-fastapi
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Access
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## Environment Setup

### Backend (.env)
```env
# Supabase
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-secret-key

# OpenRouter (Part 3)
OPENROUTER_API_KEY=your-openrouter-key
```

---

## Tech Stack

### Backend
- FastAPI (Python)
- Supabase (PostgreSQL + Storage)
- OpenRouter API (Claude AI)

### Frontend
- React 19 + Vite
- Tailwind CSS
- Axios

---

## Default Users

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Student | student@example.com | student123 |
