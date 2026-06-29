-- CreateTable
CREATE TABLE `livestocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `farm_id` INTEGER NOT NULL,
    `tag_id` VARCHAR(191) NULL,
    `name` VARCHAR(191) NULL,
    `picture` VARCHAR(191) NULL,
    `animal_type_id` INTEGER NOT NULL,
    `gender` ENUM('male', 'female') NOT NULL,
    `birth_date` DATETIME(3) NULL,
    `status` ENUM('active', 'sold', 'dead') NOT NULL DEFAULT 'active',
    `father_id` INTEGER NULL,
    `mother_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `livestocks` ADD CONSTRAINT `livestocks_farm_id_fkey` FOREIGN KEY (`farm_id`) REFERENCES `farms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `livestocks` ADD CONSTRAINT `livestocks_animal_type_id_fkey` FOREIGN KEY (`animal_type_id`) REFERENCES `animal_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `livestocks` ADD CONSTRAINT `livestocks_father_id_fkey` FOREIGN KEY (`father_id`) REFERENCES `livestocks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `livestocks` ADD CONSTRAINT `livestocks_mother_id_fkey` FOREIGN KEY (`mother_id`) REFERENCES `livestocks`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
