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
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VuHtVqF.GxFdKm',
    'admin'
) ON CONFLICT (email) DO NOTHING;

-- Insert default student user (password: student123)
INSERT INTO users (id, username, email, password, role)
VALUES (
    uuid_generate_v4(),
    'student',
    'student@example.com',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'student'
) ON CONFLICT (email) DO NOTHING;
