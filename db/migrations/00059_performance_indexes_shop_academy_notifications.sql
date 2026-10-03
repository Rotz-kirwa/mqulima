-- Migration: 00059_performance_indexes_shop_academy_notifications.sql
-- Description: Composite indexes for products, variants, notifications, courses, chapters, lessons, and services

-- 1. Products Indexes
CREATE INDEX IF NOT EXISTS idx_products_status_featured_updated 
ON products (status, is_featured DESC, updated_at DESC) 
WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_products_slug 
ON products (slug);

CREATE INDEX IF NOT EXISTS idx_products_subcategory 
ON products (subcategory) 
WHERE (deleted_at IS NULL);

-- 2. Product Variants Foreign Key Index (Critical for resolving N+1 / batched IN queries)
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON product_variants (product_id);

-- 3. Notifications Feed Index
CREATE INDEX IF NOT EXISTS idx_notifications_user_created 
ON notifications (user_id, created_at DESC);

-- 4. Academy Catalog & Lessons Indexes
CREATE INDEX IF NOT EXISTS idx_courses_pub_order 
ON courses (is_published, sort_order ASC, created_at DESC) 
WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_course_chapters_course_sort 
ON course_chapters (course_id, sort_order ASC) 
WHERE (is_published = true);

CREATE INDEX IF NOT EXISTS idx_chapter_lessons_chapter_sort 
ON chapter_lessons (chapter_id, sort_order ASC);

-- 5. Services & Categories Indexes
CREATE INDEX IF NOT EXISTS idx_services_cat_name 
ON services (category_id, name ASC);

CREATE INDEX IF NOT EXISTS idx_service_categories_name 
ON service_categories (name ASC);

-- 6. Commodity Price Board Index
CREATE INDEX IF NOT EXISTS idx_cpb_commodity_recorded 
ON commodity_price_board (commodity_id, recorded_at DESC);
