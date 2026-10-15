-- Migration: 00064_create_news_comments.sql
-- Description: Creates agritech_news_comments table for reader agronomy discussions, questions, and expert desk responses

CREATE TABLE IF NOT EXISTS agritech_news_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id VARCHAR(255) NOT NULL,
  article_slug VARCHAR(255),
  author_name VARCHAR(255) NOT NULL,
  author_location VARCHAR(255) DEFAULT 'Kenya',
  author_avatar VARCHAR(500),
  content TEXT NOT NULL,
  is_agronomist_reply BOOLEAN DEFAULT FALSE,
  agronomist_title VARCHAR(255),
  parent_id UUID REFERENCES agritech_news_comments(id) ON DELETE CASCADE,
  likes_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization indexes
CREATE INDEX IF NOT EXISTS idx_news_comments_article_id ON agritech_news_comments (article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_comments_article_slug ON agritech_news_comments (article_slug);
CREATE INDEX IF NOT EXISTS idx_news_comments_parent_id ON agritech_news_comments (parent_id);
