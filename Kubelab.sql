-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Vært: mysql
-- Genereringstid: 03. 12 2024 kl. 15:55:22
-- Serverversion: 8.4.2
-- PHP-version: 8.2.24

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `Kubelab`
--

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Projects`
--

CREATE TABLE `Projects` (
  `ProjectId` int NOT NULL,
  `ProjectName` varchar(255) NOT NULL,
  `Domain` varchar(255) NOT NULL,
  `Description` tinytext NOT NULL,
  `DateCreated` datetime DEFAULT NULL,
  `UserId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Projects`
--

INSERT INTO `Projects` (`ProjectId`, `ProjectName`, `Domain`, `Description`, `DateCreated`, `UserId`) VALUES
(1, 'Semesterprojekt', 'lasse', 'Wordpress kenneth', '2024-12-02 12:10:55', NULL),
(2, 'Studiemakker på tværs', 'David', 'Wordpress Jakob', '2024-12-02 12:18:14', NULL),
(14, 'Sarahssupersejet', 'heheheheh', 'tester', '2024-12-02 18:50:16', 1),
(29, 'tester', 'tester', '', '2024-12-03 15:43:02', 1);

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Roles`
--

CREATE TABLE `Roles` (
  `RoleId` int NOT NULL,
  `IsAdmin` tinyint(1) DEFAULT NULL,
  `UserId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Services`
--

CREATE TABLE `Services` (
  `ServiceId` int NOT NULL,
  `ServiceName` varchar(100) NOT NULL,
  `Icon` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Services`
--

INSERT INTO `Services` (`ServiceId`, `ServiceName`, `Icon`) VALUES
(1, 'WordPress', 'bxl-wordpress'),
(2, 'MySQL', 'bx-data'),
(3, 'phpMyAdmin', 'bx-server'),
(4, 'Nginx', 'bx-server'),
(5, 'PHP', 'bxl-php'),
(7, 'Redis', 'bx-data'),
(8, 'Node.js', 'bxl-nodejs'),
(9, 'Sarahs service', 'bx-cloud'),
(12, 'hejsa', 'bx-code');

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Teams`
--

CREATE TABLE `Teams` (
  `TeamId` int NOT NULL,
  `Expiration` date NOT NULL,
  `TeamName` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Teams`
--

INSERT INTO `Teams` (`TeamId`, `Expiration`, `TeamName`) VALUES
(8, '2024-12-12', 'Sarahs gode hold'),
(9, '2024-12-19', 'Sørens hold'),
(10, '2025-02-19', 'Nybegynderne'),
(11, '2024-12-26', 'Søde Sarah');

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Templates`
--

CREATE TABLE `Templates` (
  `TemplateId` int NOT NULL,
  `TemplateName` varchar(255) NOT NULL,
  `Description` tinytext NOT NULL,
  `DateCreated` datetime DEFAULT NULL,
  `ProjectId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Templates`
--

INSERT INTO `Templates` (`TemplateId`, `TemplateName`, `Description`, `DateCreated`, `ProjectId`) VALUES
(14, 'DavidOGLasseErGhosts', 'det her er en test', '2024-12-02 13:52:27', NULL),
(28, 'Sarahs fede side ', 'ehhehehe', '2024-12-02 16:50:51', NULL),
(29, 'Verdens bedste template', 'det her er en tester', '2024-12-02 16:56:25', NULL),
(30, 'Sarahs smkke side', 'test', '2024-12-02 16:59:47', NULL),
(32, 'tester1', 'test', '2024-12-03 15:39:05', NULL);

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `template_services`
--

CREATE TABLE `template_services` (
  `template_id` int NOT NULL,
  `service_id` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `template_services`
--

INSERT INTO `template_services` (`template_id`, `service_id`) VALUES
(28, 2),
(29, 2),
(28, 3),
(29, 3),
(30, 3),
(32, 3),
(28, 4),
(32, 4),
(29, 5),
(30, 7),
(14, 8),
(30, 9);

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Users`
--

CREATE TABLE `Users` (
  `UserId` int NOT NULL,
  `Name` varchar(255) NOT NULL,
  `Mail` varchar(255) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Expiration` date NOT NULL,
  `TeamId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Users`
--

INSERT INTO `Users` (`UserId`, `Name`, `Mail`, `Password`, `Expiration`, `TeamId`) VALUES
(1, 'sarah English', 'sarah_english@live.dk', 'SHOW TABLES;', '2024-12-19', NULL),
(2, 'Portainer James', 'james@live.dk', '1234', '2025-12-01', 9),
(3, 'Sarah', 'sarah@e.dk', 'y0cx9q06', '2024-12-24', 11),
(4, 'Søren Larsen', 'semlarsen@live.dk', 'khg4d1do', '2024-12-25', 11),
(5, 'Signe', 's@hej.dk', 'wq0g0wi8', '2024-12-24', 10),
(8, 'jadadadada', 's@hejed.dk', '1ou8zgms', '2024-12-31', 9),
(9, 'dede', 'dededd', 'do6nj9yc', '2024-12-26', 10);

--
-- Begrænsninger for dumpede tabeller
--

--
-- Indeks for tabel `Projects`
--
ALTER TABLE `Projects`
  ADD PRIMARY KEY (`ProjectId`),
  ADD KEY `UserId` (`UserId`);

--
-- Indeks for tabel `Roles`
--
ALTER TABLE `Roles`
  ADD PRIMARY KEY (`RoleId`),
  ADD KEY `UserId` (`UserId`);

--
-- Indeks for tabel `Services`
--
ALTER TABLE `Services`
  ADD PRIMARY KEY (`ServiceId`);

--
-- Indeks for tabel `Teams`
--
ALTER TABLE `Teams`
  ADD PRIMARY KEY (`TeamId`),
  ADD UNIQUE KEY `TeamName` (`TeamName`);

--
-- Indeks for tabel `Templates`
--
ALTER TABLE `Templates`
  ADD PRIMARY KEY (`TemplateId`),
  ADD KEY `ProjectId` (`ProjectId`);

--
-- Indeks for tabel `template_services`
--
ALTER TABLE `template_services`
  ADD PRIMARY KEY (`template_id`,`service_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indeks for tabel `Users`
--
ALTER TABLE `Users`
  ADD PRIMARY KEY (`UserId`),
  ADD UNIQUE KEY `Mail` (`Mail`),
  ADD KEY `fk_team` (`TeamId`);

--
-- Brug ikke AUTO_INCREMENT for slettede tabeller
--

--
-- Tilføj AUTO_INCREMENT i tabel `Projects`
--
ALTER TABLE `Projects`
  MODIFY `ProjectId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- Tilføj AUTO_INCREMENT i tabel `Roles`
--
ALTER TABLE `Roles`
  MODIFY `RoleId` int NOT NULL AUTO_INCREMENT;

--
-- Tilføj AUTO_INCREMENT i tabel `Services`
--
ALTER TABLE `Services`
  MODIFY `ServiceId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Tilføj AUTO_INCREMENT i tabel `Teams`
--
ALTER TABLE `Teams`
  MODIFY `TeamId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Tilføj AUTO_INCREMENT i tabel `Templates`
--
ALTER TABLE `Templates`
  MODIFY `TemplateId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- Tilføj AUTO_INCREMENT i tabel `Users`
--
ALTER TABLE `Users`
  MODIFY `UserId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Begrænsninger for dumpede tabeller
--

--
-- Begrænsninger for tabel `Projects`
--
ALTER TABLE `Projects`
  ADD CONSTRAINT `Projects_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`);

--
-- Begrænsninger for tabel `Roles`
--
ALTER TABLE `Roles`
  ADD CONSTRAINT `Roles_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`);

--
-- Begrænsninger for tabel `Templates`
--
ALTER TABLE `Templates`
  ADD CONSTRAINT `Templates_ibfk_1` FOREIGN KEY (`ProjectId`) REFERENCES `Projects` (`ProjectId`);

--
-- Begrænsninger for tabel `template_services`
--
ALTER TABLE `template_services`
  ADD CONSTRAINT `template_services_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `Templates` (`TemplateId`) ON DELETE CASCADE,
  ADD CONSTRAINT `template_services_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `Services` (`ServiceId`) ON DELETE CASCADE;

--
-- Begrænsninger for tabel `Users`
--
ALTER TABLE `Users`
  ADD CONSTRAINT `fk_team` FOREIGN KEY (`TeamId`) REFERENCES `Teams` (`TeamId`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
