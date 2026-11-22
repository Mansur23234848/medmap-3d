-- =====================================================================
-- MEDMAP 3D - DATABASE_SETUP.sql
-- Толық деректер базасы: 17 кесте + демо деректер (барлығы ойдан шығарылған).
--
-- phpMyAdmin: http://localhost/phpmyadmin -> «Импорт» -> осы файлды таңдап «Go».
-- Немесе командалық жол (XAMPP Shell):  mysql -u root -P 3307 < DATABASE_SETUP.sql
-- (MySQL портын C:/xampp/mysql/bin/my.ini ішінен қараңыз: port=...)
--
-- Демо логиндер: DEMO_ACCOUNTS.md. Құпиясөздер bcrypt хеші түрінде сақталған.
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `medmap3d` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `medmap3d`;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('1706b5e1-71ed-402d-a08b-bfc9af4bedde','87e7b9b8b0e43492daa1c65a055875e3bce23adb678804701b2b677847926f18','2026-11-22 16:11:05.016','20261122000000_applications_email',NULL,NULL,'2026-11-22 16:11:04.834',1),('33d8d978-9f91-4ab4-b13d-f7927d084684','8ce6edb52539eaef06b67b5cc52b156521637c083f1571d1b633d4276720cea6','2026-11-20 13:51:11.795','20261120000000_init',NULL,NULL,'2026-11-20 13:51:11.194',1),('dd138d6e-6ec6-49a8-9663-d679537ec4e7','0d0f97151349e926a0ebbb0cbd0756910078ef3e2e70a3ca36353e06c82d410a','2026-11-20 13:58:30.337','20261120010000_blood_type_len',NULL,NULL,'2026-11-20 13:58:30.324',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(80) NOT NULL,
  `entity_type` varchar(60) DEFAULT NULL,
  `entity_id` varchar(60) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `activity_logs_user_id_created_at_idx` (`user_id`,`created_at`),
  KEY `activity_logs_action_idx` (`action`),
  KEY `activity_logs_created_at_idx` (`created_at`),
  CONSTRAINT `activity_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (83,NULL,'system.seeded','system',NULL,NULL,NULL,'{\"synthetic\":true}','2026-11-22 16:30:03.228');
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `body_areas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `body_areas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(40) NOT NULL,
  `name_en` varchar(60) NOT NULL,
  `name_kk` varchar(60) NOT NULL,
  `side` enum('LEFT','RIGHT','CENTER') NOT NULL DEFAULT 'CENTER',
  `view` enum('FRONT','BACK','BOTH') NOT NULL DEFAULT 'BOTH',
  `description` text NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `body_areas_slug_key` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=106 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `body_areas` WRITE;
/*!40000 ALTER TABLE `body_areas` DISABLE KEYS */;
INSERT INTO `body_areas` VALUES (85,'head','Head','Бас','CENTER','BOTH','Бас сүйегі (краниум) мен бет сүйектерінен тұрады. Ішінде ми, көру, есту, иіс және дәм сезу мүшелері орналасқан.',0,'2026-11-22 16:30:01.646'),(86,'neck','Neck','Мойын','CENTER','BOTH','Жеті мойын омыртқасы (C1–C7), кеңірдек, өңеш, қалқанша без және басқа қан тамырлары өтетін аймақ.',1,'2026-11-22 16:30:01.646'),(87,'chest','Chest','Кеуде','CENTER','FRONT','Төс сүйегі мен қабырғалардан құралған кеуде қуысы. Ішінде жүрек, өкпе және ірі қан тамырлары орналасқан.',2,'2026-11-22 16:30:01.646'),(88,'abdomen','Abdomen','Іш','CENTER','FRONT','Көкет пен жамбас арасындағы аймақ. Асқазан, бауыр, ішек, ұйқы безі сияқты ас қорыту мүшелері орналасқан.',3,'2026-11-22 16:30:01.646'),(89,'upper_back','Upper Back','Арқаның жоғарғы бөлігі','CENTER','BACK','Кеуде омыртқалары (T1–T12), жауырындар және арқаның жоғарғы бұлшықеттері (трапеция, ромб тәрізді бұлшықеттер).',4,'2026-11-22 16:30:01.646'),(90,'lower_back','Lower Back','Бел','CENTER','BACK','Бел омыртқалары (L1–L5) мен оларды қоршаған бұлшықеттер. Дененің салмағын көтеретін негізгі тірек аймағы.',5,'2026-11-22 16:30:01.646'),(91,'left_shoulder','Left Shoulder','Сол иық','LEFT','BOTH','Иық буыны тоқпан жілік, жауырын және бұғана сүйектерінен түзіледі. Айналмалы манжета бұлшықеттері қозғалысты қамтамасыз етеді.',6,'2026-11-22 16:30:01.646'),(92,'right_shoulder','Right Shoulder','Оң иық','RIGHT','BOTH','Иық буыны тоқпан жілік, жауырын және бұғана сүйектерінен түзіледі. Айналмалы манжета бұлшықеттері қозғалысты қамтамасыз етеді.',7,'2026-11-22 16:30:01.646'),(93,'left_arm','Left Arm','Сол қол','LEFT','BOTH','Иық пен білек бөліктері: тоқпан жілік, кәрі жілік және шынтақ жілігі, сондай-ақ бүгу мен жазу бұлшықеттері.',8,'2026-11-22 16:30:01.646'),(94,'right_arm','Right Arm','Оң қол','RIGHT','BOTH','Иық пен білек бөліктері: тоқпан жілік, кәрі жілік және шынтақ жілігі, сондай-ақ бүгу мен жазу бұлшықеттері.',9,'2026-11-22 16:30:01.646'),(95,'left_elbow','Left Elbow','Сол шынтақ','LEFT','BOTH','Тоқпан жілік, кәрі жілік және шынтақ жілігі түйісетін топса тәрізді буын. Қолды бүгуге және бұруға мүмкіндік береді.',10,'2026-11-22 16:30:01.646'),(96,'right_elbow','Right Elbow','Оң шынтақ','RIGHT','BOTH','Тоқпан жілік, кәрі жілік және шынтақ жілігі түйісетін топса тәрізді буын. Қолды бүгуге және бұруға мүмкіндік береді.',11,'2026-11-22 16:30:01.646'),(97,'left_hand','Left Hand','Сол қол басы','LEFT','BOTH','Білезік, алақан және саусақтар: 27 сүйек, көптеген ұсақ буындар мен сіңірлер нәзік қозғалысты қамтамасыз етеді.',12,'2026-11-22 16:30:01.646'),(98,'right_hand','Right Hand','Оң қол басы','RIGHT','BOTH','Білезік, алақан және саусақтар: 27 сүйек, көптеген ұсақ буындар мен сіңірлер нәзік қозғалысты қамтамасыз етеді.',13,'2026-11-22 16:30:01.646'),(99,'pelvis','Pelvis','Жамбас','CENTER','BOTH','Жамбас сүйектері мен сегізкөз құрайтын сақина. Қуық, жыныс мүшелері және тік ішек осы аймақта орналасқан.',14,'2026-11-22 16:30:01.646'),(100,'left_leg','Left Leg','Сол аяқ','LEFT','BOTH','Сан және сирақ бөліктері: ортан жілік, асықты жілік, шыбық жілік және аяқтың ірі бұлшықеттері.',15,'2026-11-22 16:30:01.646'),(101,'right_leg','Right Leg','Оң аяқ','RIGHT','BOTH','Сан және сирақ бөліктері: ортан жілік, асықты жілік, шыбық жілік және аяқтың ірі бұлшықеттері.',16,'2026-11-22 16:30:01.646'),(102,'left_knee','Left Knee','Сол тізе','LEFT','BOTH','Дененің ең ірі буыны: ортан жілік, асықты жілік және тізе тостағаны. Мениск пен байламдар тұрақтылықты қамтамасыз етеді.',17,'2026-11-22 16:30:01.646'),(103,'right_knee','Right Knee','Оң тізе','RIGHT','BOTH','Дененің ең ірі буыны: ортан жілік, асықты жілік және тізе тостағаны. Мениск пен байламдар тұрақтылықты қамтамасыз етеді.',18,'2026-11-22 16:30:01.646'),(104,'left_foot','Left Foot','Сол табан','LEFT','BOTH','Тілерсек, табан және башпай сүйектері (26 сүйек). Табан күмбезі жүру кезінде салмақты біркелкі бөледі.',19,'2026-11-22 16:30:01.646'),(105,'right_foot','Right Foot','Оң табан','RIGHT','BOTH','Тілерсек, табан және башпай сүйектері (26 сүйек). Табан күмбезі жүру кезінде салмақты біркелкі бөледі.',20,'2026-11-22 16:30:01.646');
/*!40000 ALTER TABLE `body_areas` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `doctor_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctor_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `medical_record_id` int(11) DEFAULT NULL,
  `symptom_report_id` int(11) DEFAULT NULL,
  `content` text NOT NULL,
  `visibility` enum('SHARED','PRIVATE') NOT NULL DEFAULT 'SHARED',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `doctor_notes_patient_id_created_at_idx` (`patient_id`,`created_at`),
  KEY `doctor_notes_doctor_id_idx` (`doctor_id`),
  KEY `doctor_notes_medical_record_id_fkey` (`medical_record_id`),
  KEY `doctor_notes_symptom_report_id_fkey` (`symptom_report_id`),
  CONSTRAINT `doctor_notes_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `doctor_notes_medical_record_id_fkey` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `doctor_notes_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `doctor_notes_symptom_report_id_fkey` FOREIGN KEY (`symptom_report_id`) REFERENCES `symptom_reports` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `doctor_notes` WRITE;
/*!40000 ALTER TABLE `doctor_notes` DISABLE KEYS */;
INSERT INTO `doctor_notes` VALUES (10,15,9,NULL,32,'Иық бойынша өтінім қаралуда. Келесі қабылдауда қозғалыс амплитудасын тексереміз.','SHARED','2026-11-16 05:15:00.000','2026-11-22 16:30:03.180'),(11,15,9,NULL,NULL,'Жеке жазба (тек дәрігерге көрінеді): келесі визитте отыру эргономикасын талқылау.','PRIVATE','2026-11-16 05:15:00.000','2026-11-22 16:30:03.185'),(12,17,9,NULL,31,'Өтінім қабылданды. Жүгіру жүктемесін уақытша азайтып, 3 күннен кейін жағдайыңызды жазыңыз.','SHARED','2026-11-17 05:15:00.000','2026-11-22 16:30:03.189');
/*!40000 ALTER TABLE `doctor_notes` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `doctor_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctor_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `specialization` varchar(120) NOT NULL,
  `license_number` varchar(40) NOT NULL,
  `clinic` varchar(160) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `years_experience` int(11) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctor_profiles_user_id_key` (`user_id`),
  UNIQUE KEY `doctor_profiles_license_number_key` (`license_number`),
  CONSTRAINT `doctor_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `doctor_profiles` WRITE;
/*!40000 ALTER TABLE `doctor_profiles` DISABLE KEYS */;
INSERT INTO `doctor_profiles` VALUES (9,32,'Жалпы тәжірибелік дәрігер','DEMO-DOC-0001','MEDMAP Демо Клиникасы','+7 700 000 00 01',12,'Демонстрациялық дәрігер профилі.','2026-11-22 16:30:02.660','2026-11-22 16:30:02.660'),(10,33,'Невролог','DEMO-DOC-0002','MEDMAP Демо Клиникасы',NULL,8,NULL,'2026-11-22 16:30:02.664','2026-11-22 16:30:02.664');
/*!40000 ALTER TABLE `doctor_profiles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `to_address` varchar(191) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `template` varchar(60) NOT NULL,
  `status` enum('SENT','FAILED','SKIPPED') NOT NULL,
  `error` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `email_logs_created_at_idx` (`created_at`),
  KEY `email_logs_status_idx` (`status`),
  KEY `email_logs_user_id_fkey` (`user_id`),
  CONSTRAINT `email_logs_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `email_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `code_hash` varchar(128) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `consumed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `email_verifications_user_id_created_at_idx` (`user_id`,`created_at`),
  CONSTRAINT `email_verifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `email_verifications` WRITE;
/*!40000 ALTER TABLE `email_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_verifications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `medical_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medical_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `symptom_report_id` int(11) DEFAULT NULL,
  `record_type` enum('EXAMINATION','CONSULTATION','LAB_RESULT','FOLLOW_UP') NOT NULL DEFAULT 'EXAMINATION',
  `title` varchar(200) NOT NULL,
  `conclusion` text NOT NULL,
  `recommendations` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `medical_records_patient_id_created_at_idx` (`patient_id`,`created_at`),
  KEY `medical_records_doctor_id_idx` (`doctor_id`),
  KEY `medical_records_symptom_report_id_fkey` (`symptom_report_id`),
  CONSTRAINT `medical_records_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `medical_records_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `medical_records_symptom_report_id_fkey` FOREIGN KEY (`symptom_report_id`) REFERENCES `symptom_reports` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `medical_records` WRITE;
/*!40000 ALTER TABLE `medical_records` DISABLE KEYS */;
INSERT INTO `medical_records` VALUES (8,15,9,29,'EXAMINATION','Бел аймағын тексеру (демо)','Демонстрациялық қорытынды: физикалық тексеру кезінде бел бұлшықеттерінің керілуі анықталды. Неврологиялық белгілер байқалмады.','Ұзақ отырғанда әр 45 минут сайын үзіліс жасау, жеңіл созылу жаттығулары, 2 аптадан кейін қайта қаралу.','2026-11-12 05:15:00.000','2026-11-22 16:30:03.168'),(9,18,10,30,'CONSULTATION','Мойын аймағы бойынша кеңес (демо)','Демонстрациялық қорытынды: мойын бұлшықеттерінің статикалық жүктемеден шаршауы. Қызыл жалау белгілері анықталмады.','Жұмыс орнының эргономикасын түзету, күнделікті жеңіл жаттығулар.','2026-11-14 05:15:00.000','2026-11-22 16:30:03.173');
/*!40000 ALTER TABLE `medical_records` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `medications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `medications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `active_ingredient` varchar(160) NOT NULL,
  `drug_class` varchar(120) DEFAULT NULL,
  `dosage_forms` text DEFAULT NULL,
  `indications` text NOT NULL,
  `contraindications` text NOT NULL,
  `prescription_required` tinyint(1) NOT NULL DEFAULT 1,
  `availability_note` varchar(255) DEFAULT NULL,
  `source_name` varchar(160) NOT NULL,
  `source_url` varchar(500) NOT NULL,
  `source_checked_at` date NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `medications_name_key` (`name`),
  KEY `medications_active_ingredient_idx` (`active_ingredient`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `medications` WRITE;
/*!40000 ALTER TABLE `medications` DISABLE KEYS */;
INSERT INTO `medications` VALUES (25,'Paracetamol','Paracetamol','Анальгетик / қызу түсіретін','Таблетка және капсула (500 мг, 1 г); ішетін суспензия (250 мг/5 мл, 500 мг/5 мл); суппозиторий (500 мг, 1 г)','Ауырсынуды басатын және дене қызуын түсіретін дәрі. Бас ауруы, буындардың ісінуі мен құрысуы, қызуы бар суық тию немесе тұмау белгілері, тіс ауруы, тамақ ауруы кезінде қолданылады.','• Бұрын парацетамолға аллергиялық реакция болса жарамайды\n• Бүйрек немесе бауыр ауруы болса\n• Алкогольге тәуелділік немесе шамадан тыс ішімдік қолдану\n• Дәрігер айтпаса, 3 күннен артық қабылдамау\n• Құрамында парацетамол бар басқа дәрілермен бірге қабылдамау\n• Өзара әрекеттесу: метоклопрамид, домперидон, варфарин, флуклоксациллин',0,'Ұлыбританияда: көбі дәріхана мен дүкенде рецептсіз, кейбір түрлері рецеппен','NHS (UK) — Paracetamol for adults','https://www.nhs.uk/medicines/paracetamol-for-adults/','2026-11-20',1,'2026-11-22 16:30:01.653','2026-11-22 16:30:01.653'),(26,'Ibuprofen','Ibuprofen','Қабынуға қарсы стероидты емес дәрі (ҚҚСД)','Таблетка және капсула (200 мг, 400 мг); гель немесе спрей; сұйық түрі; суда ерітетін түйіршіктер','Ауырсынуды басатын, қабынуды азайтатын және қызуды түсіре алатын ҚҚСД. Бас ауруы мен мигрень, буын және бұлшықет ауруы, жарақаттан кейінгі ауырсыну, тіс ауруы, етеккір кезіндегі ауырсыну кезінде қолданылады.','• Ибупрофенге, аспиринге немесе басқа ҚҚСД-ға аллергия\n• Асқазан жарасы (қазір немесе бұрын)\n• Демікпе немесе шөп безгегі сияқты аллергиялар\n• Желшешек\n• Жүрек, бауыр немесе бүйрек ауруы\n• Қан ұюының бұзылуы, бұрын болған инсульт\n• Жүктілік кезінде (дәрігер кеңес бермесе)\n• Басқа ҚҚСД-мен (напроксен, аспирин) бірге қабылдамау\n• Өзара әрекеттесу: варфарин сияқты антикоагулянттар, стероидтар, антидепрессанттар, кейбір қан қысымы дәрілері',0,'Ұлыбританияда: көбі рецептсіз, кейбір түрлері рецеппен','NHS (UK) — Ibuprofen for adults','https://www.nhs.uk/medicines/ibuprofen-for-adults/','2026-11-20',1,'2026-11-22 16:30:01.653','2026-11-22 16:30:01.653'),(27,'Amoxicillin','Amoxicillin','Пенициллин тобындағы антибиотик','Капсула; ішетін сұйық түрі; инъекция (әдетте тек ауруханада)','Бактериялық инфекцияларды емдеуге арналған антибиотик: кеуде инфекциялары (соның ішінде пневмония), тіс абсцесі; балалардағы құлақ инфекциялары; басқа антибиотиктермен бірге асқазан жарасын емдеуде қолданылады.','• Амоксициллинге, пенициллинге немесе басқа дәріге бұрын аллергиялық реакция болса — алдымен дәрігерге айту\n• Бауыр немесе бүйрек ауруы\n• Жақын арада қан не зәр талдауы болса (нәтижеге әсер етуі мүмкін)\n• Жақында немесе жоспарланған вакцинация\n• Жұқпалы мононуклеоз (бөртпе тудыруы мүмкін)',1,'Ұлыбританияда: тек рецеппен','NHS (UK) — Amoxicillin','https://www.nhs.uk/medicines/amoxicillin/','2026-11-20',1,'2026-11-22 16:30:01.653','2026-11-22 16:30:01.653'),(28,'Omeprazole','Omeprazole','Протон помпасының тежегіші (ППТ)','Таблетка, капсула, ішетін сұйық түрі; суда еритін таблеткалар','Асқазан қышқылын азайтатын дәрі. Асқазан жарасы, қыжыл, гастроэзофагеальды рефлюкс ауруы, H. pylori инфекциясы (антибиотиктермен бірге) кезінде қолданылады.','• Омепразолға немесе басқа ППТ-ға бұрын аллергия не ауыр жанама әсер\n• Бүйрек немесе бауыр ауруы\n• Остеопороз\n• Рецептсіз таблеткалар тек 18 жастан асқандарға; рецептсіз 2 аптадан артық қабылдамау\n• Кейбір талдау нәтижелеріне әсер етуі мүмкін\n• Өзара әрекеттесу: лансопразол, фамотидин, дигоксин, варфарин, клопидогрел, диазепам, фенитоин, шайқурай, нелфинавир, атазанавир',1,'Ұлыбританияда: көбі рецеппен, кейбір түрлері дәріханада рецептсіз','NHS (UK) — Omeprazole','https://www.nhs.uk/medicines/omeprazole/','2026-11-20',1,'2026-11-22 16:30:01.653','2026-11-22 16:30:01.653'),(29,'Cetirizine','Cetirizine','Антигистамин (ұйқы келтірмейтін)','Таблетка; ішетін сұйық түрі','Аллергия белгілерін жеңілдететін антигистамин: шөп безгегі, конъюнктивит, экзема, есекжем, жәндік шаққаннан кейінгі реакциялар, кейбір тағам аллергиялары.','• Цетиризинге немесе басқа дәріге бұрын аллергиялық реакция\n• Тағамдық қоспаларға аллергия\n• Бүйрек жеткіліксіздігі\n• Эпилепсия немесе құрысу қаупі\n• Зәр шығарудың қиындауы\n• Аллергиялық тест алдында бірнеше күн бұрын тоқтату қажет болуы мүмкін\n• Ұйқышылдық тудыруы мүмкін — бұл жағдайда көлік жүргізбеу',0,'Ұлыбританияда: рецеппен де, дәріхана мен дүкенде рецептсіз де','NHS (UK) — Cetirizine','https://www.nhs.uk/medicines/cetirizine/','2026-11-20',1,'2026-11-22 16:30:01.653','2026-11-22 16:30:01.653'),(30,'Metformin','Metformin','Қант диабетіне қарсы дәрі (бигуанид)','Таблетка; ішетін ерітінді; суда араластыратын ұнтақ','2 типті қант диабетін емдеуде (жеке немесе басқа диабет дәрілерімен бірге), жүктілік диабетінде, PMOS (бұрынғы PCOS) белгілерінде және 1 типті диабетте инсулинмен бірге қолданылады.','• Метформинге бұрын аллергия немесе ауыр жанама әсер\n• Бауыр немесе бүйрек ауруы\n• Ауыр инфекция (мысалы, өкпе не бүйрек)\n• Жүрек жеткіліксіздігі\n• Алкогольді көп тұтыну\n• Құсу, диарея не қызба кезінде сусыздану қаупі\n• Өзара әрекеттесу: диуретиктер, ибупрофен мен диклофенак сияқты ҚҚСД, кейбір қан қысымы дәрілері',1,'Ұлыбританияда: тек рецеппен','NHS (UK) — Metformin','https://www.nhs.uk/medicines/metformin/','2026-11-20',1,'2026-11-22 16:30:01.653','2026-11-22 16:30:01.653');
/*!40000 ALTER TABLE `medications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(160) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(30) NOT NULL DEFAULT 'info',
  `link` varchar(255) DEFAULT NULL,
  `read_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `notifications_user_id_read_at_idx` (`user_id`,`read_at`),
  CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (31,35,'Дәрігер қорытындысы','Нұрлан Әбенов: «Бел аймағын тексеру (демо)»','success','/app/history',NULL,'2026-11-12 05:15:00.000'),(32,35,'Өтінім мәртебесі өзгерді','APP-000032: Қаралуда','info','/app/applications',NULL,'2026-11-16 05:15:00.000'),(33,35,'Жаңа тағайындау','Cetirizine — код RX-7KQ2-M9PX. Дәріханаға көрсету үшін рұқсатты қосыңыз.','info','/app/prescriptions',NULL,'2026-11-20 05:15:00.000'),(34,32,'Жаңа өтінім','APP-000035 · Айгерім Серікова: Бас','info','/doctor/patients/15',NULL,'2026-11-20 05:15:00.000'),(35,31,'Жаңа өтінім','APP-000035 · Айгерім Серікова','info','/admin/applications?open=35',NULL,'2026-11-20 12:15:00.000'),(36,31,'Жаңа өтінім','APP-000036 · Жанар Омарова','info','/admin/applications?open=36',NULL,'2026-11-21 04:15:00.000'),(37,31,'Жаңа өтінім','APP-000037 · Әсем Жұмабекова','info','/admin/applications?open=37',NULL,'2026-11-22 03:15:00.000');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `password_resets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(128) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used_at` datetime(3) DEFAULT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_resets_token_hash_key` (`token_hash`),
  KEY `password_resets_user_id_created_at_idx` (`user_id`,`created_at`),
  CONSTRAINT `password_resets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `password_resets` WRITE;
/*!40000 ALTER TABLE `password_resets` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_resets` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `patient_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_consents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `grantee_user_id` int(11) NOT NULL,
  `status` enum('ACTIVE','REVOKED') NOT NULL DEFAULT 'ACTIVE',
  `note` varchar(255) DEFAULT NULL,
  `granted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `revoked_at` datetime(3) DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patient_consents_patient_id_grantee_user_id_key` (`patient_id`,`grantee_user_id`),
  KEY `patient_consents_grantee_user_id_status_idx` (`grantee_user_id`,`status`),
  CONSTRAINT `patient_consents_grantee_user_id_fkey` FOREIGN KEY (`grantee_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `patient_consents_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `patient_consents` WRITE;
/*!40000 ALTER TABLE `patient_consents` DISABLE KEYS */;
INSERT INTO `patient_consents` VALUES (13,15,32,'ACTIVE',NULL,'2026-11-08 05:15:00.000',NULL,NULL,'2026-11-22 16:30:03.051'),(14,17,32,'ACTIVE',NULL,'2026-11-13 05:15:00.000',NULL,NULL,'2026-11-22 16:30:03.061'),(15,18,32,'ACTIVE',NULL,'2026-11-16 05:15:00.000',NULL,NULL,'2026-11-22 16:30:03.068'),(16,16,33,'ACTIVE',NULL,'2026-11-16 05:15:00.000',NULL,NULL,'2026-11-22 16:30:03.073'),(17,18,33,'ACTIVE',NULL,'2026-11-17 05:15:00.000',NULL,NULL,'2026-11-22 16:30:03.077'),(18,19,33,'ACTIVE',NULL,'2026-11-19 05:15:00.000',NULL,NULL,'2026-11-22 16:30:03.081');
/*!40000 ALTER TABLE `patient_consents` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `patient_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `patient_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `patient_code` varchar(20) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `blood_type` varchar(10) DEFAULT NULL,
  `height_cm` int(11) DEFAULT NULL,
  `weight_kg` decimal(5,1) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `chronic_conditions` text DEFAULT NULL,
  `emergency_contact` varchar(160) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patient_profiles_user_id_key` (`user_id`),
  UNIQUE KEY `patient_profiles_patient_code_key` (`patient_code`),
  CONSTRAINT `patient_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `patient_profiles` WRITE;
/*!40000 ALTER TABLE `patient_profiles` DISABLE KEYS */;
INSERT INTO `patient_profiles` VALUES (15,35,'MM-DEMO01','1996-04-12','FEMALE','+7 700 000 00 02','A(II)+',166,58.5,'Пенициллин тобы (демо дерек)',NULL,NULL,'2026-11-22 16:30:03.025','2026-11-22 16:30:03.025'),(16,36,'MM-DEMO02','1988-09-30','MALE','+7 700 000 00 04','O(I)+',181,84.0,NULL,NULL,NULL,'2026-11-22 16:30:03.030','2026-11-22 16:30:03.030'),(17,37,'MM-DEMO03','2001-02-18','FEMALE','+7 700 000 00 05','B(III)+',160,52.0,NULL,NULL,NULL,'2026-11-22 16:30:03.035','2026-11-22 16:30:03.035'),(18,38,'MM-DEMO04','1979-11-05','MALE','+7 700 000 00 06','AB(IV)-',176,90.0,NULL,'Артериялық гипертензия (демо дерек)',NULL,'2026-11-22 16:30:03.039','2026-11-22 16:30:03.039'),(19,39,'MM-DEMO05','1992-07-21','FEMALE','+7 700 000 00 07','A(II)-',170,63.0,NULL,NULL,NULL,'2026-11-22 16:30:03.044','2026-11-22 16:30:03.044');
/*!40000 ALTER TABLE `patient_profiles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `pharmacy_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pharmacy_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `pharmacy_name` varchar(160) NOT NULL,
  `license_number` varchar(40) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pharmacy_profiles_user_id_key` (`user_id`),
  UNIQUE KEY `pharmacy_profiles_license_number_key` (`license_number`),
  CONSTRAINT `pharmacy_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `pharmacy_profiles` WRITE;
/*!40000 ALTER TABLE `pharmacy_profiles` DISABLE KEYS */;
INSERT INTO `pharmacy_profiles` VALUES (5,34,'Демо Дәріхана №1','DEMO-PH-0001','Демо көшесі, 1','+7 700 000 00 03','2026-11-22 16:30:03.019','2026-11-22 16:30:03.019');
/*!40000 ALTER TABLE `pharmacy_profiles` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `prescriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `prescriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(20) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `medication_id` int(11) NOT NULL,
  `medical_record_id` int(11) DEFAULT NULL,
  `dosage` varchar(120) NOT NULL,
  `frequency` varchar(120) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `instructions` text DEFAULT NULL,
  `status` enum('ACTIVE','DISPENSED','EXPIRED','CANCELLED') NOT NULL DEFAULT 'ACTIVE',
  `pharmacy_access` tinyint(1) NOT NULL DEFAULT 0,
  `issued_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `valid_until` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `prescriptions_code_key` (`code`),
  KEY `prescriptions_patient_id_idx` (`patient_id`),
  KEY `prescriptions_doctor_id_idx` (`doctor_id`),
  KEY `prescriptions_status_idx` (`status`),
  KEY `prescriptions_medication_id_fkey` (`medication_id`),
  KEY `prescriptions_medical_record_id_fkey` (`medical_record_id`),
  CONSTRAINT `prescriptions_doctor_id_fkey` FOREIGN KEY (`doctor_id`) REFERENCES `doctor_profiles` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `prescriptions_medical_record_id_fkey` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `prescriptions_medication_id_fkey` FOREIGN KEY (`medication_id`) REFERENCES `medications` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `prescriptions_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
INSERT INTO `prescriptions` VALUES (10,'RX-DEMO-2026',15,9,26,8,'200 мг','Күніне 3 рет, тамақтан кейін',5,'Демонстрациялық тағайындау. Асқазанда ауырсыну болса, қабылдауды тоқтатып, дәрігерге хабарласу.','ACTIVE',1,'2026-11-12 05:15:00.000','2026-12-12 16:30:03.192','2026-11-22 16:30:03.194','2026-11-22 16:30:03.194'),(11,'RX-7KQ2-M9PX',15,9,29,NULL,'10 мг','Күніне 1 рет, кешке',14,'Демонстрациялық тағайындау (пациент дәріханаға әлі рұқсат бермеген).','ACTIVE',0,'2026-11-20 05:15:00.000','2026-12-20 16:30:03.214','2026-11-22 16:30:03.216','2026-11-22 16:30:03.216');
/*!40000 ALTER TABLE `prescriptions` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `report_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `report_attachments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `symptom_report_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size_bytes` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `report_attachments_stored_name_key` (`stored_name`),
  KEY `report_attachments_symptom_report_id_idx` (`symptom_report_id`),
  CONSTRAINT `report_attachments_symptom_report_id_fkey` FOREIGN KEY (`symptom_report_id`) REFERENCES `symptom_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `report_attachments` WRITE;
/*!40000 ALTER TABLE `report_attachments` DISABLE KEYS */;
/*!40000 ALTER TABLE `report_attachments` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `symptom_reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `symptom_reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `body_area_id` int(11) NOT NULL,
  `description` text NOT NULL,
  `started_at` date NOT NULL,
  `duration` varchar(60) NOT NULL,
  `intensity` tinyint(4) NOT NULL,
  `additional_symptoms` text DEFAULT NULL,
  `visited_doctor` tinyint(1) NOT NULL DEFAULT 0,
  `visit_details` text DEFAULT NULL,
  `status` enum('NEW','UNDER_REVIEW','ACCEPTED','COMPLETED','REJECTED') NOT NULL DEFAULT 'NEW',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `application_no` varchar(20) NOT NULL,
  `contact_name` varchar(120) NOT NULL,
  `contact_email` varchar(191) NOT NULL,
  `contact_phone` varchar(30) DEFAULT NULL,
  `submission_key` varchar(64) DEFAULT NULL,
  `status_changed_at` datetime(3) DEFAULT NULL,
  `admin_seen_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `symptom_reports_application_no_key` (`application_no`),
  UNIQUE KEY `symptom_reports_submission_key_key` (`submission_key`),
  KEY `symptom_reports_patient_id_created_at_idx` (`patient_id`,`created_at`),
  KEY `symptom_reports_body_area_id_idx` (`body_area_id`),
  KEY `symptom_reports_status_idx` (`status`),
  KEY `symptom_reports_admin_seen_at_idx` (`admin_seen_at`),
  CONSTRAINT `symptom_reports_body_area_id_fkey` FOREIGN KEY (`body_area_id`) REFERENCES `body_areas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `symptom_reports_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `symptom_reports` WRITE;
/*!40000 ALTER TABLE `symptom_reports` DISABLE KEYS */;
INSERT INTO `symptom_reports` VALUES (29,15,90,'Ұзақ отырғаннан кейін белдің төменгі жағында сыздап ауырсыну пайда болады. Таңертең қозғалғанда күшейеді.','2026-11-02','2–4 апта',6,'Аяққа таралмайды, ұю сезімі жоқ',0,NULL,'COMPLETED','2026-11-10 05:15:00.000','2026-11-22 16:30:03.093','APP-000029','Айгерім Серікова','patient@medmap.demo','+7 700 000 00 02',NULL,'2026-11-11 05:15:00.000','2026-11-10 05:15:00.000'),(30,18,86,'Мойынның артқы жағында қатаю, басты бұрғанда шектелу. Компьютерде ұзақ жұмыс істегенде күшейеді.','2026-11-10','1–2 апта',5,NULL,0,NULL,'COMPLETED','2026-11-13 05:15:00.000','2026-11-22 16:30:03.105','APP-000030','Дәурен Сапаров','patient4@medmap.demo','+7 700 000 00 06',NULL,'2026-11-14 05:15:00.000','2026-11-13 05:15:00.000'),(31,17,102,'Жүгіргеннен кейін сол тізеде ауырсыну, баспалдақпен түскенде күшейеді.','2026-11-14','4–7 күн',4,'Жеңіл ісіну байқалады',0,NULL,'ACCEPTED','2026-11-16 05:15:00.000','2026-11-22 16:30:03.114','APP-000031','Әсем Жұмабекова','patient3@medmap.demo','+7 700 000 00 05',NULL,'2026-11-17 05:15:00.000','2026-11-16 05:15:00.000'),(32,15,92,'Қолды жоғары көтергенде оң иықта шаншу сезіледі. Спорт залдағы жаттығудан кейін басталды.','2026-11-13','1–2 апта',4,'Түнде оң жағымен жатқанда мазалайды',1,'Жаттықтырушы жүктемені азайтуға кеңес берді (демо)','UNDER_REVIEW','2026-11-15 05:15:00.000','2026-11-22 16:30:03.124','APP-000032','Айгерім Серікова','patient@medmap.demo','+7 700 000 00 02',NULL,'2026-11-16 05:15:00.000','2026-11-15 05:15:00.000'),(33,16,85,'Түстен кейін самай тұсында қайталанатын бас ауруы, жарықта күшейеді.','2026-11-16','4–7 күн',6,NULL,0,NULL,'UNDER_REVIEW','2026-11-18 05:15:00.000','2026-11-22 16:30:03.132','APP-000033','Ерлан Төлеуов','patient2@medmap.demo','+7 700 000 00 04',NULL,'2026-11-19 05:15:00.000','2026-11-18 05:15:00.000'),(34,19,98,'Оң қол басының саусақтарында ұю сезімі (қайталанған өтінім, демо).','2026-11-16','1–3 күн',2,NULL,0,NULL,'REJECTED','2026-11-17 05:15:00.000','2026-11-22 16:30:03.140','APP-000034','Жанар Омарова','patient5@medmap.demo','+7 700 000 00 07',NULL,'2026-11-18 05:15:00.000','2026-11-17 05:15:00.000'),(35,15,85,'Жұмыс күнінің соңында маңдай тұсында қысып ауыратын бас ауруы.','2026-11-17','4–7 күн',5,'Экранға ұзақ қарағанда көз шаршайды',0,NULL,'NEW','2026-11-20 12:15:00.000','2026-11-22 16:30:03.148','APP-000035','Айгерім Серікова','patient@medmap.demo','+7 700 000 00 02',NULL,NULL,NULL),(36,19,88,'Тамақтан кейін іштің жоғарғы бөлігінде ауырлық және ыңғайсыздық сезімі.','2026-11-19','1–3 күн',4,NULL,0,NULL,'NEW','2026-11-21 04:15:00.000','2026-11-22 16:30:03.156','APP-000036','Жанар Омарова','patient5@medmap.demo','+7 700 000 00 07',NULL,NULL,NULL),(37,17,104,'Таңертең алғашқы қадамдарда сол табанның өкшесінде ауырсыну.','2026-11-18','4–7 күн',3,NULL,0,NULL,'NEW','2026-11-22 03:15:00.000','2026-11-22 16:30:03.163','APP-000037','Әсем Жұмабекова','patient3@medmap.demo','+7 700 000 00 05',NULL,NULL,NULL);
/*!40000 ALTER TABLE `symptom_reports` ENABLE KEYS */;
UNLOCK TABLES;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `role` enum('PATIENT','DOCTOR','PHARMACIST','ADMIN') NOT NULL DEFAULT 'PATIENT',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `email_verified_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_role_idx` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (31,'admin@medmap.demo','$2a$12$cXtPN2dShtNo1lAeOqKMKeEzyWMYrhV31rMSNete6wrh6DvM5oPBq','Жүйе Әкімшісі','ADMIN',1,NULL,'2026-11-22 16:30:02.655','2026-11-22 16:30:02.655','2026-10-23 05:15:00.000'),(32,'doctor@medmap.demo','$2a$12$fqs6ehiIIhowbWEibml6huc6MxNLrnsNhyQ0OmqsIBy68KZKJs/Hm','Нұрлан Әбенов','DOCTOR',1,NULL,'2026-11-22 16:30:02.660','2026-11-22 16:30:02.660','2026-10-23 05:15:00.000'),(33,'neuro@medmap.demo','$2a$12$fqs6ehiIIhowbWEibml6huc6MxNLrnsNhyQ0OmqsIBy68KZKJs/Hm','Дина Мұратова','DOCTOR',1,NULL,'2026-11-22 16:30:02.664','2026-11-22 16:30:02.664','2026-10-23 05:15:00.000'),(34,'pharmacy@medmap.demo','$2a$12$vNEouFR.KXQLU6HZvx2uYOrUw3sxS5eGYkX3tR4/BnkXPcOxaqP5C','Мадина Қасымова','PHARMACIST',1,NULL,'2026-11-22 16:30:03.019','2026-11-22 16:30:03.019','2026-10-23 05:15:00.000'),(35,'patient@medmap.demo','$2a$12$W2MJL0ckGD6a4skxSBPYkOKIBiMa2Jute80txiYIjIfTV0q4RhUNW','Айгерім Серікова','PATIENT',1,NULL,'2026-11-22 16:30:03.025','2026-11-22 16:30:03.025','2026-10-23 05:15:00.000'),(36,'patient2@medmap.demo','$2a$12$W2MJL0ckGD6a4skxSBPYkOKIBiMa2Jute80txiYIjIfTV0q4RhUNW','Ерлан Төлеуов','PATIENT',1,NULL,'2026-11-22 16:30:03.030','2026-11-22 16:30:03.030','2026-10-23 05:15:00.000'),(37,'patient3@medmap.demo','$2a$12$W2MJL0ckGD6a4skxSBPYkOKIBiMa2Jute80txiYIjIfTV0q4RhUNW','Әсем Жұмабекова','PATIENT',1,NULL,'2026-11-22 16:30:03.035','2026-11-22 16:30:03.035','2026-10-23 05:15:00.000'),(38,'patient4@medmap.demo','$2a$12$W2MJL0ckGD6a4skxSBPYkOKIBiMa2Jute80txiYIjIfTV0q4RhUNW','Дәурен Сапаров','PATIENT',1,NULL,'2026-11-22 16:30:03.039','2026-11-22 16:30:03.039','2026-10-23 05:15:00.000'),(39,'patient5@medmap.demo','$2a$12$W2MJL0ckGD6a4skxSBPYkOKIBiMa2Jute80txiYIjIfTV0q4RhUNW','Жанар Омарова','PATIENT',1,NULL,'2026-11-22 16:30:03.044','2026-11-22 16:30:03.044','2026-10-23 05:15:00.000');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


SET FOREIGN_KEY_CHECKS = 1;
