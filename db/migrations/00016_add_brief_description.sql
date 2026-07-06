-- Migration: Add brief_description column to products table
ALTER TABLE products ADD COLUMN brief_description TEXT;
