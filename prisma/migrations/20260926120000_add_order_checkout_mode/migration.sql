-- AlterTable Order: Add checkoutMode column with default 'CART'
ALTER TABLE `Order` ADD COLUMN `checkoutMode` VARCHAR(20) NOT NULL DEFAULT 'CART';
