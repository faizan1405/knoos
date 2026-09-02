-- AlterTable Product
ALTER TABLE `Product` ADD COLUMN `costPrice` DOUBLE NULL,
    ADD COLUMN `hsnCode` VARCHAR(50) NULL,
    ADD COLUMN `gstPercentage` DOUBLE NULL,
    ADD COLUMN `packagingLength` DOUBLE NULL,
    ADD COLUMN `packagingBreadth` DOUBLE NULL,
    ADD COLUMN `packagingHeight` DOUBLE NULL,
    ADD COLUMN `packagingWeight` DOUBLE NULL,
    ADD COLUMN `attributes` JSON NULL;

-- AlterTable ProductImage
ALTER TABLE `ProductImage` ADD COLUMN `isVideo` BOOLEAN NOT NULL DEFAULT false;
