-- Applications (өтінімдер) workflow + email verification / password reset / email log.
-- Written to be safe on databases that already contain data.

-- 1) Application fields (nullable first so existing rows can be back-filled)
ALTER TABLE `symptom_reports`
    ADD COLUMN `application_no` VARCHAR(20) NULL,
    ADD COLUMN `contact_name` VARCHAR(120) NULL,
    ADD COLUMN `contact_email` VARCHAR(191) NULL,
    ADD COLUMN `contact_phone` VARCHAR(30) NULL,
    ADD COLUMN `submission_key` VARCHAR(64) NULL,
    ADD COLUMN `status_changed_at` DATETIME(3) NULL,
    ADD COLUMN `admin_seen_at` DATETIME(3) NULL;

-- 2) Status values: widen, map old → new, then narrow
ALTER TABLE `symptom_reports` MODIFY `status` ENUM('OPEN', 'REVIEWED', 'CLOSED', 'NEW', 'UNDER_REVIEW', 'ACCEPTED', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'NEW';
UPDATE `symptom_reports` SET `status` = 'NEW' WHERE `status` = 'OPEN';
UPDATE `symptom_reports` SET `status` = 'COMPLETED' WHERE `status` IN ('REVIEWED', 'CLOSED');
ALTER TABLE `symptom_reports` MODIFY `status` ENUM('NEW', 'UNDER_REVIEW', 'ACCEPTED', 'COMPLETED', 'REJECTED') NOT NULL DEFAULT 'NEW';

-- 3) Back-fill application data for existing rows
UPDATE `symptom_reports` r
    JOIN `patient_profiles` p ON p.`id` = r.`patient_id`
    JOIN `users` u ON u.`id` = p.`user_id`
SET r.`application_no` = CONCAT('APP-', LPAD(r.`id`, 6, '0')),
    r.`contact_name` = u.`full_name`,
    r.`contact_email` = u.`email`,
    r.`contact_phone` = p.`phone`,
    r.`admin_seen_at` = r.`created_at`
WHERE r.`application_no` IS NULL;

ALTER TABLE `symptom_reports`
    MODIFY `application_no` VARCHAR(20) NOT NULL,
    MODIFY `contact_name` VARCHAR(120) NOT NULL,
    MODIFY `contact_email` VARCHAR(191) NOT NULL;

CREATE UNIQUE INDEX `symptom_reports_application_no_key` ON `symptom_reports`(`application_no`);
CREATE UNIQUE INDEX `symptom_reports_submission_key_key` ON `symptom_reports`(`submission_key`);
CREATE INDEX `symptom_reports_admin_seen_at_idx` ON `symptom_reports`(`admin_seen_at`);

-- 4) Email verification on users (existing accounts are treated as verified)
ALTER TABLE `users` ADD COLUMN `email_verified_at` DATETIME(3) NULL;
UPDATE `users` SET `email_verified_at` = `created_at` WHERE `email_verified_at` IS NULL;

-- 5) New tables
CREATE TABLE `email_verifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `code_hash` VARCHAR(128) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `consumed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_verifications_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `password_resets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(128) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `ip_address` VARCHAR(64) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_resets_token_hash_key`(`token_hash`),
    INDEX `password_resets_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `email_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `to_address` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `template` VARCHAR(60) NOT NULL,
    `status` ENUM('SENT', 'FAILED', 'SKIPPED') NOT NULL,
    `error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `email_logs_created_at_idx`(`created_at`),
    INDEX `email_logs_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `email_verifications` ADD CONSTRAINT `email_verifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `password_resets` ADD CONSTRAINT `password_resets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `email_logs` ADD CONSTRAINT `email_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
