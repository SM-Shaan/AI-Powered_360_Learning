from supabase import create_client, Client
from app.core.config import settings

supabase: Client = None

def get_supabase() -> Client:
    global supabase
    if supabase is None:
        supabase = create_client(settings.supabase_url, settings.supabase_key)
    return supabase

def get_supabase_admin() -> Client:
    """Get Supabase client with service role key for admin operations"""
    return create_client(settings.supabase_url, settings.supabase_service_key)
