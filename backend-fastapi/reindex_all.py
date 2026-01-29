"""
Reindex all content files for search
Run this script from the backend-fastapi directory:
    python reindex_all.py
"""
import asyncio
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

from supabase import create_client
from app.services.content_processing_service import ContentProcessingService

# Initialize Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

async def reindex_all():
    """Reindex all content files"""
    print("=" * 60)
    print("REINDEXING ALL CONTENT FILES")
    print("=" * 60)

    # Get all content
    result = supabase.table("content").select("id, file_path, file_name, mime_type, title").execute()

    if not result.data:
        print("No content found to process")
        return

    print(f"\nFound {len(result.data)} files to process\n")

    processing_service = ContentProcessingService()

    success_count = 0
    error_count = 0

    for i, content in enumerate(result.data, 1):
        content_id = content["id"]
        file_name = content["file_name"]
        title = content.get("title", file_name)

        print(f"[{i}/{len(result.data)}] Processing: {title}")

        try:
            # Download file from storage
            file_content = supabase.storage.from_("materials").download(content["file_path"])

            # Delete existing chunks for this content
            delete_result = supabase.table("content_chunks").delete().eq("content_id", content_id).execute()
            deleted_count = len(delete_result.data) if delete_result.data else 0
            if deleted_count > 0:
                print(f"    Deleted {deleted_count} existing chunks")

            # Process the content
            processing_result = await processing_service.process_content(
                content_id=content_id,
                file_content=file_content,
                file_name=file_name,
                mime_type=content.get("mime_type", "application/octet-stream")
            )

            chunks_created = processing_result.get("chunks_created", 0)
            print(f"    ✓ Created {chunks_created} chunks")
            success_count += 1

        except Exception as e:
            print(f"    ✗ Error: {str(e)}")
            error_count += 1

    print("\n" + "=" * 60)
    print("REINDEXING COMPLETE")
    print("=" * 60)
    print(f"Successful: {success_count}")
    print(f"Errors: {error_count}")
    print(f"Total: {len(result.data)}")

    # Show chunk statistics
    chunks_result = supabase.table("content_chunks").select("id", count="exact").execute()
    total_chunks = chunks_result.count if hasattr(chunks_result, 'count') else len(chunks_result.data)
    print(f"\nTotal chunks in database: {total_chunks}")

if __name__ == "__main__":
    asyncio.run(reindex_all())
