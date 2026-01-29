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
