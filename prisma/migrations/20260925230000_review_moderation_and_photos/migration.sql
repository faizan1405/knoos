-- AlterTable Review: Add moderationStatus, customerPhotoUrl, productPhotoUrl
ALTER TABLE `Review`
    ADD COLUMN `moderationStatus` VARCHAR(20) NOT NULL DEFAULT 'PENDING' AFTER `reviewText`,
    ADD COLUMN `customerPhotoUrl` VARCHAR(500) NULL AFTER `moderationStatus`,
    ADD COLUMN `productPhotoUrl` VARCHAR(500) NULL AFTER `customerPhotoUrl`;

-- CreateIndex
CREATE INDEX `Review_moderationStatus_idx` ON `Review`(`moderationStatus`);
CREATE INDEX `Review_productId_moderationStatus_idx` ON `Review`(`productId`, `moderationStatus`);

-- Backfill existing reviews safely:
-- Existing active reviews become APPROVED
UPDATE `Review` SET `moderationStatus` = 'APPROVED' WHERE `isActive` = true;

-- Existing inactive reviews become PENDING (do not classify as REJECTED)
UPDATE `Review` SET `moderationStatus` = 'PENDING' WHERE `isActive` = false OR `isActive` IS NULL;
