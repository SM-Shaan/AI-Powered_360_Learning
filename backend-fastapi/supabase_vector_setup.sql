-- Vector Search Setup for AI-Powered Learning Platform (Part 2)
-- Run this in your Supabase SQL Editor AFTER the main setup

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Content chunks table for semantic search
CREATE TABLE IF NOT EXISTS content_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    chunk_index INTEGER NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_type VARCHAR(50) DEFAULT 'text', -- 'text', 'code', 'heading', 'list'
    start_position INTEGER,
    end_position INTEGER,
    embedding VECTOR(768), -- Nomic embed text v1.5 dimension
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add text_content column to content table for full extracted text
ALTER TABLE content ADD COLUMN IF NOT EXISTS text_content TEXT;

-- Add document-level embedding to content table
ALTER TABLE content ADD COLUMN IF NOT EXISTS embedding VECTOR(768);

-- Create indexes for vector similarity search (IVFFlat for better performance)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON content_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_content_embedding ON content
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Regular indexes for filtering
CREATE INDEX IF NOT EXISTS idx_chunks_content_id ON content_chunks(content_id);
CREATE INDEX IF NOT EXISTS idx_chunks_type ON content_chunks(chunk_type);

-- Enable RLS on content_chunks
ALTER TABLE content_chunks ENABLE ROW LEVEL SECURITY;

-- RLS policy for content_chunks
CREATE POLICY "Content chunks are viewable by everyone" ON content_chunks
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert content chunks" ON content_chunks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update content chunks" ON content_chunks
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete content chunks" ON content_chunks
    FOR DELETE USING (true);

-- Function to search similar chunks
CREATE OR REPLACE FUNCTION search_similar_chunks(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10,
    filter_category TEXT DEFAULT NULL,
    filter_content_type TEXT DEFAULT NULL,
    filter_week INT DEFAULT NULL
)
RETURNS TABLE (
    chunk_id UUID,
    content_id UUID,
    chunk_text TEXT,
    chunk_type VARCHAR(50),
    chunk_index INTEGER,
    similarity FLOAT,
    content_title VARCHAR(255),
    content_category VARCHAR(20),
    content_type VARCHAR(20),
    content_topic VARCHAR(255),
    content_week INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cc.id AS chunk_id,
        cc.content_id,
        cc.chunk_text,
        cc.chunk_type,
        cc.chunk_index,
        (1 - (cc.embedding <=> query_embedding))::FLOAT AS similarity,
        c.title AS content_title,
        c.category AS content_category,
        c.content_type,
        c.topic AS content_topic,
        c.week AS content_week
    FROM content_chunks cc
    JOIN content c ON cc.content_id = c.id
    WHERE
        (1 - (cc.embedding <=> query_embedding)) > match_threshold
        AND (filter_category IS NULL OR c.category = filter_category)
        AND (filter_content_type IS NULL OR c.content_type = filter_content_type)
        AND (filter_week IS NULL OR c.week = filter_week)
    ORDER BY cc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Function to search similar content (document level)
CREATE OR REPLACE FUNCTION search_similar_content(
    query_embedding VECTOR(768),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 10,
    filter_category TEXT DEFAULT NULL,
    filter_content_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    content_id UUID,
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(20),
    content_type VARCHAR(20),
    topic VARCHAR(255),
    week INTEGER,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS content_id,
        c.title,
        c.description,
        c.category,
        c.content_type,
        c.topic,
        c.week,
        (1 - (c.embedding <=> query_embedding))::FLOAT AS similarity
    FROM content c
    WHERE
        c.embedding IS NOT NULL
        AND (1 - (c.embedding <=> query_embedding)) > match_threshold
        AND (filter_category IS NULL OR c.category = filter_category)
        AND (filter_content_type IS NULL OR c.content_type = filter_content_type)
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
