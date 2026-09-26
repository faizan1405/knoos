-- enlarge ProductImage.imageUrl to TEXT so base64 data URLs can be stored persistently
ALTER TABLE `ProductImage` MODIFY COLUMN `imageUrl` TEXT NOT NULL DEFAULT '';
