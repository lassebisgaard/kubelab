-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Vært: mysql
-- Genereringstid: 09. 12 2024 kl. 23:26:36
-- Serverversion: 8.4.3
-- PHP-version: 8.2.26

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
  `UserId` int DEFAULT NULL,
  `TemplateId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Projects`
--

INSERT INTO `Projects` (`ProjectId`, `ProjectName`, `Domain`, `Description`, `DateCreated`, `UserId`, `TemplateId`) VALUES
(36, 'myawesomewp', 'myawesomewp', '', '2024-12-09 20:42:00', 1, 34),
(37, 'mitnyeste', 'mitnyeste', '', '2024-12-09 20:45:44', 1, 33);

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Roles`
--

CREATE TABLE `Roles` (
  `RoleId` int NOT NULL,
  `IsAdmin` tinyint(1) DEFAULT NULL,
  `UserId` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Roles`
--

INSERT INTO `Roles` (`RoleId`, `IsAdmin`, `UserId`) VALUES
(1, 0, 10),
(2, 1, 11);

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
(4, 'Nginx', 'bx-server');

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
(9, '2024-12-19', 'WUOE24'),
(11, '2024-12-26', 'Undervisere'),
(12, '2025-04-17', 'sygeplejersker'),
(13, '2025-03-12', 'almindeligemennesker');

-- --------------------------------------------------------

--
-- Struktur-dump for tabellen `Templates`
--

CREATE TABLE `Templates` (
  `TemplateId` int NOT NULL,
  `TemplateName` varchar(255) NOT NULL,
  `Description` tinytext NOT NULL,
  `DateCreated` datetime DEFAULT NULL,
  `ProjectId` int DEFAULT NULL,
  `YamlContent` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PreviewImage` mediumtext
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Data dump for tabellen `Templates`
--

INSERT INTO `Templates` (`TemplateId`, `TemplateName`, `Description`, `DateCreated`, `ProjectId`, `YamlContent`, `PreviewImage`) VALUES
(33, 'A simple Nginx server', '', '2024-12-09 20:34:45', NULL, '{\n  \"networks\": {\n    \"traefik-proxy\": {\n      \"external\": true\n    }\n  },\n  \"services\": {\n    \"test\": {\n      \"image\": \"nginx:latest\",\n      \"networks\": [\"traefik-proxy\"],\n      \"deploy\": {\n        \"labels\": [\n          \"traefik.enable=true\",\n          \"traefik.http.routers.CHANGEME.rule=Host(`SUBDOMAIN.kubelab.dk`)\",\n          \"traefik.http.routers.CHANGEME.entrypoints=web,websecure\",\n          \"traefik.http.routers.CHANGEME.tls.certresolver=letsencrypt\",\n          \"traefik.http.services.CHANGEME.loadbalancer.server.port=80\"\n        ]\n      }\n    }\n  }\n}', NULL),
(34, 'Full stack Wordpress', '', '2024-12-09 20:41:43', NULL, 'networks:\n  traefik-proxy:\n    external: true\n  wp-network:\n    driver: overlay\nservices:\n  wordpress:\n    image: wordpress:latest\n    environment:\n      WORDPRESS_DB_HOST: db\n      WORDPRESS_DB_USER: wpuser\n      WORDPRESS_DB_PASSWORD: wppassword\n      WORDPRESS_DB_NAME: wpdatabase\n    networks:\n      - traefik-proxy\n      - wp-network\n    deploy:\n      labels:\n        - traefik.enable=true\n        - traefik.http.routers.CHANGEME01.rule=Host(`SUBDOMAIN01.kubelab.dk`)\n        - traefik.http.routers.CHANGEME01.entrypoints=web,websecure\n        - traefik.http.routers.CHANGEME01.tls.certresolver=letsencrypt\n        - traefik.http.services.CHANGEME01.loadbalancer.server.port=80\n  db:\n    image: mariadb:latest\n    environment:\n      MYSQL_ROOT_PASSWORD: rootpassword\n      MYSQL_DATABASE: wpdatabase\n      MYSQL_USER: wpuser\n      MYSQL_PASSWORD: wppassword\n    networks:\n      - wp-network\n  phpmyadmin:\n    image: phpmyadmin:latest\n    environment:\n      PMA_HOST: db\n      PMA_USER: wpuser\n      PMA_PASSWORD: wppassword\n    networks:\n      - traefik-proxy\n      - wp-network\n    deploy:\n      labels:\n        - traefik.enable=true\n        - traefik.http.routers.CHANGEME02.rule=Host(`SUBDOMAIN02.kubelab.dk`)\n        - traefik.http.routers.CHANGEME02.entrypoints=web,websecure\n        - traefik.http.routers.CHANGEME02.tls.certresolver=letsencrypt\n        - traefik.http.services.CHANGEME02.loadbalancer.server.port=80', NULL);

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
(34, 1),
(34, 2),
(34, 3),
(33, 4);

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
(1, 'sarah English', 'sarah_english@live.dk', 'minkode', '2024-12-19', 9),
(2, 'Portainer James', 'james@live.dk', '1234', '2025-12-01', 9),
(4, 'Søren Larsen', 'semlarsen@live.dk', 'khg4d1do', '2024-12-25', 11),
(10, 'Lasse Biasgaard', 'lasseb@mail.com', 'hxnf07dn', '2025-04-30', 9),
(11, 'Søren myman', 'sørenmyman@live.dk', '8tq2rar9', '2024-12-18', 13);

--
-- Begrænsninger for dumpede tabeller
--

--
-- Indeks for tabel `Projects`
--
ALTER TABLE `Projects`
  ADD PRIMARY KEY (`ProjectId`),
  ADD KEY `UserId` (`UserId`),
  ADD KEY `TemplateId` (`TemplateId`);

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
  MODIFY `ProjectId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Tilføj AUTO_INCREMENT i tabel `Roles`
--
ALTER TABLE `Roles`
  MODIFY `RoleId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Tilføj AUTO_INCREMENT i tabel `Services`
--
ALTER TABLE `Services`
  MODIFY `ServiceId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Tilføj AUTO_INCREMENT i tabel `Teams`
--
ALTER TABLE `Teams`
  MODIFY `TeamId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Tilføj AUTO_INCREMENT i tabel `Templates`
--
ALTER TABLE `Templates`
  MODIFY `TemplateId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- Tilføj AUTO_INCREMENT i tabel `Users`
--
ALTER TABLE `Users`
  MODIFY `UserId` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Begrænsninger for dumpede tabeller
--

--
-- Begrænsninger for tabel `Projects`
--
ALTER TABLE `Projects`
  ADD CONSTRAINT `Projects_ibfk_1` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`),
  ADD CONSTRAINT `Projects_ibfk_2` FOREIGN KEY (`TemplateId`) REFERENCES `Templates` (`TemplateId`);

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
