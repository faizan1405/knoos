-- AlterTable
ALTER TABLE `Coupon` ADD COLUMN `reservedCount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `couponReservationActive` BOOLEAN NOT NULL DEFAULT false;
