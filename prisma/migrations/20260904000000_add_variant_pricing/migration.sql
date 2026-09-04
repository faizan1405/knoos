-- AlterTable
ALTER TABLE `ProductVariant` ADD COLUMN `price` Int NOT NULL DEFAULT 0;
ALTER TABLE `ProductVariant` ADD COLUMN `salePrice` Int NULL;
