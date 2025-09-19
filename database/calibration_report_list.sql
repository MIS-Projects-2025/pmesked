-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: localhost    Database: eeportal_db
-- ------------------------------------------------------
-- Server version	8.0.39

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `calibration_report_list`
--

DROP TABLE IF EXISTS `calibration_report_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calibration_report_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `equipment` varchar(45) DEFAULT NULL,
  `model` varchar(45) DEFAULT NULL,
  `temperature` varchar(45) DEFAULT NULL,
  `relative_humidity` varchar(45) DEFAULT NULL,
  `manufacturer` varchar(45) DEFAULT NULL,
  `serial` varchar(45) DEFAULT NULL,
  `calibration_date` varchar(45) DEFAULT NULL,
  `calibration_due` varchar(45) DEFAULT NULL,
  `control_no` varchar(45) DEFAULT NULL,
  `specs` varchar(45) DEFAULT NULL,
  `performed_by` varchar(45) DEFAULT NULL,
  `review_by` varchar(45) DEFAULT NULL,
  `report_no` varchar(45) DEFAULT NULL,
  `cal_interval` varchar(45) DEFAULT NULL,
  `description` varchar(45) DEFAULT NULL,
  `cal_manufacturer` varchar(45) DEFAULT NULL,
  `model_no` varchar(45) DEFAULT NULL,
  `cal_control_no` varchar(45) DEFAULT NULL,
  `serial_no` varchar(45) DEFAULT NULL,
  `accuracy` varchar(45) DEFAULT NULL,
  `cal_date` varchar(45) DEFAULT NULL,
  `cal_due` varchar(45) DEFAULT NULL,
  `traceability` varchar(45) DEFAULT NULL,
  `function_tested` varchar(45) DEFAULT NULL,
  `nominal` varchar(45) DEFAULT NULL,
  `tolerance` varchar(45) DEFAULT NULL,
  `unit_under_test` varchar(45) DEFAULT NULL,
  `standard_instrument` varchar(45) DEFAULT NULL,
  `disparity` varchar(45) DEFAULT NULL,
  `correction` varchar(45) DEFAULT NULL,
  `remarks` varchar(45) DEFAULT NULL,
  `qa_sign` varchar(45) DEFAULT NULL,
  `qa_sign_date` varchar(45) DEFAULT NULL,
  `date_created` datetime DEFAULT NULL,
  `date_updated` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calibration_report_list`
--

LOCK TABLES `calibration_report_list` WRITE;
/*!40000 ALTER TABLE `calibration_report_list` DISABLE KEYS */;
/*!40000 ALTER TABLE `calibration_report_list` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-18 13:18:30
