-- AlterTable
-- Coupon data is snapshotted without a foreign key so historical orders remain immutable.
ALTER TABLE `Order`
    ADD COLUMN `couponCode` VARCHAR(50) COLLATE utf8mb4_unicode_ci NULL AFTER `subtotal`,
    ADD COLUMN `discountAmount` INTEGER NOT NULL DEFAULT 0 AFTER `couponCode`;
