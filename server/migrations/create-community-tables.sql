-- Community Posts Database Migration
-- Creates tables for community posts, comments, likes, and follows

-- Community posts table
CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'post', -- 'post', 'question', 'photo'
    images JSON, -- Array of image URLs/data URLs
    tags JSON, -- Array of tags
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    shares_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Post comments table
CREATE TABLE IF NOT EXISTS community_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Post likes table
CREATE TABLE IF NOT EXISTS community_post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(post_id, user_id)
);

-- User follows table
CREATE TABLE IF NOT EXISTS user_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id VARCHAR(36) NOT NULL,
    following_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(follower_id, following_id),
    CHECK(follower_id != following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON community_post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- Update trigger for community_posts table
CREATE TRIGGER IF NOT EXISTS update_community_posts_updated_at 
    AFTER UPDATE ON community_posts
    FOR EACH ROW
    BEGIN
        UPDATE community_posts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Update trigger for community_comments table
CREATE TRIGGER IF NOT EXISTS update_community_comments_updated_at 
    AFTER UPDATE ON community_comments
    FOR EACH ROW
    BEGIN
        UPDATE community_comments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Trigger to update likes_count when a like is added
CREATE TRIGGER IF NOT EXISTS update_post_likes_count_insert
    AFTER INSERT ON community_post_likes
    FOR EACH ROW
    BEGIN
        UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    END;

-- Trigger to update likes_count when a like is removed
CREATE TRIGGER IF NOT EXISTS update_post_likes_count_delete
    AFTER DELETE ON community_post_likes
    FOR EACH ROW
    BEGIN
        UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
    END;

-- Trigger to update comments_count when a comment is added
CREATE TRIGGER IF NOT EXISTS update_post_comments_count_insert
    AFTER INSERT ON community_comments
    FOR EACH ROW
    BEGIN
        UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    END;

-- Trigger to update comments_count when a comment is deleted
CREATE TRIGGER IF NOT EXISTS update_post_comments_count_delete
    AFTER DELETE ON community_comments
    FOR EACH ROW
    BEGIN
        UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END;





