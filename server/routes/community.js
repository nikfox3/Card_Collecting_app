import express from 'express';
import { query, get, run } from '../utils/database.js';

const router = express.Router();

// Initialize community tables
const initializeCommunityTables = async () => {
  try {
    // Create community_posts table
    await run(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'post',
        images JSON,
        tags JSON,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        shares_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create community_comments table
    await run(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
      )
    `);
    
    // Create community_post_likes table
    await run(`
      CREATE TABLE IF NOT EXISTS community_post_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(post_id, user_id)
      )
    `);
    
    // Create user_follows table
    await run(`
      CREATE TABLE IF NOT EXISTS user_follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id VARCHAR(36) NOT NULL,
        following_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(follower_id, following_id),
        CHECK(follower_id != following_id)
      )
    `);
    
    // Create indexes
    await run('CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON community_posts(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(type)');
    await run('CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts(created_at)');
    await run('CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON community_comments(post_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_community_comments_user_id ON community_comments(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON community_post_likes(post_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON community_post_likes(user_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id)');
    
    // Create triggers for updating counts
    await run(`
      CREATE TRIGGER IF NOT EXISTS update_post_likes_count_insert
      AFTER INSERT ON community_post_likes
      FOR EACH ROW
      BEGIN
        UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
      END
    `);
    
    await run(`
      CREATE TRIGGER IF NOT EXISTS update_post_likes_count_delete
      AFTER DELETE ON community_post_likes
      FOR EACH ROW
      BEGIN
        UPDATE community_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
      END
    `);
    
    await run(`
      CREATE TRIGGER IF NOT EXISTS update_post_comments_count_insert
      AFTER INSERT ON community_comments
      FOR EACH ROW
      BEGIN
        UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
      END
    `);
    
    await run(`
      CREATE TRIGGER IF NOT EXISTS update_post_comments_count_delete
      AFTER DELETE ON community_comments
      FOR EACH ROW
      BEGIN
        UPDATE community_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
      END
    `);
    
    console.log('✅ Community tables initialized');
  } catch (error) {
    console.error('❌ Error initializing community tables:', error.message);
  }
};

// Initialize tables on startup
initializeCommunityTables();

// Helper to get user info
const getUserInfo = async (userId) => {
  const user = await get('SELECT id, username, email FROM users WHERE id = ?', [userId]);
  if (!user) return null;
  
  // Get follower/following counts
  const followerCount = await get(
    'SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?',
    [userId]
  );
  const followingCount = await get(
    'SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?',
    [userId]
  );
  
  return {
    id: user.id,
    name: user.username,
    username: `@${user.username.toLowerCase()}`,
    avatar: null,
    followers: followerCount?.count || 0,
    following: followingCount?.count || 0,
    isFollowing: false // Will be set based on current user
  };
};

// Get all posts
router.get('/posts', async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;
    const currentUserId = req.headers['x-user-id'] || null;
    
    let sql = `
      SELECT 
        p.*,
        u.username,
        u.email
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
    `;
    
    const params = [];
    
    if (type && type !== 'all') {
      sql += ' WHERE p.type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const posts = await query(sql, params);
    
    // Get likes for current user
    const userLikes = currentUserId ? await query(
      'SELECT post_id FROM community_post_likes WHERE user_id = ?',
      [currentUserId]
    ) : [];
    const likedPostIds = new Set(userLikes.map(l => l.post_id));
    
    // Get follow status for current user
    const userFollows = currentUserId ? await query(
      'SELECT following_id FROM user_follows WHERE follower_id = ?',
      [currentUserId]
    ) : [];
    const followingIds = new Set(userFollows.map(f => f.following_id));
    
    // Format posts
    const formattedPosts = await Promise.all(posts.map(async (post) => {
      const author = await getUserInfo(post.user_id);
      if (author && currentUserId) {
        author.isFollowing = followingIds.has(post.user_id);
      }
      
      return {
        id: post.id,
        author,
        content: post.content,
        images: post.images ? JSON.parse(post.images) : [],
        type: post.type,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0,
        createdAt: new Date(post.created_at),
        liked: likedPostIds.has(post.id),
        tags: post.tags ? JSON.parse(post.tags) : []
      };
    }));
    
    res.json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.headers['x-user-id'] || null;
    
    const post = await get(`
      SELECT 
        p.*,
        u.username,
        u.email
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const author = await getUserInfo(post.user_id);
    if (author && currentUserId) {
      const isFollowing = await get(
        'SELECT 1 FROM user_follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, post.user_id]
      );
      author.isFollowing = !!isFollowing;
    }
    
    const isLiked = currentUserId ? await get(
      'SELECT 1 FROM community_post_likes WHERE post_id = ? AND user_id = ?',
      [id, currentUserId]
    ) : false;
    
    // Get comments
    const comments = await query(`
      SELECT 
        c.*,
        u.username,
        u.email
      FROM community_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `, [id]);
    
    const formattedComments = await Promise.all(comments.map(async (comment) => {
      const commentAuthor = await getUserInfo(comment.user_id);
      return {
        id: comment.id,
        author: commentAuthor,
        content: comment.content,
        createdAt: new Date(comment.created_at)
      };
    }));
    
    res.json({
      success: true,
      data: {
        id: post.id,
        author,
        content: post.content,
        images: post.images ? JSON.parse(post.images) : [],
        type: post.type,
        likes: post.likes_count || 0,
        comments: post.comments_count || 0,
        shares: post.shares_count || 0,
        createdAt: new Date(post.created_at),
        liked: !!isLiked,
        tags: post.tags ? JSON.parse(post.tags) : [],
        commentsList: formattedComments
      }
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Create post
router.post('/posts', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { content, type = 'post', images = [], tags = [] } = req.body;
    
    if (!content.trim() && images.length === 0) {
      return res.status(400).json({ error: 'Content or images required' });
    }
    
    const result = await run(
      `INSERT INTO community_posts (user_id, content, type, images, tags) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        content.trim(),
        type,
        JSON.stringify(images),
        JSON.stringify(tags)
      ]
    );
    
    // Get the created post
    const post = await get(`
      SELECT 
        p.*,
        u.username,
        u.email
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [result.lastID]);
    
    const author = await getUserInfo(post.user_id);
    
    res.status(201).json({
      success: true,
      data: {
        id: post.id,
        author,
        content: post.content,
        images: post.images ? JSON.parse(post.images) : [],
        type: post.type,
        likes: 0,
        comments: 0,
        shares: 0,
        createdAt: new Date(post.created_at),
        liked: false,
        tags: post.tags ? JSON.parse(post.tags) : []
      }
    });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Update post
router.put('/posts/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { content } = req.body;
    
    // Check if user owns the post
    const post = await get('SELECT user_id FROM community_posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await run('UPDATE community_posts SET content = ? WHERE id = ?', [content.trim(), id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// Delete post
router.delete('/posts/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Check if user owns the post
    const post = await get('SELECT user_id FROM community_posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (post.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await run('DELETE FROM community_posts WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Like/unlike post
router.post('/posts/:id/like', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Check if already liked
    const existingLike = await get(
      'SELECT id FROM community_post_likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (existingLike) {
      // Unlike
      await run('DELETE FROM community_post_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
      res.json({ success: true, liked: false });
    } else {
      // Like
      await run('INSERT INTO community_post_likes (post_id, user_id) VALUES (?, ?)', [id, userId]);
      res.json({ success: true, liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Add comment
router.post('/posts/:id/comments', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { content } = req.body;
    
    if (!content.trim()) {
      return res.status(400).json({ error: 'Content required' });
    }
    
    // Check if post exists
    const post = await get('SELECT id FROM community_posts WHERE id = ?', [id]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const result = await run(
      'INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [id, userId, content.trim()]
    );
    
    // Get the created comment
    const comment = await query(`
      SELECT 
        c.*,
        u.username,
        u.email
      FROM community_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `, [result.lastID]);
    
    const commentData = comment[0];
    const author = await getUserInfo(commentData.user_id);
    
    res.status(201).json({
      success: true,
      data: {
        id: commentData.id,
        author,
        content: commentData.content,
        createdAt: new Date(commentData.created_at)
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update comment
router.put('/comments/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { content } = req.body;
    
    // Check if user owns the comment
    const comment = await get('SELECT user_id FROM community_comments WHERE id = ?', [id]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await run('UPDATE community_comments SET content = ? WHERE id = ?', [content.trim(), id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/comments/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Check if user owns the comment
    const comment = await get('SELECT user_id FROM community_comments WHERE id = ?', [id]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (comment.user_id !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await run('DELETE FROM community_comments WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Follow/unfollow user
router.post('/users/:id/follow', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    if (userId === id) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Check if already following
    const existingFollow = await get(
      'SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?',
      [userId, id]
    );
    
    if (existingFollow) {
      // Unfollow
      await run('DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?', [userId, id]);
      res.json({ success: true, following: false });
    } else {
      // Follow
      await run('INSERT INTO user_follows (follower_id, following_id) VALUES (?, ?)', [userId, id]);
      res.json({ success: true, following: true });
    }
  } catch (error) {
    console.error('Error toggling follow:', error);
    res.status(500).json({ error: 'Failed to toggle follow' });
  }
});

// Get suggested users
router.get('/users/suggested', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'] || null;
    const limit = parseInt(req.query.limit) || 5;
    
    // Get users with most followers, excluding current user
    let sql = `
      SELECT 
        u.id,
        u.username,
        u.email,
        COUNT(DISTINCT f.follower_id) as follower_count
      FROM users u
      LEFT JOIN user_follows f ON u.id = f.following_id
    `;
    const params = [];
    
    if (userId) {
      sql += ' WHERE u.id != ?';
      params.push(userId);
    }
    
    sql += `
      GROUP BY u.id
      ORDER BY follower_count DESC, u.id
      LIMIT ?
    `;
    params.push(limit);
    
    const users = await query(sql, params);
    
    // Get follow status for current user
    const userFollows = userId ? await query(
      'SELECT following_id FROM user_follows WHERE follower_id = ?',
      [userId]
    ) : [];
    const followingIds = new Set(userFollows.map(f => f.following_id));
    
    const formattedUsers = await Promise.all(users.map(async (user) => {
      const userInfo = await getUserInfo(user.id);
      if (userInfo && userId) {
        userInfo.isFollowing = followingIds.has(user.id);
      }
      return userInfo;
    }));
    
    res.json({ success: true, data: formattedUsers });
  } catch (error) {
    console.error('Error fetching suggested users:', error);
    res.status(500).json({ error: 'Failed to fetch suggested users' });
  }
});

// Get trending topics (placeholder - would need tag analysis)
router.get('/topics/trending', async (req, res) => {
  try {
    // For now, return empty array
    // In future, could analyze tags from posts to get trending topics
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

export default router;

