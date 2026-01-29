# Application Setup Guide

This guide covers the complete setup process for the AI-Powered Supplementary Learning Platform.

## Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.8+** - Backend runtime
- **Node.js 18+** - Frontend runtime
- **Git** - Version control
- **Supabase Account** - Database and file storage (https://supabase.com)
- **Anthropic API Key** - For AI features (https://console.anthropic.com)

---

## Quick Start

From the project root, run:

```bash
# Install all dependencies (frontend + backend)
npm run install:all

# Start both frontend and backend
npm run dev
```

This starts:
- Backend API at `http://localhost:8000`
- Frontend at `http://localhost:5173`

---

## Detailed Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd AI-Powered_360_learning
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd backend-fastapi
```

#### Create Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in `backend-fastapi/`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-anon-public-key
SUPABASE_SERVICE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Server Configuration
HOST=0.0.0.0
PORT=8000
DEBUG=True

# Anthropic API
ANTHROPIC_API_KEY=your-anthropic-api-key
```

#### Set Up Supabase Database

1. Create a new project at https://supabase.com
2. Go to the SQL Editor in your Supabase dashboard
3. Run the contents of `backend-fastapi/supabase_setup.sql`
4. Create a storage bucket named `materials` (set as public)

#### Run the Backend

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or using Python directly
python -m app.main
```

The API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
```

#### Install Node Dependencies

```bash
npm install
```

#### Run the Frontend

```bash
npm run dev
```

The application will be available at http://localhost:5173

---

## Running Both Services Together

From the project root:

```bash
npm run dev
```

This uses `concurrently` to run both services simultaneously.

---

## Default User Accounts

After running the Supabase setup SQL, these accounts are available:

| Role    | Email               | Password   |
|---------|---------------------|------------|
| Admin   | admin@example.com   | admin123   |
| Student | student@example.com | student123 |

---

## Project Structure

```
AI-Powered_360_learning/
├── backend-fastapi/          # FastAPI backend
│   ├── app/
│   │   ├── main.py           # Application entry point
│   │   ├── core/             # Config, security, database
│   │   ├── models/           # Pydantic schemas
│   │   ├── routes/           # API endpoints
│   │   └── services/         # Business logic
│   ├── requirements.txt      # Python dependencies
│   ├── supabase_setup.sql    # Database schema
│   └── .env.example          # Environment template
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts
│   │   └── services/         # API services
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite configuration
├── doc/                      # Documentation
└── package.json              # Root scripts
```

---

## Available Scripts

### Root Level

| Command              | Description                          |
|----------------------|--------------------------------------|
| `npm run dev`        | Run frontend and backend together    |
| `npm run install:all`| Install all dependencies             |
| `npm run backend`    | Run backend only                     |
| `npm run frontend`   | Run frontend only                    |

### Frontend (`frontend/`)

| Command              | Description                          |
|----------------------|--------------------------------------|
| `npm run dev`        | Start development server             |
| `npm run build`      | Build for production                 |
| `npm run preview`    | Preview production build             |
| `npm run lint`       | Run ESLint                           |

### Backend (`backend-fastapi/`)

| Command                                              | Description              |
|------------------------------------------------------|--------------------------|
| `uvicorn app.main:app --reload`                      | Start with auto-reload   |
| `python -m app.main`                                 | Start server             |

---

## Troubleshooting

### Backend Issues

**"Module not found" errors:**
- Ensure your virtual environment is activated
- Run `pip install -r requirements.txt`

**Supabase connection errors:**
- Verify your `.env` file has correct Supabase credentials
- Check that your Supabase project is running

**Port already in use:**
- Change the PORT in `.env` or stop the conflicting process

### Frontend Issues

**"Cannot find module" errors:**
- Run `npm install` in the frontend directory

**API connection errors:**
- Ensure the backend is running on port 8000
- Check CORS settings if using a different port

---

## Production Deployment

For production:

1. Set `DEBUG=False` in backend `.env`
2. Use a strong, unique `JWT_SECRET`
3. Build the frontend: `npm run build`
4. Serve the frontend build with a static file server
5. Run the backend with a production ASGI server (gunicorn + uvicorn workers)

```bash
# Production backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```
