-- Widen blood_type to fit values like "AB(IV)-"
ALTER TABLE `patient_profiles` MODIFY `blood_type` VARCHAR(10) NULL;
