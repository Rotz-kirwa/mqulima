-- Migration 00026: Add missing enum values to show_post_type
ALTER TYPE show_post_type ADD VALUE IF NOT EXISTS 'update';
ALTER TYPE show_post_type ADD VALUE IF NOT EXISTS 'question';
ALTER TYPE show_post_type ADD VALUE IF NOT EXISTS 'tips';
