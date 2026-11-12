
-- ============================================================
-- SOURCE: supabase_setup.sql
-- ============================================================

-- Supabase SQL Setup for AI-Powered Learning Platform
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content table
CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) NOT NULL CHECK (category IN ('theory', 'lab')),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('slides', 'pdf', 'code', 'notes', 'reference')),
    file_path VARCHAR(500),
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    topic VARCHAR(255),
    week INTEGER CHECK (week >= 1 AND week <= 52),
    tags JSONB DEFAULT '[]',
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_category ON content(category);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(content_type);
CREATE INDEX IF NOT EXISTS idx_content_topic ON content(topic);
CREATE INDEX IF NOT EXISTS idx_content_week ON content(week);
CREATE INDEX IF NOT EXISTS idx_content_uploaded_by ON content(uploaded_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_content_updated_at ON content;
CREATE TRIGGER update_content_updated_at
    BEFORE UPDATE ON content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Anyone can read basic user info
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Content policies
-- Anyone can view content
CREATE POLICY "Content is viewable by everyone" ON content
    FOR SELECT USING (true);

-- Only admins can insert content (handled at API level)
CREATE POLICY "Anyone can insert content" ON content
    FOR INSERT WITH CHECK (true);

-- Only admins can update content (handled at API level)
CREATE POLICY "Anyone can update content" ON content
    FOR UPDATE USING (true);

-- Only admins can delete content (handled at API level)
CREATE POLICY "Anyone can delete content" ON content
    FOR DELETE USING (true);

-- Create storage bucket for materials
-- Note: Run this in Supabase Dashboard > Storage > Create new bucket
-- Bucket name: materials
-- Public bucket: Yes (for easy file access)

-- Grant permissions (run in SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

-- Storage policies
-- CREATE POLICY "Anyone can view materials" ON storage.objects
--     FOR SELECT USING (bucket_id = 'materials');

-- CREATE POLICY "Authenticated users can upload materials" ON storage.objects
--     FOR INSERT WITH CHECK (bucket_id = 'materials');

-- CREATE POLICY "Authenticated users can delete materials" ON storage.objects
--     FOR DELETE USING (bucket_id = 'materials');

-- Insert default admin user (password: admin123)
-- Note: The password hash is for 'admin123' - change in production!
INSERT INTO users (id, username, email, password, role)
VALUES (
    uuid_generate_v4(),
    'admin',
    'admin@example.com',
    '$2b$12$2U/o9hv0LW8uAA22mmNt6OHc20Anpo5zjJdC9Kn/m6sPqBLhmd0sW',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default student user (password: student123)
INSERT INTO users (id, username, email, password, role)
VALUES (
    uuid_generate_v4(),
    'student',
    'student@example.com',
    '$2b$12$IUhzdf9epbjjXbLl7KMr/.9cESnPrRqfrxZqNgTON3Np.qC//5k86',
    'student'
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- Handwritten Notes Digitization (Bonus Feature)
-- =====================================================

-- Add columns to content table for handwritten notes
ALTER TABLE content ADD COLUMN IF NOT EXISTS is_handwritten BOOLEAN DEFAULT FALSE;
ALTER TABLE content ADD COLUMN IF NOT EXISTS ocr_text TEXT;
ALTER TABLE content ADD COLUMN IF NOT EXISTS ocr_confidence FLOAT;

-- Index for filtering handwritten notes
CREATE INDEX IF NOT EXISTS idx_content_is_handwritten ON content(is_handwritten);

-- Full-text search on OCR extracted text
CREATE INDEX IF NOT EXISTS idx_content_ocr_text ON content USING gin(to_tsvector('english', COALESCE(ocr_text, '')));

-- Function to search in OCR text
CREATE OR REPLACE FUNCTION search_handwritten_notes(
    search_query TEXT,
    category_filter VARCHAR(20) DEFAULT NULL,
    min_confidence FLOAT DEFAULT 0.3
)
RETURNS TABLE (
    content_id UUID,
    title VARCHAR(255),
    ocr_text TEXT,
    ocr_confidence FLOAT,
    relevance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.ocr_text,
        c.ocr_confidence,
        ts_rank(to_tsvector('english', COALESCE(c.ocr_text, '')), plainto_tsquery('english', search_query)) AS relevance
    FROM content c
    WHERE c.is_handwritten = TRUE
      AND c.ocr_confidence >= min_confidence
      AND (category_filter IS NULL OR c.category = category_filter)
      AND to_tsvector('english', COALESCE(c.ocr_text, '')) @@ plainto_tsquery('english', search_query)
    ORDER BY relevance DESC;
END;
$$;

-- ============================================================
-- SOURCE: supabase_vector_setup.sql
-- ============================================================

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

-- ============================================================
-- SOURCE: supabase_chat_setup.sql
-- ============================================================

-- Chat/Conversations Setup for AI-Powered Learning Platform (Part 5)
-- Run this in your Supabase SQL Editor

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- Trigger to update updated_at on conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view own conversations" ON conversations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own conversations" ON conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own conversations" ON conversations
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own conversations" ON conversations
    FOR DELETE USING (true);

-- RLS Policies for messages
CREATE POLICY "Users can view messages" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete messages" ON messages
    FOR DELETE USING (true);

-- ============================================================
-- SOURCE: supabase_forum_setup.sql
-- ============================================================

-- =====================================================
-- Community Forum & Bot Support Database Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- Forum Posts table
CREATE TABLE IF NOT EXISTS forum_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    post_type VARCHAR(20) NOT NULL DEFAULT 'question' CHECK (post_type IN ('question', 'discussion', 'resource', 'announcement')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tags JSONB DEFAULT '[]',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    has_accepted_answer BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forum Comments table
CREATE TABLE IF NOT EXISTS forum_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id VARCHAR(50) NOT NULL, -- Can be UUID or 'bot-assistant'
    is_bot BOOLEAN DEFAULT FALSE,
    is_accepted_answer BOOLEAN DEFAULT FALSE,
    parent_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Forum Votes table (tracks user votes on posts/comments)
CREATE TABLE IF NOT EXISTS forum_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES forum_posts(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT vote_target CHECK (
        (post_id IS NOT NULL AND comment_id IS NULL) OR
        (post_id IS NULL AND comment_id IS NOT NULL)
    ),
    CONSTRAINT unique_post_vote UNIQUE (user_id, post_id),
    CONSTRAINT unique_comment_vote UNIQUE (user_id, comment_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON forum_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_type ON forum_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_forum_posts_status ON forum_posts(status);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON forum_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_posts_tags ON forum_posts USING gin(tags);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_author ON forum_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent ON forum_comments(parent_id);

CREATE INDEX IF NOT EXISTS idx_forum_votes_user ON forum_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_post ON forum_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_votes_comment ON forum_votes(comment_id);

-- Function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count(post_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE forum_posts
    SET comment_count = comment_count + 1
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement comment count
CREATE OR REPLACE FUNCTION decrement_comment_count(post_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE forum_posts
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_forum_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_forum_posts_updated_at ON forum_posts;
CREATE TRIGGER update_forum_posts_updated_at
    BEFORE UPDATE ON forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_updated_at();

DROP TRIGGER IF EXISTS update_forum_comments_updated_at ON forum_comments;
CREATE TRIGGER update_forum_comments_updated_at
    BEFORE UPDATE ON forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_forum_updated_at();

-- Row Level Security
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_votes ENABLE ROW LEVEL SECURITY;

-- Policies for forum_posts
CREATE POLICY "Forum posts are viewable by everyone" ON forum_posts
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create posts" ON forum_posts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own posts" ON forum_posts
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own posts" ON forum_posts
    FOR DELETE USING (true);

-- Policies for forum_comments
CREATE POLICY "Forum comments are viewable by everyone" ON forum_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON forum_comments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own comments" ON forum_comments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own comments" ON forum_comments
    FOR DELETE USING (true);

-- Policies for forum_votes
CREATE POLICY "Forum votes are viewable by everyone" ON forum_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can vote" ON forum_votes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own votes" ON forum_votes
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own votes" ON forum_votes
    FOR DELETE USING (true);

-- Full-text search on posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_search ON forum_posts
    USING gin(to_tsvector('english', title || ' ' || content));

-- Function to search forum posts
CREATE OR REPLACE FUNCTION search_forum_posts(
    search_query TEXT,
    type_filter VARCHAR(20) DEFAULT NULL,
    status_filter VARCHAR(20) DEFAULT NULL,
    tag_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    content TEXT,
    post_type VARCHAR(20),
    status VARCHAR(20),
    author_id UUID,
    tags JSONB,
    upvotes INTEGER,
    view_count INTEGER,
    comment_count INTEGER,
    has_accepted_answer BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    relevance REAL
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.title,
        p.content,
        p.post_type,
        p.status,
        p.author_id,
        p.tags,
        p.upvotes,
        p.view_count,
        p.comment_count,
        p.has_accepted_answer,
        p.created_at,
        ts_rank(to_tsvector('english', p.title || ' ' || p.content), plainto_tsquery('english', search_query)) AS relevance
    FROM forum_posts p
    WHERE
        (search_query IS NULL OR to_tsvector('english', p.title || ' ' || p.content) @@ plainto_tsquery('english', search_query))
        AND (type_filter IS NULL OR p.post_type = type_filter)
        AND (status_filter IS NULL OR p.status = status_filter)
        AND (tag_filter IS NULL OR p.tags ? tag_filter)
    ORDER BY relevance DESC, p.created_at DESC;
END;
$$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
