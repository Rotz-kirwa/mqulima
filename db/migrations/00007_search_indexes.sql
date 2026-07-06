ALTER TABLE products DROP COLUMN IF EXISTS search_vector CASCADE;

ALTER TABLE products 
ADD COLUMN search_vector tsvector 
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(name,'') || ' ' || coalesce(description,'')
  )
) STORED;
CREATE INDEX idx_products_search ON products USING GIN(search_vector);

ALTER TABLE blog_posts DROP COLUMN IF EXISTS search_vector CASCADE;

ALTER TABLE blog_posts
ADD COLUMN search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', 
    coalesce(title,'') || ' ' || coalesce(body,'')
  )
) STORED;
CREATE INDEX idx_blog_search ON blog_posts USING GIN(search_vector);
