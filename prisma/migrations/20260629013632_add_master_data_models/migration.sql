-- CreateTable
CREATE TABLE `animal_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farm_id` INTEGER NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `animal_types_code_farm_id_key`(`code`, `farm_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `condition_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farm_id` INTEGER NULL,
    `code` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `condition_types_code_farm_id_key`(`code`, `farm_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vaccines` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farm_id` INTEGER NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vaccines_code_farm_id_key`(`code`, `farm_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `animal_types` ADD CONSTRAINT `animal_types_farm_id_fkey` FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `condition_types` ADD CONSTRAINT `condition_types_farm_id_fkey` FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vaccines` ADD CONSTRAINT `vaccines_farm_id_fkey` FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
