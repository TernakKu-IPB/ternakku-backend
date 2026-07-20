/*
  Warnings:

  - You are about to drop the column `farm_id` on the `animal_types` table. All the data in the column will be lost.
  - You are about to drop the column `farm_id` on the `condition_types` table. All the data in the column will be lost.
  - You are about to drop the column `farm_id` on the `vaccines` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `animal_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `condition_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `vaccines` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `animal_types` DROP FOREIGN KEY `animal_types_farm_id_fkey`;

-- DropForeignKey
ALTER TABLE `condition_types` DROP FOREIGN KEY `condition_types_farm_id_fkey`;

-- DropForeignKey
ALTER TABLE `vaccines` DROP FOREIGN KEY `vaccines_farm_id_fkey`;

-- DropIndex
DROP INDEX `animal_types_code_farm_id_key` ON `animal_types`;

-- DropIndex
DROP INDEX `animal_types_farm_id_fkey` ON `animal_types`;

-- DropIndex
DROP INDEX `condition_types_code_farm_id_key` ON `condition_types`;

-- DropIndex
DROP INDEX `condition_types_farm_id_fkey` ON `condition_types`;

-- DropIndex
DROP INDEX `vaccines_code_farm_id_key` ON `vaccines`;

-- DropIndex
DROP INDEX `vaccines_farm_id_fkey` ON `vaccines`;

-- AlterTable
ALTER TABLE `animal_types` DROP COLUMN `farm_id`;

-- AlterTable
ALTER TABLE `condition_types` DROP COLUMN `farm_id`;

-- AlterTable
ALTER TABLE `vaccines` DROP COLUMN `farm_id`;

-- CreateIndex
CREATE UNIQUE INDEX `animal_types_code_key` ON `animal_types`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `condition_types_code_key` ON `condition_types`(`code`);

-- CreateIndex
CREATE UNIQUE INDEX `vaccines_code_key` ON `vaccines`(`code`);
