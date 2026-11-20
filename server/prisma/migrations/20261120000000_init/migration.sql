-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(120) NOT NULL,
    `role` ENUM('PATIENT', 'DOCTOR', 'PHARMACIST', 'ADMIN') NOT NULL DEFAULT 'PATIENT',
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `patient_code` VARCHAR(20) NOT NULL,
    `date_of_birth` DATE NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `phone` VARCHAR(30) NULL,
    `blood_type` VARCHAR(5) NULL,
    `height_cm` INTEGER NULL,
    `weight_kg` DECIMAL(5, 1) NULL,
    `allergies` TEXT NULL,
    `chronic_conditions` TEXT NULL,
    `emergency_contact` VARCHAR(160) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `patient_profiles_user_id_key`(`user_id`),
    UNIQUE INDEX `patient_profiles_patient_code_key`(`patient_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `specialization` VARCHAR(120) NOT NULL,
    `license_number` VARCHAR(40) NOT NULL,
    `clinic` VARCHAR(160) NULL,
    `phone` VARCHAR(30) NULL,
    `years_experience` INTEGER NULL,
    `bio` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `doctor_profiles_user_id_key`(`user_id`),
    UNIQUE INDEX `doctor_profiles_license_number_key`(`license_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pharmacy_profiles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `pharmacy_name` VARCHAR(160) NOT NULL,
    `license_number` VARCHAR(40) NOT NULL,
    `address` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pharmacy_profiles_user_id_key`(`user_id`),
    UNIQUE INDEX `pharmacy_profiles_license_number_key`(`license_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `body_areas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(40) NOT NULL,
    `name_en` VARCHAR(60) NOT NULL,
    `name_kk` VARCHAR(60) NOT NULL,
    `side` ENUM('LEFT', 'RIGHT', 'CENTER') NOT NULL DEFAULT 'CENTER',
    `view` ENUM('FRONT', 'BACK', 'BOTH') NOT NULL DEFAULT 'BOTH',
    `description` TEXT NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `body_areas_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `symptom_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `body_area_id` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `started_at` DATE NOT NULL,
    `duration` VARCHAR(60) NOT NULL,
    `intensity` TINYINT NOT NULL,
    `additional_symptoms` TEXT NULL,
    `visited_doctor` BOOLEAN NOT NULL DEFAULT false,
    `visit_details` TEXT NULL,
    `status` ENUM('OPEN', 'UNDER_REVIEW', 'REVIEWED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `symptom_reports_patient_id_created_at_idx`(`patient_id`, `created_at`),
    INDEX `symptom_reports_body_area_id_idx`(`body_area_id`),
    INDEX `symptom_reports_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `report_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `symptom_report_id` INTEGER NOT NULL,
    `original_name` VARCHAR(255) NOT NULL,
    `stored_name` VARCHAR(255) NOT NULL,
    `mime_type` VARCHAR(100) NOT NULL,
    `size_bytes` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `report_attachments_stored_name_key`(`stored_name`),
    INDEX `report_attachments_symptom_report_id_idx`(`symptom_report_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medical_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NOT NULL,
    `symptom_report_id` INTEGER NULL,
    `record_type` ENUM('EXAMINATION', 'CONSULTATION', 'LAB_RESULT', 'FOLLOW_UP') NOT NULL DEFAULT 'EXAMINATION',
    `title` VARCHAR(200) NOT NULL,
    `conclusion` TEXT NOT NULL,
    `recommendations` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `medical_records_patient_id_created_at_idx`(`patient_id`, `created_at`),
    INDEX `medical_records_doctor_id_idx`(`doctor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `doctor_notes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NOT NULL,
    `medical_record_id` INTEGER NULL,
    `symptom_report_id` INTEGER NULL,
    `content` TEXT NOT NULL,
    `visibility` ENUM('SHARED', 'PRIVATE') NOT NULL DEFAULT 'SHARED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `doctor_notes_patient_id_created_at_idx`(`patient_id`, `created_at`),
    INDEX `doctor_notes_doctor_id_idx`(`doctor_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `active_ingredient` VARCHAR(160) NOT NULL,
    `drug_class` VARCHAR(120) NULL,
    `dosage_forms` TEXT NULL,
    `indications` TEXT NOT NULL,
    `contraindications` TEXT NOT NULL,
    `prescription_required` BOOLEAN NOT NULL DEFAULT true,
    `availability_note` VARCHAR(255) NULL,
    `source_name` VARCHAR(160) NOT NULL,
    `source_url` VARCHAR(500) NOT NULL,
    `source_checked_at` DATE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `medications_name_key`(`name`),
    INDEX `medications_active_ingredient_idx`(`active_ingredient`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescriptions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(20) NOT NULL,
    `patient_id` INTEGER NOT NULL,
    `doctor_id` INTEGER NOT NULL,
    `medication_id` INTEGER NOT NULL,
    `medical_record_id` INTEGER NULL,
    `dosage` VARCHAR(120) NOT NULL,
    `frequency` VARCHAR(120) NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `instructions` TEXT NULL,
    `status` ENUM('ACTIVE', 'DISPENSED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `pharmacy_access` BOOLEAN NOT NULL DEFAULT false,
    `issued_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `valid_until` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `prescriptions_code_key`(`code`),
    INDEX `prescriptions_patient_id_idx`(`patient_id`),
    INDEX `prescriptions_doctor_id_idx`(`doctor_id`),
    INDEX `prescriptions_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `patient_consents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `patient_id` INTEGER NOT NULL,
    `grantee_user_id` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
    `note` VARCHAR(255) NULL,
    `granted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,
    `expires_at` DATETIME(3) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `patient_consents_grantee_user_id_status_idx`(`grantee_user_id`, `status`),
    UNIQUE INDEX `patient_consents_patient_id_grantee_user_id_key`(`patient_id`, `grantee_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'info',
    `link` VARCHAR(255) NULL,
    `read_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_read_at_idx`(`user_id`, `read_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activity_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `action` VARCHAR(80) NOT NULL,
    `entity_type` VARCHAR(60) NULL,
    `entity_id` VARCHAR(60) NULL,
    `ip_address` VARCHAR(64) NULL,
    `user_agent` VARCHAR(255) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `activity_logs_user_id_created_at_idx`(`user_id`, `created_at`),
    INDEX `activity_logs_action_idx`(`action`),
    INDEX `activity_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `patient_profiles` ADD CONSTRAINT `patient_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_profiles` ADD CONSTRAINT `doctor_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pharmacy_profiles` ADD CONSTRAINT `pharmacy_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `symptom_reports` ADD CONSTRAINT `symptom_reports_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `symptom_reports` ADD CONSTRAINT `symptom_reports_body_area_id_fkey` FOREIGN KEY (`body_area_id`) REFERENCES `body_areas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `report_attachments` ADD CONSTRAINT `report_attachments_symptom_report_id_fkey` FOREIGN KEY (`symptom_report_id`) REFERENCES `symptom_reports`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medical_records` ADD CONSTRAINT `medical_records_symptom_report_id_fkey` FOREIGN KEY (`symptom_report_id`) REFERENCES `symptom_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_notes` ADD CONSTRAINT `doctor_notes_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_notes` ADD CONSTRAINT `doctor_notes_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_notes` ADD CONSTRAINT `doctor_notes_medical_record_id_fkey` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `doctor_notes` ADD CONSTRAINT `doctor_notes_symptom_report_id_fkey` FOREIGN KEY (`symptom_report_id`) REFERENCES `symptom_reports`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_medication_id_fkey` FOREIGN KEY (`medication_id`) REFERENCES `medications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescriptions` ADD CONSTRAINT `prescriptions_medical_record_id_fkey` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_consents` ADD CONSTRAINT `patient_consents_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `patient_consents` ADD CONSTRAINT `patient_consents_grantee_user_id_fkey` FOREIGN KEY (`grantee_user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activity_logs` ADD CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

