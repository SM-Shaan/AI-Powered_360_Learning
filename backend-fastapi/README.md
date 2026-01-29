# AI-Powered Learning Platform - FastAPI Backend

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Project Settings > API**
3. Copy the following values to your `.env` file:
   - `SUPABASE_URL`: Project URL
   - `SUPABASE_KEY`: anon/public key
   - `SUPABASE_SERVICE_KEY`: service_role key

### 2. Set Up Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy and paste the contents of `supabase_setup.sql`
3. Click **Run** to create the tables

### 3. Set Up Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create a new bucket**
3. Name it: `materials`
4. Check **Public bucket**
5. Click **Create bucket**

### 4. Install Python Dependencies

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 5. Configure Environment

Edit `.env` file with your Supabase credentials:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 6. Run the Server

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use Python directly
python -m app.main
```

### 7. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Health Check: http://localhost:8000/api/health

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Content
- `GET /api/content` - List all content (with filters)
- `GET /api/content/{id}` - Get single content
- `POST /api/content` - Upload content (Admin)
- `PUT /api/content/{id}` - Update content (Admin)
- `DELETE /api/content/{id}` - Delete content (Admin)
- `GET /api/content/{id}/download` - Download file
- `GET /api/content/stats/overview` - Get statistics

## Default Users

After running the SQL setup, you'll have:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Student | student@example.com | student123 |

## Project Structure

```
backend-fastapi/
├── app/
│   ├── core/
│   │   ├── config.py      # Settings & configuration
│   │   ├── security.py    # JWT & authentication
│   │   └── supabase.py    # Supabase client
│   ├── models/
│   │   └── schemas.py     # Pydantic models
│   ├── routes/
│   │   ├── auth.py        # Auth endpoints
│   │   └── content.py     # Content endpoints
│   ├── services/          # Business logic (for Part 2+)
│   └── main.py            # FastAPI app
├── requirements.txt
├── supabase_setup.sql
└── .env
```
