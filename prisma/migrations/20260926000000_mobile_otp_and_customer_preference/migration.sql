-- AlterTable User: Make email nullable, add index on phone
ALTER TABLE `User` MODIFY COLUMN `email` VARCHAR(191) NULL;
CREATE INDEX `User_phone_idx` ON `User`(`phone`);

-- CreateTable OtpChallenge
CREATE TABLE `OtpChallenge` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `codeHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(0) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `lastSentAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `OtpChallenge_phone_key`(`phone`),
    INDEX `OtpChallenge_phone_idx`(`phone`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable CustomerPreference
CREATE TABLE `CustomerPreference` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `genderPreference` VARCHAR(50) NULL,
    `shoeSize` VARCHAR(20) NULL,
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `CustomerPreference_userId_key`(`userId`),
    INDEX `CustomerPreference_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable PhoneAuthIdentity
CREATE TABLE `PhoneAuthIdentity` (
    `id` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `userId` VARCHAR(36) NOT NULL,
    `verifiedAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `createdAt` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updatedAt` DATETIME(0) NOT NULL,

    UNIQUE INDEX `PhoneAuthIdentity_phone_key`(`phone`),
    UNIQUE INDEX `PhoneAuthIdentity_userId_key`(`userId`),
    INDEX `PhoneAuthIdentity_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CustomerPreference` ADD CONSTRAINT `CustomerPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PhoneAuthIdentity` ADD CONSTRAINT `PhoneAuthIdentity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
