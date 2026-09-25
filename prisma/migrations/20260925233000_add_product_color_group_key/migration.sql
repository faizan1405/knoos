-- AlterTable Product: Add colorGroupKey
ALTER TABLE `Product` ADD COLUMN `colorGroupKey` VARCHAR(100) NULL AFTER `color`;

-- CreateIndex
CREATE INDEX `Product_colorGroupKey_idx` ON `Product`(`colorGroupKey`);
