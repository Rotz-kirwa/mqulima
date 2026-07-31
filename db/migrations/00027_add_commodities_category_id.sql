-- Migration 00027: Add category_id to commodities table
ALTER TABLE commodities ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL;
