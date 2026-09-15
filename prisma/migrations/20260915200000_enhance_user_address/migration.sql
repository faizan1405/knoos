-- Enhance User model with phone field
ALTER TABLE User ADD COLUMN phone VARCHAR(20) NULL AFTER name;

-- Enhance Address model with additional fields
ALTER TABLE Address ADD COLUMN label VARCHAR(20) DEFAULT 'HOME' AFTER userId;
ALTER TABLE Address ADD COLUMN addressLine2 VARCHAR(500) NULL AFTER address;
ALTER TABLE Address ADD COLUMN landmark VARCHAR(200) NULL AFTER addressLine2;
ALTER TABLE Address ADD COLUMN country VARCHAR(100) DEFAULT 'India' AFTER state;
ALTER TABLE Address ADD COLUMN isDefault BOOLEAN DEFAULT FALSE AFTER country;

-- Set first address of each user as default
UPDATE Address a
JOIN (
  SELECT userId, MIN(id) as first_id
  FROM Address
  GROUP BY userId
) b ON a.userId = b.userId AND a.id = b.first_id
SET a.isDefault = TRUE;
