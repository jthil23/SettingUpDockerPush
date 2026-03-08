-- CreateTable
CREATE TABLE `seasons` (
    `year` INTEGER NOT NULL,
    `wikipedia_url` VARCHAR(500) NOT NULL,

    PRIMARY KEY (`year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `circuits` (
    `circuit_id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `location` VARCHAR(200) NOT NULL,
    `country` VARCHAR(100) NOT NULL,
    `lat` DOUBLE NOT NULL,
    `lng` DOUBLE NOT NULL,
    `image_url` VARCHAR(500) NULL,

    PRIMARY KEY (`circuit_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `driver_id` VARCHAR(100) NOT NULL,
    `code` VARCHAR(10) NULL,
    `number` INTEGER NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `dob` DATE NULL,
    `nationality` VARCHAR(100) NOT NULL,
    `image_url` VARCHAR(500) NULL,

    PRIMARY KEY (`driver_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `constructors` (
    `constructor_id` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `nationality` VARCHAR(100) NOT NULL,
    `color_primary` VARCHAR(7) NULL,
    `color_secondary` VARCHAR(7) NULL,
    `logo_url` VARCHAR(500) NULL,

    PRIMARY KEY (`constructor_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `races` (
    `race_id` INTEGER NOT NULL AUTO_INCREMENT,
    `season` INTEGER NOT NULL,
    `round` INTEGER NOT NULL,
    `circuit_id` VARCHAR(100) NOT NULL,
    `race_name` VARCHAR(200) NOT NULL,
    `date` DATE NOT NULL,
    `time` VARCHAR(20) NULL,
    `fp1_date` DATETIME(3) NULL,
    `fp1_time` VARCHAR(20) NULL,
    `fp2_date` DATETIME(3) NULL,
    `fp2_time` VARCHAR(20) NULL,
    `fp3_date` DATETIME(3) NULL,
    `fp3_time` VARCHAR(20) NULL,
    `quali_date` DATETIME(3) NULL,
    `quali_time` VARCHAR(20) NULL,
    `sprint_date` DATETIME(3) NULL,
    `sprint_time` VARCHAR(20) NULL,

    UNIQUE INDEX `races_season_round_key`(`season`, `round`),
    PRIMARY KEY (`race_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `results` (
    `result_id` INTEGER NOT NULL AUTO_INCREMENT,
    `race_id` INTEGER NOT NULL,
    `driver_id` VARCHAR(100) NOT NULL,
    `constructor_id` VARCHAR(100) NOT NULL,
    `grid` INTEGER NULL,
    `position` INTEGER NULL,
    `position_text` VARCHAR(10) NULL,
    `points` DOUBLE NOT NULL DEFAULT 0,
    `laps` INTEGER NULL,
    `status` VARCHAR(100) NULL,
    `fastest_lap_time` VARCHAR(20) NULL,
    `fastest_lap_rank` INTEGER NULL,

    UNIQUE INDEX `results_race_id_driver_id_key`(`race_id`, `driver_id`),
    PRIMARY KEY (`result_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `qualifying_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `race_id` INTEGER NOT NULL,
    `driver_id` VARCHAR(100) NOT NULL,
    `constructor_id` VARCHAR(100) NOT NULL,
    `position` INTEGER NULL,
    `q1` VARCHAR(20) NULL,
    `q2` VARCHAR(20) NULL,
    `q3` VARCHAR(20) NULL,

    UNIQUE INDEX `qualifying_results_race_id_driver_id_key`(`race_id`, `driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `driver_standings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `race_id` INTEGER NOT NULL,
    `driver_id` VARCHAR(100) NOT NULL,
    `points` DOUBLE NOT NULL DEFAULT 0,
    `position` INTEGER NOT NULL,
    `wins` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `driver_standings_race_id_driver_id_key`(`race_id`, `driver_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `constructor_standings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `race_id` INTEGER NOT NULL,
    `constructor_id` VARCHAR(100) NOT NULL,
    `points` DOUBLE NOT NULL DEFAULT 0,
    `position` INTEGER NOT NULL,
    `wins` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `constructor_standings_race_id_constructor_id_key`(`race_id`, `constructor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `predictions` (
    `prediction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `race_id` INTEGER NOT NULL,
    `predicted_winner` VARCHAR(100) NOT NULL,
    `predicted_podium` JSON NOT NULL,
    `predicted_fastest_lap` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `actual_winner` VARCHAR(100) NULL,
    `actual_podium` JSON NULL,
    `score` INTEGER NULL,

    UNIQUE INDEX `predictions_race_id_key`(`race_id`),
    PRIMARY KEY (`prediction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sync_log` (
    `sync_id` INTEGER NOT NULL AUTO_INCREMENT,
    `entity` VARCHAR(100) NOT NULL,
    `last_synced` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(50) NOT NULL,
    `records_updated` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`sync_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `races` ADD CONSTRAINT `races_season_fkey` FOREIGN KEY (`season`) REFERENCES `seasons`(`year`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `races` ADD CONSTRAINT `races_circuit_id_fkey` FOREIGN KEY (`circuit_id`) REFERENCES `circuits`(`circuit_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `results` ADD CONSTRAINT `results_race_id_fkey` FOREIGN KEY (`race_id`) REFERENCES `races`(`race_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `results` ADD CONSTRAINT `results_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `results` ADD CONSTRAINT `results_constructor_id_fkey` FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`constructor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualifying_results` ADD CONSTRAINT `qualifying_results_race_id_fkey` FOREIGN KEY (`race_id`) REFERENCES `races`(`race_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualifying_results` ADD CONSTRAINT `qualifying_results_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `qualifying_results` ADD CONSTRAINT `qualifying_results_constructor_id_fkey` FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`constructor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_standings` ADD CONSTRAINT `driver_standings_race_id_fkey` FOREIGN KEY (`race_id`) REFERENCES `races`(`race_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `driver_standings` ADD CONSTRAINT `driver_standings_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`driver_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `constructor_standings` ADD CONSTRAINT `constructor_standings_race_id_fkey` FOREIGN KEY (`race_id`) REFERENCES `races`(`race_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `constructor_standings` ADD CONSTRAINT `constructor_standings_constructor_id_fkey` FOREIGN KEY (`constructor_id`) REFERENCES `constructors`(`constructor_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_race_id_fkey` FOREIGN KEY (`race_id`) REFERENCES `races`(`race_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `predictions` ADD CONSTRAINT `predictions_predicted_winner_fkey` FOREIGN KEY (`predicted_winner`) REFERENCES `drivers`(`driver_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
