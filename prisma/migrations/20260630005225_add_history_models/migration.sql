-- CreateTable
CREATE TABLE `condition_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `livestock_id` INTEGER NOT NULL,
    `condition_type_id` INTEGER NOT NULL,
    `record_date` DATETIME(3) NOT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vaccination_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `livestock_id` INTEGER NOT NULL,
    `vaccine_id` INTEGER NOT NULL,
    `is_vaccinated` BOOLEAN NOT NULL DEFAULT false,
    `vaccination_date` DATETIME(3) NOT NULL,
    `batch_number` VARCHAR(191) NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `condition_histories` ADD CONSTRAINT `condition_histories_livestock_id_fkey` FOREIGN KEY (`livestock_id`) REFERENCES `livestocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `condition_histories` ADD CONSTRAINT `condition_histories_condition_type_id_fkey` FOREIGN KEY (`condition_type_id`) REFERENCES `condition_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vaccination_histories` ADD CONSTRAINT `vaccination_histories_livestock_id_fkey` FOREIGN KEY (`livestock_id`) REFERENCES `livestocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vaccination_histories` ADD CONSTRAINT `vaccination_histories_vaccine_id_fkey` FOREIGN KEY (`vaccine_id`) REFERENCES `vaccines`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
