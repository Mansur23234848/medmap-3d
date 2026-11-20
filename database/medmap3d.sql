-- MEDMAP 3D demo database dump (MariaDB 10.4 / MySQL). ALL DATA IS SYNTHETIC.
-- Import: CREATE DATABASE medmap3d CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; then mysql -u USER -p medmap3d < database/medmap3d.sql
-- Demo logins are listed in README.md.

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
INSERT INTO `_prisma_migrations` VALUES ('33d8d978-9f91-4ab4-b13d-f7927d084684','8ce6edb52539eaef06b67b5cc52b156521637c083f1571d1b633d4276720cea6','2026-11-20 13:51:11.795','20261120000000_init',NULL,NULL,'2026-11-20 13:51:11.194',1),('dd138d6e-6ec6-49a8-9663-d679537ec4e7','0d0f97151349e926a0ebbb0cbd0756910078ef3e2e70a3ca36353e06c82d410a','2026-11-20 13:58:30.337','20261120010000_blood_type_len',NULL,NULL,'2026-11-20 13:58:30.324',1);
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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
INSERT INTO `activity_logs` VALUES (34,NULL,'system.seeded','system',NULL,NULL,NULL,'{\"synthetic\":true}','2026-11-20 14:32:36.936'),(35,14,'auth.login','user','14','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/6.6395.0 Chrome/156.0.8078.100 Safari/537.36 MSIX',NULL,'2026-11-20 14:49:28.309'),(36,18,'auth.login','user','18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/6.6395.0 Chrome/156.0.8078.100 Safari/537.36 MSIX',NULL,'2026-11-20 14:50:20.735'),(37,18,'patient.profile_updated','patient_profile','6','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Claude/6.6395.0 Chrome/156.0.8078.100 Safari/537.36 MSIX',NULL,'2026-11-20 14:51:30.116');
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
) ENGINE=InnoDB AUTO_INCREMENT=64 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `body_areas` WRITE;
/*!40000 ALTER TABLE `body_areas` DISABLE KEYS */;
INSERT INTO `body_areas` VALUES (43,'head','Head','Бас','CENTER','BOTH','Бас сүйегі (краниум) мен бет сүйектерінен тұрады. Ішінде ми, көру, есту, иіс және дәм сезу мүшелері орналасқан.',0,'2026-11-20 14:32:35.157'),(44,'neck','Neck','Мойын','CENTER','BOTH','Жеті мойын омыртқасы (C1–C7), кеңірдек, өңеш, қалқанша без және басқа қан тамырлары өтетін аймақ.',1,'2026-11-20 14:32:35.157'),(45,'chest','Chest','Кеуде','CENTER','FRONT','Төс сүйегі мен қабырғалардан құралған кеуде қуысы. Ішінде жүрек, өкпе және ірі қан тамырлары орналасқан.',2,'2026-11-20 14:32:35.157'),(46,'abdomen','Abdomen','Іш','CENTER','FRONT','Көкет пен жамбас арасындағы аймақ. Асқазан, бауыр, ішек, ұйқы безі сияқты ас қорыту мүшелері орналасқан.',3,'2026-11-20 14:32:35.157'),(47,'upper_back','Upper Back','Арқаның жоғарғы бөлігі','CENTER','BACK','Кеуде омыртқалары (T1–T12), жауырындар және арқаның жоғарғы бұлшықеттері (трапеция, ромб тәрізді бұлшықеттер).',4,'2026-11-20 14:32:35.157'),(48,'lower_back','Lower Back','Бел','CENTER','BACK','Бел омыртқалары (L1–L5) мен оларды қоршаған бұлшықеттер. Дененің салмағын көтеретін негізгі тірек аймағы.',5,'2026-11-20 14:32:35.157'),(49,'left_shoulder','Left Shoulder','Сол иық','LEFT','BOTH','Иық буыны тоқпан жілік, жауырын және бұғана сүйектерінен түзіледі. Айналмалы манжета бұлшықеттері қозғалысты қамтамасыз етеді.',6,'2026-11-20 14:32:35.157'),(50,'right_shoulder','Right Shoulder','Оң иық','RIGHT','BOTH','Иық буыны тоқпан жілік, жауырын және бұғана сүйектерінен түзіледі. Айналмалы манжета бұлшықеттері қозғалысты қамтамасыз етеді.',7,'2026-11-20 14:32:35.157'),(51,'left_arm','Left Arm','Сол қол','LEFT','BOTH','Иық пен білек бөліктері: тоқпан жілік, кәрі жілік және шынтақ жілігі, сондай-ақ бүгу мен жазу бұлшықеттері.',8,'2026-11-20 14:32:35.157'),(52,'right_arm','Right Arm','Оң қол','RIGHT','BOTH','Иық пен білек бөліктері: тоқпан жілік, кәрі жілік және шынтақ жілігі, сондай-ақ бүгу мен жазу бұлшықеттері.',9,'2026-11-20 14:32:35.157'),(53,'left_elbow','Left Elbow','Сол шынтақ','LEFT','BOTH','Тоқпан жілік, кәрі жілік және шынтақ жілігі түйісетін топса тәрізді буын. Қолды бүгуге және бұруға мүмкіндік береді.',10,'2026-11-20 14:32:35.157'),(54,'right_elbow','Right Elbow','Оң шынтақ','RIGHT','BOTH','Тоқпан жілік, кәрі жілік және шынтақ жілігі түйісетін топса тәрізді буын. Қолды бүгуге және бұруға мүмкіндік береді.',11,'2026-11-20 14:32:35.157'),(55,'left_hand','Left Hand','Сол қол басы','LEFT','BOTH','Білезік, алақан және саусақтар: 27 сүйек, көптеген ұсақ буындар мен сіңірлер нәзік қозғалысты қамтамасыз етеді.',12,'2026-11-20 14:32:35.157'),(56,'right_hand','Right Hand','Оң қол басы','RIGHT','BOTH','Білезік, алақан және саусақтар: 27 сүйек, көптеген ұсақ буындар мен сіңірлер нәзік қозғалысты қамтамасыз етеді.',13,'2026-11-20 14:32:35.157'),(57,'pelvis','Pelvis','Жамбас','CENTER','BOTH','Жамбас сүйектері мен сегізкөз құрайтын сақина. Қуық, жыныс мүшелері және тік ішек осы аймақта орналасқан.',14,'2026-11-20 14:32:35.157'),(58,'left_leg','Left Leg','Сол аяқ','LEFT','BOTH','Сан және сирақ бөліктері: ортан жілік, асықты жілік, шыбық жілік және аяқтың ірі бұлшықеттері.',15,'2026-11-20 14:32:35.157'),(59,'right_leg','Right Leg','Оң аяқ','RIGHT','BOTH','Сан және сирақ бөліктері: ортан жілік, асықты жілік, шыбық жілік және аяқтың ірі бұлшықеттері.',16,'2026-11-20 14:32:35.157'),(60,'left_knee','Left Knee','Сол тізе','LEFT','BOTH','Дененің ең ірі буыны: ортан жілік, асықты жілік және тізе тостағаны. Мениск пен байламдар тұрақтылықты қамтамасыз етеді.',17,'2026-11-20 14:32:35.157'),(61,'right_knee','Right Knee','Оң тізе','RIGHT','BOTH','Дененің ең ірі буыны: ортан жілік, асықты жілік және тізе тостағаны. Мениск пен байламдар тұрақтылықты қамтамасыз етеді.',18,'2026-11-20 14:32:35.157'),(62,'left_foot','Left Foot','Сол табан','LEFT','BOTH','Тілерсек, табан және башпай сүйектері (26 сүйек). Табан күмбезі жүру кезінде салмақты біркелкі бөледі.',19,'2026-11-20 14:32:35.157'),(63,'right_foot','Right Foot','Оң табан','RIGHT','BOTH','Тілерсек, табан және башпай сүйектері (26 сүйек). Табан күмбезі жүру кезінде салмақты біркелкі бөледі.',20,'2026-11-20 14:32:35.157');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `doctor_notes` WRITE;
/*!40000 ALTER TABLE `doctor_notes` DISABLE KEYS */;
INSERT INTO `doctor_notes` VALUES (5,6,5,NULL,14,'Иық бойынша шағым қаралуда. Келесі қабылдауда қозғалыс амплитудасын тексереміз.','SHARED','2026-11-14 05:15:00.000','2026-11-20 14:32:36.907'),(6,6,5,NULL,NULL,'Жеке жазба (тек дәрігерге көрінеді): келесі визитте отыру эргономикасын талқылау.','PRIVATE','2026-11-14 05:15:00.000','2026-11-20 14:32:36.911');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `doctor_profiles` WRITE;
/*!40000 ALTER TABLE `doctor_profiles` DISABLE KEYS */;
INSERT INTO `doctor_profiles` VALUES (5,15,'Жалпы тәжірибелік дәрігер','DEMO-DOC-0001','MEDMAP Демо Клиникасы','+7 700 000 00 01',12,'Демонстрациялық дәрігер профилі.','2026-11-20 14:32:35.721','2026-11-20 14:32:35.721'),(6,16,'Невролог','DEMO-DOC-0002','MEDMAP Демо Клиникасы',NULL,8,NULL,'2026-11-20 14:32:35.996','2026-11-20 14:32:35.996');
/*!40000 ALTER TABLE `doctor_profiles` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `medical_records` WRITE;
/*!40000 ALTER TABLE `medical_records` DISABLE KEYS */;
INSERT INTO `medical_records` VALUES (4,6,5,13,'EXAMINATION','Бел аймағын тексеру (демо)','Демонстрациялық қорытынды: физикалық тексеру кезінде бел бұлшықеттерінің керілуі анықталды. Неврологиялық белгілер байқалмады.','Ұзақ отырғанда әр 45 минут сайын үзіліс жасау, жеңіл созылу жаттығулары, 2 аптадан кейін қайта қаралу.','2026-11-10 05:15:00.000','2026-11-20 14:32:36.902');
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
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `medications` WRITE;
/*!40000 ALTER TABLE `medications` DISABLE KEYS */;
INSERT INTO `medications` VALUES (13,'Paracetamol','Paracetamol','Анальгетик / қызу түсіретін','Таблетка және капсула (500 мг, 1 г); ішетін суспензия (250 мг/5 мл, 500 мг/5 мл); суппозиторий (500 мг, 1 г)','Ауырсынуды басатын және дене қызуын түсіретін дәрі. Бас ауруы, буындардың ісінуі мен құрысуы, қызуы бар суық тию немесе тұмау белгілері, тіс ауруы, тамақ ауруы кезінде қолданылады.','• Бұрын парацетамолға аллергиялық реакция болса жарамайды\n• Бүйрек немесе бауыр ауруы болса\n• Алкогольге тәуелділік немесе шамадан тыс ішімдік қолдану\n• Дәрігер айтпаса, 3 күннен артық қабылдамау\n• Құрамында парацетамол бар басқа дәрілермен бірге қабылдамау\n• Өзара әрекеттесу: метоклопрамид, домперидон, варфарин, флуклоксациллин',0,'Ұлыбританияда: көбі дәріхана мен дүкенде рецептсіз, кейбір түрлері рецеппен','NHS (UK) — Paracetamol for adults','https://www.nhs.uk/medicines/paracetamol-for-adults/','2026-11-20',1,'2026-11-20 14:32:35.165','2026-11-20 14:32:35.165'),(14,'Ibuprofen','Ibuprofen','Қабынуға қарсы стероидты емес дәрі (ҚҚСД)','Таблетка және капсула (200 мг, 400 мг); гель немесе спрей; сұйық түрі; суда ерітетін түйіршіктер','Ауырсынуды басатын, қабынуды азайтатын және қызуды түсіре алатын ҚҚСД. Бас ауруы мен мигрень, буын және бұлшықет ауруы, жарақаттан кейінгі ауырсыну, тіс ауруы, етеккір кезіндегі ауырсыну кезінде қолданылады.','• Ибупрофенге, аспиринге немесе басқа ҚҚСД-ға аллергия\n• Асқазан жарасы (қазір немесе бұрын)\n• Демікпе немесе шөп безгегі сияқты аллергиялар\n• Желшешек\n• Жүрек, бауыр немесе бүйрек ауруы\n• Қан ұюының бұзылуы, бұрын болған инсульт\n• Жүктілік кезінде (дәрігер кеңес бермесе)\n• Басқа ҚҚСД-мен (напроксен, аспирин) бірге қабылдамау\n• Өзара әрекеттесу: варфарин сияқты антикоагулянттар, стероидтар, антидепрессанттар, кейбір қан қысымы дәрілері',0,'Ұлыбританияда: көбі рецептсіз, кейбір түрлері рецеппен','NHS (UK) — Ibuprofen for adults','https://www.nhs.uk/medicines/ibuprofen-for-adults/','2026-11-20',1,'2026-11-20 14:32:35.165','2026-11-20 14:32:35.165'),(15,'Amoxicillin','Amoxicillin','Пенициллин тобындағы антибиотик','Капсула; ішетін сұйық түрі; инъекция (әдетте тек ауруханада)','Бактериялық инфекцияларды емдеуге арналған антибиотик: кеуде инфекциялары (соның ішінде пневмония), тіс абсцесі; балалардағы құлақ инфекциялары; басқа антибиотиктермен бірге асқазан жарасын емдеуде қолданылады.','• Амоксициллинге, пенициллинге немесе басқа дәріге бұрын аллергиялық реакция болса — алдымен дәрігерге айту\n• Бауыр немесе бүйрек ауруы\n• Жақын арада қан не зәр талдауы болса (нәтижеге әсер етуі мүмкін)\n• Жақында немесе жоспарланған вакцинация\n• Жұқпалы мононуклеоз (бөртпе тудыруы мүмкін)',1,'Ұлыбританияда: тек рецеппен','NHS (UK) — Amoxicillin','https://www.nhs.uk/medicines/amoxicillin/','2026-11-20',1,'2026-11-20 14:32:35.165','2026-11-20 14:32:35.165'),(16,'Omeprazole','Omeprazole','Протон помпасының тежегіші (ППТ)','Таблетка, капсула, ішетін сұйық түрі; суда еритін таблеткалар','Асқазан қышқылын азайтатын дәрі. Асқазан жарасы, қыжыл, гастроэзофагеальды рефлюкс ауруы, H. pylori инфекциясы (антибиотиктермен бірге) кезінде қолданылады.','• Омепразолға немесе басқа ППТ-ға бұрын аллергия не ауыр жанама әсер\n• Бүйрек немесе бауыр ауруы\n• Остеопороз\n• Рецептсіз таблеткалар тек 18 жастан асқандарға; рецептсіз 2 аптадан артық қабылдамау\n• Кейбір талдау нәтижелеріне әсер етуі мүмкін\n• Өзара әрекеттесу: лансопразол, фамотидин, дигоксин, варфарин, клопидогрел, диазепам, фенитоин, шайқурай, нелфинавир, атазанавир',1,'Ұлыбританияда: көбі рецеппен, кейбір түрлері дәріханада рецептсіз','NHS (UK) — Omeprazole','https://www.nhs.uk/medicines/omeprazole/','2026-11-20',1,'2026-11-20 14:32:35.165','2026-11-20 14:32:35.165'),(17,'Cetirizine','Cetirizine','Антигистамин (ұйқы келтірмейтін)','Таблетка; ішетін сұйық түрі','Аллергия белгілерін жеңілдететін антигистамин: шөп безгегі, конъюнктивит, экзема, есекжем, жәндік шаққаннан кейінгі реакциялар, кейбір тағам аллергиялары.','• Цетиризинге немесе басқа дәріге бұрын аллергиялық реакция\n• Тағамдық қоспаларға аллергия\n• Бүйрек жеткіліксіздігі\n• Эпилепсия немесе құрысу қаупі\n• Зәр шығарудың қиындауы\n• Аллергиялық тест алдында бірнеше күн бұрын тоқтату қажет болуы мүмкін\n• Ұйқышылдық тудыруы мүмкін — бұл жағдайда көлік жүргізбеу',0,'Ұлыбританияда: рецеппен де, дәріхана мен дүкенде рецептсіз де','NHS (UK) — Cetirizine','https://www.nhs.uk/medicines/cetirizine/','2026-11-20',1,'2026-11-20 14:32:35.165','2026-11-20 14:32:35.165'),(18,'Metformin','Metformin','Қант диабетіне қарсы дәрі (бигуанид)','Таблетка; ішетін ерітінді; суда араластыратын ұнтақ','2 типті қант диабетін емдеуде (жеке немесе басқа диабет дәрілерімен бірге), жүктілік диабетінде, PMOS (бұрынғы PCOS) белгілерінде және 1 типті диабетте инсулинмен бірге қолданылады.','• Метформинге бұрын аллергия немесе ауыр жанама әсер\n• Бауыр немесе бүйрек ауруы\n• Ауыр инфекция (мысалы, өкпе не бүйрек)\n• Жүрек жеткіліксіздігі\n• Алкогольді көп тұтыну\n• Құсу, диарея не қызба кезінде сусыздану қаупі\n• Өзара әрекеттесу: диуретиктер, ибупрофен мен диклофенак сияқты ҚҚСД, кейбір қан қысымы дәрілері',1,'Ұлыбританияда: тек рецеппен','NHS (UK) — Metformin','https://www.nhs.uk/medicines/metformin/','2026-11-20',1,'2026-11-20 14:32:35.165','2026-11-20 14:32:35.165');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (12,18,'Дәрігер қорытындысы','Нұрлан Әбенов: «Бел аймағын тексеру (демо)»','success','/app/history',NULL,'2026-11-10 05:15:00.000'),(13,18,'Жаңа тағайындау','Cetirizine — код RX-7KQ2-M9PX. Дәріханаға көрсету үшін рұқсатты қосыңыз.','info','/app/prescriptions',NULL,'2026-11-18 05:15:00.000'),(14,15,'Жаңа шағым','Айгерім Серікова: Сол тізе аймағы бойынша жаңа жазба','info','/doctor/patients/6',NULL,'2026-11-19 05:15:00.000');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `patient_consents` WRITE;
/*!40000 ALTER TABLE `patient_consents` DISABLE KEYS */;
INSERT INTO `patient_consents` VALUES (5,6,15,'ACTIVE','Жалпы тексеру үшін','2026-11-06 05:15:00.000',NULL,NULL,'2026-11-20 14:32:36.858'),(6,7,16,'ACTIVE',NULL,'2026-11-14 05:15:00.000',NULL,NULL,'2026-11-20 14:32:36.868');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `patient_profiles` WRITE;
/*!40000 ALTER TABLE `patient_profiles` DISABLE KEYS */;
INSERT INTO `patient_profiles` VALUES (6,18,'MM-DEMO01','1996-04-12','MALE','+7 700 000 00 02','A(II)+',166,58.5,'Пенициллин тобы (демо дерек)',NULL,'Демо байланыс: +7 700 000 00 09','2026-11-20 14:32:36.561','2026-11-20 14:51:30.105'),(7,19,'MM-DEMO02','1988-09-30','MALE',NULL,'O(I)+',181,84.0,NULL,NULL,NULL,'2026-11-20 14:32:36.847','2026-11-20 14:32:36.847');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `pharmacy_profiles` WRITE;
/*!40000 ALTER TABLE `pharmacy_profiles` DISABLE KEYS */;
INSERT INTO `pharmacy_profiles` VALUES (3,17,'Демо Дәріхана №1','DEMO-PH-0001','Демо көшесі, 1','+7 700 000 00 03','2026-11-20 14:32:36.269','2026-11-20 14:32:36.269');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `prescriptions` WRITE;
/*!40000 ALTER TABLE `prescriptions` DISABLE KEYS */;
INSERT INTO `prescriptions` VALUES (6,'RX-DEMO-2026',6,5,14,4,'200 мг','Күніне 3 рет, тамақтан кейін',5,'Демонстрациялық тағайындау. Асқазанда ауырсыну болса, қабылдауды тоқтатып, дәрігерге хабарласу.','ACTIVE',1,'2026-11-10 05:15:00.000','2026-12-10 14:32:36.911','2026-11-20 14:32:36.915','2026-11-20 14:32:36.915'),(7,'RX-7KQ2-M9PX',6,5,17,NULL,'10 мг','Күніне 1 рет, кешке',14,'Демонстрациялық тағайындау (пациент дәріханаға әлі рұқсат бермеген).','ACTIVE',0,'2026-11-18 05:15:00.000','2026-12-18 14:32:36.924','2026-11-20 14:32:36.928','2026-11-20 14:32:36.928');
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
  `status` enum('OPEN','UNDER_REVIEW','REVIEWED','CLOSED') NOT NULL DEFAULT 'OPEN',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `symptom_reports_patient_id_created_at_idx` (`patient_id`,`created_at`),
  KEY `symptom_reports_body_area_id_idx` (`body_area_id`),
  KEY `symptom_reports_status_idx` (`status`),
  CONSTRAINT `symptom_reports_body_area_id_fkey` FOREIGN KEY (`body_area_id`) REFERENCES `body_areas` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `symptom_reports_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patient_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `symptom_reports` WRITE;
/*!40000 ALTER TABLE `symptom_reports` DISABLE KEYS */;
INSERT INTO `symptom_reports` VALUES (13,6,48,'Ұзақ отырғаннан кейін белдің төменгі жағында сыздап ауырсыну пайда болады. Таңертең қозғалғанда күшейеді.','2026-10-31','3 апта',6,'Аяққа таралмайды, ұю сезімі жоқ',0,NULL,'REVIEWED','2026-11-08 05:15:00.000','2026-11-20 14:32:36.876'),(14,6,50,'Қолды жоғары көтергенде оң иықта шаншу сезіледі. Спорт залдағы жаттығудан кейін басталды.','2026-11-11','9 күн',4,'Түнде оң жағымен жатқанда мазалайды',1,'Жаттықтырушы жүктемені азайтуға кеңес берді (демо)','UNDER_REVIEW','2026-11-13 05:15:00.000','2026-11-20 14:32:36.883'),(15,6,43,'Жұмыс күнінің соңында маңдай тұсында қысып ауыратын бас ауруы.','2026-11-15','5 күн, кешке қарай',5,'Экранға ұзақ қарағанда көз шаршайды',0,NULL,'OPEN','2026-11-17 05:15:00.000','2026-11-20 14:32:36.888'),(16,6,60,'Баспалдақпен түскенде сол тізеде жеңіл ыңғайсыздық.','2026-11-18','2 күн',3,NULL,0,NULL,'OPEN','2026-11-19 05:15:00.000','2026-11-20 14:32:36.893'),(17,7,44,'Мойынның артқы жағында қатаю, басты бұрғанда шектелу.','2026-11-14','6 күн',5,NULL,0,NULL,'OPEN','2026-11-16 05:15:00.000','2026-11-20 14:32:36.898');
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_role_idx` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (14,'admin@medmap.demo','$2a$12$yfbOtXkz3PVh6UsBf18V.ux8AHwfYwPMvcXnhfcPA6p1F/AlZBu4e','Жүйе Әкімшісі','ADMIN',1,'2026-11-20 14:49:28.300','2026-11-20 14:32:35.442','2026-11-20 14:49:28.302'),(15,'doctor@medmap.demo','$2a$12$sUT5MwOV5tdG0lvzza1/QuR.Q8FhWKPtRQgL0BEcj.zpkAY/VZX3m','Нұрлан Әбенов','DOCTOR',1,NULL,'2026-11-20 14:32:35.721','2026-11-20 14:32:35.721'),(16,'neuro@medmap.demo','$2a$12$utKCynMfTaruPx5qR6hayOhl7v/ilMQnbuH.QKZQXa/NxlZ6sfodW','Дина Мұратова','DOCTOR',1,NULL,'2026-11-20 14:32:35.996','2026-11-20 14:32:35.996'),(17,'pharmacy@medmap.demo','$2a$12$svMmasoR.j27eitDlZ0wOum/aUrcWbSjxX7QzAbDfgdjv6cJgQlEW','Мадина Қасымова','PHARMACIST',1,NULL,'2026-11-20 14:32:36.269','2026-11-20 14:32:36.269'),(18,'patient@medmap.demo','$2a$12$o2tTryxU4GztymbltI/.K.IHnT7Y3xBFhYtcSiu6slSryHSyxju2.','Арман Серіков','PATIENT',1,'2026-11-20 14:50:20.726','2026-11-20 14:32:36.561','2026-11-20 14:51:30.105'),(19,'patient2@medmap.demo','$2a$12$SIy/HYimOg8FML6hogKlQeTpo4mqwA.F86SSQk6cJyDez6/XUWl.K','Ерлан Төлеуов','PATIENT',1,NULL,'2026-11-20 14:32:36.847','2026-11-20 14:32:36.847');
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

