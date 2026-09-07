-- Create Category table
CREATE TABLE Category (
  id VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL,
  isActive BOOLEAN NOT NULL DEFAULT true,
  sortOrder INT NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY Category_name_key (name),
  UNIQUE KEY Category_slug_key (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add categoryId column to Product
ALTER TABLE Product
  ADD COLUMN categoryId VARCHAR(36) NULL AFTER category,
  ADD CONSTRAINT Product_categoryId_fkey
    FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE SET NULL,
  ADD INDEX Product_categoryId_idx (categoryId);

-- Backfill categories from existing Product.category values.
--
-- Normalization rules (mirrors application slugify()):
--   1. lowercase + trim whitespace
--   2. strip non-word chars: [^a-zA-Z0-9_\s-] -> ""
--   3. collapse runs of [\s_] into single "-"
--   4. trim leading/trailing hyphens
--
-- Collision handling:
--   - Casual variants ("Casual", "casual", "Casuals", "casuals", " CASUAL ")
--     all collapse to ONE category: name = "Casuals", slug = "casuals"
--   - Different category names that produce the same slug (e.g. "Men Shoes" and
--     "Men-Shoes" both -> "men-shoes") get a numeric suffix:
--       men-shoes    (first occurrence)
--       men-shoes-1  (second occurrence)
--       men-shoes-2  (third occurrence), etc.
--   - No generic pluralization/singularization is performed.
--
-- The ROW_NUMBER window function assigns a counter per normalized (name, slug)
-- group. The first entry keeps the base slug; subsequent entries get "-N" suffix.
-- This ensures no UNIQUE constraint violation while preserving all distinct
-- categories.
INSERT INTO Category (id, name, slug, isActive, sortOrder, createdAt, updatedAt)
WITH normalized AS (
  SELECT DISTINCT
    CASE
      WHEN TRIM(LOWER(p.category)) IN ('casual', 'casuals') THEN 'Casuals'
      ELSE CONCAT(UPPER(LEFT(TRIM(p.category), 1)), LOWER(SUBSTRING(TRIM(p.category), 2)))
    END AS normalized_name,
    TRIM(BOTH '-' FROM
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          LOWER(TRIM(p.category)),
          '[^a-zA-Z0-9_\\s-]',
          ''
        ),
        '[\\s_]+',
        '-'
      )
    ) AS normalized_slug
  FROM Product p
  WHERE p.category IS NOT NULL AND p.category != ''
),
numbered AS (
  SELECT
    normalized_name,
    normalized_slug,
    ROW_NUMBER() OVER (
      PARTITION BY normalized_name, normalized_slug
      ORDER BY normalized_name
    ) AS row_num
  FROM normalized
)
SELECT
  UUID(),
  n.normalized_name,
  CASE
    WHEN n.row_num = 1 THEN n.normalized_slug
    ELSE CONCAT(n.normalized_slug, '-', n.row_num - 1)
  END,
  true,
  0,
  NOW(),
  NOW()
FROM numbered n;

-- Link existing products to their categories.
-- Each product resolves to a Category by matching its normalized (name, slug)
-- pair, including the collision suffix if applicable.
UPDATE Product p
INNER JOIN Category c ON (
  CASE
    WHEN TRIM(LOWER(p.category)) IN ('casual', 'casuals') THEN
      c.name = 'Casuals' AND c.slug = 'casuals'
    ELSE
      c.name = CONCAT(UPPER(LEFT(TRIM(p.category), 1)), LOWER(SUBSTRING(TRIM(p.category), 2)))
      AND c.slug = TRIM(BOTH '-' FROM REGEXP_REPLACE(REGEXP_REPLACE(LOWER(TRIM(p.category)), '[^a-zA-Z0-9_\\s-]', ''), '[\\s_]+', '-'))
  END
)
SET p.categoryId = c.id
WHERE p.category IS NOT NULL AND p.category != '';
