-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 28, 2026 at 10:10 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `nexio_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `analyses_comportementales`
--

CREATE TABLE `analyses_comportementales` (
  `id_analyse` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `score_engagement` int(11) DEFAULT 0,
  `score_fidelite` int(11) DEFAULT 0,
  `categories_preferees` text DEFAULT NULL,
  `panier_moyen` decimal(12,2) DEFAULT 0.00,
  `nb_commandes` int(11) DEFAULT 0,
  `ca_total` decimal(12,2) DEFAULT 0.00,
  `ia_analyse` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `analyses_comportementales`
--

INSERT INTO `analyses_comportementales` (`id_analyse`, `id_user`, `score_engagement`, `score_fidelite`, `categories_preferees`, `panier_moyen`, `nb_commandes`, `ca_total`, `ia_analyse`, `updated_at`) VALUES
(1, 2, 60, 40, '[\"Ordinateurs\",\"Gaming\"]', 97500.00, 2, 195000.00, '{\"centres_interet\":[\"Informatique\",\"Jeux vidéo\"],\"probabilite_achat\":0.7,\"segment\":\"gamers\",\"recommandations\":[\"Ordinateurs de gaming haut de gamme\",\"Accessoires de gaming spécialisés\",\"Logiciels de jeux vidéo\"]}', '2026-06-28 03:34:20'),
(2, 3, 49, 40, '[\"Gaming\",\"Stockage\"]', 42750.00, 2, 85500.00, '{\"centres_interet\":[\"Jeux vidéos\",\"Informatique\"],\"probabilite_achat\":0.7,\"segment\":\"gamers\",\"recommandations\":[\"Cartes graphiques\",\"Disques durs SSD\",\"PC de jeu\"]}', '2026-06-28 03:34:21'),
(3, 4, 54, 40, '[\"Stockage\"]', 68500.00, 2, 84500.00, '{\"centres_interet\":[\"Informatique\",\"Technologie\"],\"probabilite_achat\":0.7,\"segment\":\"professionnels\",\"recommandations\":[\"Disques durs externes\",\"SSD\",\"Cartes mémoire\"]}', '2026-06-28 03:34:21'),
(4, 5, 22, 15, '[\"Réseau\"]', 22500.00, 1, 22500.00, '{\"centres_interet\":[\"Matériel réseau\",\"Sécurité informatique\"],\"probabilite_achat\":0.6,\"segment\":\"professionnels\",\"recommandations\":[\"Routeurs\",\"Switchs\",\"Firewalls\"]}', '2026-06-28 03:34:22'),
(16, 6, 23, 15, '[]', 32000.00, 1, 32000.00, '{\"centres_interet\":[],\"probabilite_achat\":0.2,\"segment\":\"nouveaux\",\"recommandations\":[\"Présenter des offres de bienvenue pour encourager une nouvelle commande\",\"Proposer des produits phares de Nexio S.A. pour développer les centres d\'intérêt\"]}', '2026-06-28 03:34:23'),
(18, 7, 0, 0, '[\"Périphériques\"]', 0.00, 0, 0.00, '{\"centres_interet\":[\"Périphériques\"],\"probabilite_achat\":0.2,\"segment\":\"nouveaux\",\"recommandations\":[\"Découvrez nos périphériques de qualité\",\"Inscrivez-vous à notre newsletter pour des offres exclusives\"]}', '2026-06-28 03:34:24');

-- --------------------------------------------------------

--
-- Table structure for table `avis`
--

CREATE TABLE `avis` (
  `id_avis` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `note` tinyint(4) NOT NULL DEFAULT 5,
  `commentaire` text DEFAULT NULL,
  `sentiment` varchar(20) DEFAULT NULL,
  `sentiment_score` decimal(4,2) DEFAULT NULL,
  `statut` enum('En attente','Approuvé','Rejeté') DEFAULT 'En attente',
  `date_avis` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `avis`
--

INSERT INTO `avis` (`id_avis`, `id_produit`, `id_user`, `note`, `commentaire`, `sentiment`, `sentiment_score`, `statut`, `date_avis`) VALUES
(1, 1, 2, 5, 'Excellent laptop, rapide et léger, je suis très satisfait !', 'positif', NULL, 'Approuvé', '2026-06-28 06:47:28'),
(2, 9, 3, 5, 'SSD ultra rapide, mon PC a décuplé en performances.', 'positif', NULL, 'Approuvé', '2026-06-28 06:47:28'),
(3, 11, 4, 4, 'Très bon routeur, signal WiFi dans toute la maison.', 'positif', NULL, 'Approuvé', '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `campagnes`
--

CREATE TABLE `campagnes` (
  `id_campagne` int(11) NOT NULL,
  `nom` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `canal` enum('Email','WhatsApp','Facebook','Notification','Multi-canal') DEFAULT 'Email',
  `type` enum('personnalisée','segment','globale') DEFAULT 'globale',
  `segment` varchar(100) DEFAULT NULL,
  `id_user_cible` int(11) DEFAULT NULL,
  `titre_ia` varchar(300) DEFAULT NULL,
  `slogan` varchar(300) DEFAULT NULL,
  `contenu` text DEFAULT NULL,
  `contenu_email` text DEFAULT NULL,
  `contenu_whatsapp` text DEFAULT NULL,
  `contenu_facebook` text DEFAULT NULL,
  `appel_action` varchar(200) DEFAULT NULL,
  `statut` enum('Brouillon','Planifiée','En cours','Envoyée','Terminée','Annulée') NOT NULL DEFAULT 'Brouillon',
  `date_debut` datetime DEFAULT NULL,
  `date_fin` datetime DEFAULT NULL,
  `date_envoi` datetime DEFAULT NULL,
  `nb_destins` int(11) DEFAULT 0,
  `nb_envoyes` int(11) DEFAULT 0,
  `nb_ouverts` int(11) DEFAULT 0,
  `nb_clics` int(11) DEFAULT 0,
  `revenus_generes` decimal(12,2) DEFAULT 0.00,
  `analyse_ia` text DEFAULT NULL,
  `date_creation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campagnes`
--

INSERT INTO `campagnes` (`id_campagne`, `nom`, `description`, `canal`, `type`, `segment`, `id_user_cible`, `titre_ia`, `slogan`, `contenu`, `contenu_email`, `contenu_whatsapp`, `contenu_facebook`, `appel_action`, `statut`, `date_debut`, `date_fin`, `date_envoi`, `nb_destins`, `nb_envoyes`, `nb_ouverts`, `nb_clics`, `revenus_generes`, `analyse_ia`, `date_creation`) VALUES
(1, 'Rentrée Gaming 2025', 'Campagne gamers haïtiens', 'Email', 'segment', 'gamers', NULL, '🎮 La Rentrée Gaming commence chez Nexio !', 'Équipez-vous pour dominer', 'Profitez de nos offres exclusives sur le matériel gaming : GPU ASUS ROG, périphériques Logitech et bien plus encore !', NULL, NULL, NULL, 'Découvrir les offres gaming', 'Envoyée', '2025-08-01 00:00:00', '2025-08-31 00:00:00', NULL, 45, 43, 0, 0, 0.00, NULL, '2026-06-28 06:47:28'),
(2, 'Clients Fidèles — Merci !', 'Récompenses fidélité', 'WhatsApp', 'segment', 'fidèles', NULL, '❤️ Nexio vous remercie de votre fidélité', 'Toujours là pour vous', 'Cher client fidèle, en remerciement de votre confiance, profitez de -10% sur votre prochain achat avec le code NEXIO10.', NULL, NULL, NULL, 'Récupérer mon code', 'Envoyée', '2025-09-01 00:00:00', '2025-09-30 00:00:00', NULL, 120, 115, 0, 0, 0.00, NULL, '2026-06-28 06:47:28'),
(3, 'Soldes Réseau Entreprises', 'Matériel réseau B2B', 'Multi-canal', 'segment', 'entreprises', NULL, '📡 Solutions Réseau Pro à prix réduits', 'Connectez votre succès', 'Switches manageable Cisco, routeurs WiFi 6 et NAS — solutions complètes pour votre infrastructure réseau d\'entreprise.', NULL, NULL, NULL, 'Demander un devis', 'En cours', '2025-10-01 00:00:00', '2025-10-31 00:00:00', NULL, 30, 0, 0, 0, 0.00, NULL, '2026-06-28 06:47:28'),
(4, 'Bienvenue nouveaux clients', 'Onboarding clients', 'Email', 'segment', 'nouveaux', NULL, '🎉 Bienvenue chez Nexio S.A. !', 'Votre aventure tech commence', 'Bienvenue ! Découvrez notre catalogue de plus de 1000 produits informatiques certifiés. Utilisez le code BIENVENUE5 pour -5% sur votre première commande.', NULL, NULL, NULL, 'Voir le catalogue', 'Brouillon', NULL, NULL, NULL, 0, 0, 0, 0, 0.00, NULL, '2026-06-28 06:47:28'),
(5, 'Message Email — Carla — 28/06/2026', NULL, 'Email', 'globale', NULL, NULL, NULL, NULL, 'Chère Carla, nous avons remarqué que vous aimez particulièrement les ordinateurs et les produits réseau. Vous avez récemment acheté l\'ASUS ROG Strix RTX 3060 et le Dell Inspiron 15 3520, et vous avez mis le Seagate Barracuda 2TB dans votre liste de souhaits. Nous vous proposons une offre spéciale de 10% de réduction sur tous les produits de réseau et d\'ordinateurs, y compris le Seagate Barracuda 2TB. Utilisez le code promo CARLA10 pour bénéficier de cette offre.', NULL, NULL, NULL, NULL, 'Brouillon', NULL, NULL, NULL, 0, 0, 0, 0, 0.00, NULL, '2026-06-28 03:30:28'),
(6, 'p001', NULL, 'Email', 'globale', NULL, NULL, NULL, NULL, 'Bonjour Client, <br><br> Nous sommes ravis de vous avoir parmi nos clients. Même si nous ne connaissons pas encore vos préférences, nous sommes là pour vous aider à trouver le matériel informatique dont vous avez besoin. <br><br> Nous vous proposons une découverte de notre sélection de produits pour vous aider à démarrer. Vous pouvez utiliser le code promo NEXIO7 pour bénéficier d\'une réduction sur votre premier achat. <br><br> N\'hésitez pas à nous contacter si vous avez besoin de conseils ou de recommandations. <br><br> Cordialement, Nexio S.A.', NULL, NULL, NULL, NULL, 'Envoyée', NULL, NULL, '2026-06-28 07:31:00', 0, 0, 0, 0, 0.00, NULL, '2026-06-28 03:31:07');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id_categorie` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icone` varchar(50) DEFAULT 'bi-grid'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id_categorie`, `nom`, `description`, `icone`) VALUES
(1, 'Ordinateurs', 'PC de bureau et laptops', 'bi-pc-display'),
(2, 'Réseau', 'Routeurs, switches et câbles', 'bi-wifi'),
(3, 'Stockage', 'SSD, HDD et clés USB', 'bi-device-hdd'),
(4, 'Gaming', 'Matériel pour joueurs', 'bi-controller'),
(5, 'Périphériques', 'Claviers, souris et écrans', 'bi-keyboard'),
(6, 'Sécurité IT', 'Caméras, firewall et antivirus', 'bi-shield-lock'),
(7, 'Téléphonie', 'Smartphones et accessoires', 'bi-phone'),
(8, 'Bureautique', 'Imprimantes, scanners et fournitures', 'bi-printer');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id_msg` int(11) NOT NULL,
  `session_id` varchar(100) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `role` enum('user','assistant') NOT NULL,
  `contenu` text NOT NULL,
  `date_envoi` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id_msg`, `session_id`, `id_user`, `role`, `contenu`, `date_envoi`) VALUES
(1, 'admin_check', 1, 'user', 'ping', '2026-06-28 02:48:15'),
(2, 'admin_check', 1, 'assistant', '[Démo] Service IA non configuré. Ajoutez GROQ_API_KEY dans .env', '2026-06-28 02:48:15'),
(3, 'admin_check', 1, 'user', 'ping', '2026-06-28 02:48:19'),
(4, 'admin_check', 1, 'assistant', '[Démo] Service IA non configuré. Ajoutez GROQ_API_KEY dans .env', '2026-06-28 02:48:19'),
(5, 'admin_check', 1, 'user', 'ping', '2026-06-28 02:48:19'),
(6, 'admin_check', 1, 'assistant', '[Démo] Service IA non configuré. Ajoutez GROQ_API_KEY dans .env', '2026-06-28 02:48:19'),
(7, 'admin_check', 1, 'user', 'ping', '2026-06-28 02:48:20'),
(8, 'admin_check', 1, 'assistant', '[Démo] Service IA non configuré. Ajoutez GROQ_API_KEY dans .env', '2026-06-28 02:48:20'),
(9, 'admin_check', 1, 'user', 'ping', '2026-06-28 02:51:15'),
(10, 'admin_check', 1, 'assistant', 'Bonjour, bienvenue chez Nexio S.A. Je suis là pour vous aider avec vos questions ou vos besoins en matériel informatique. Comment puis-je vous aider aujourd\'hui ?', '2026-06-28 02:51:15'),
(11, 'admin_check', 1, 'user', 'ping', '2026-06-28 02:51:18'),
(12, 'admin_check', 1, 'assistant', 'Désolé, mais il semble que vous n\'ayez pas posé de question ou formulé un besoin spécifique. Pouvez-vous me dire comment je peux vous aider aujourd\'hui ? Nous avons une large gamme de produits, allant des ordinateurs aux périphériques et à la sécurité IT.', '2026-06-28 02:51:18'),
(13, 'admin_check', 1, 'user', 'ping', '2026-06-28 02:53:36'),
(14, 'admin_check', 1, 'assistant', 'Il semble que vous testiez la connexion ou que vous attendiez une réponse, mais vous n\'avez pas posé de question spécifique. Si vous avez un besoin ou une question sur nos produits, tels que les ordinateurs HP EliteBook ou les solutions de stockage Kingston, n\'hésitez pas à me le faire savoir. Sinon, vous pouvez également me demander de vous présenter nos offres spéciales du moment. Comment puis-je vous aider ?', '2026-06-28 02:53:36'),
(15, '8007805b-ecf9-481a-ae23-2299fad94740', 7, 'user', 'hello', '2026-06-28 03:10:51'),
(16, '8007805b-ecf9-481a-ae23-2299fad94740', 7, 'assistant', 'Bonjour ! Bienvenue chez Nexio S.A. Comment puis-je vous aider aujourd\'hui ? Nous sommes ouverts de 8h à 18h, du lundi au samedi, et acceptons les paiements par MonCash, NatCash et Visa.', '2026-06-28 03:10:51'),
(17, 'session', 7, 'user', 'est u grock', '2026-06-28 03:12:55'),
(18, 'session', 7, 'assistant', 'Bienvenue chez Nexio S.A. ! Comment puis-je vous aider aujourd\'hui ? Vous avez besoin d\'informations sur un produit spécifique ou vous souhaitez passer une commande ?', '2026-06-28 03:12:55'),
(19, 'session', 7, 'user', 'j\'aime les appareil cisco', '2026-06-28 03:13:13'),
(20, 'session', 7, 'assistant', 'Bienvenue chez Nexio S.A. ! Nous avons un modèle Cisco disponible, le Cisco SG350-28, qui est un switch réseau de haute qualité. Il est actuellement en stock à hauteur de 4 unités et est proposé à 85 000 HTG. Souhaitez-vous en savoir plus sur ce produit ou passer une commande ?', '2026-06-28 03:13:13'),
(21, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:13:36'),
(22, 'admin_check', 1, 'assistant', 'Je comprends que vous testez la connexion, mais je suis prêt à vous aider dès que vous êtes prêt. Si vous avez besoin d\'aide pour choisir un produit, comme un ordinateur Dell Inspiron ou un disque dur Seagate, ou si vous avez des questions sur nos méthodes de paiement (MonCash, NatCash, Visa), n\'hésitez pas à me le faire savoir. Je suis là pour vous aider. Notre magasin à Delmas, Port-au-Prince, est ouvert de 8h à 18h du lundi au samedi. Comment puis-je vous aider aujourd\'hui ?', '2026-06-28 03:13:36'),
(23, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:13:46'),
(24, 'admin_check', 1, 'assistant', 'Il semble que vous continuiez à tester la connexion. Si vous êtes prêt à recevoir de l\'aide, je suis là pour vous. Nous avons une variété de produits, notamment des ordinateurs HP, des solutions de réseau TP-Link, et des périphériques Logitech. Si vous avez une question spécifique sur un produit ou si vous souhaitez passer une commande, n\'hésitez pas à me le faire savoir. Sinon, je peux vous proposer de vous présenter nos offres spéciales du moment. Notre équipe de support est également disponible pour vous aider si vous avez des questions techniques. Comment puis-je vous aider aujourd\'hui ?', '2026-06-28 03:13:46'),
(25, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:13:46'),
(26, 'admin_check', 1, 'assistant', 'Je vois que vous continuez à tester la connexion. Si vous êtes prêt à discuter, je suis là pour vous aider avec vos besoins en matériel informatique, que ce soit pour choisir un ordinateur comme le Lenovo ThinkPad X1 Carbon, un périphérique comme le Logitech MX Master 3, ou pour obtenir des informations sur nos offres actuelles. N\'hésitez pas à me poser vos questions. Sinon, vous pouvez également contacter notre support directement si vous avez besoin d\'une assistance plus spécifique. Notre magasin à Delmas, Port-au-Prince, est à votre disposition pour toute demande.', '2026-06-28 03:13:46'),
(27, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:13:55'),
(28, 'admin_check', 1, 'assistant', 'Il semble que vous continuiez à tester la connexion sans poser de questions spécifiques. Si vous êtes prêt à discuter, je suis là pour vous aider avec vos besoins en matériel informatique. Sinon, vous pouvez visiter notre magasin à Delmas, Port-au-Prince, ou contacter notre support pour obtenir de l\'aide. Nous acceptons MonCash, NatCash et Visa pour vos achats. Comment puis-je vous aider aujourd\'hui ?', '2026-06-28 03:13:55'),
(29, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:14:36'),
(30, 'admin_check', 1, 'assistant', 'Il semble que vous continuiez à tester la connexion. Je vais vous poser une question : Avez-vous des besoins spécifiques en matériel informatique ou souhaitez-vous obtenir des informations sur nos produits ? Si non, je peux vous suggérer de consulter notre catalogue en ligne ou de nous rendre visite à notre magasin à Delmas, Port-au-Prince. Nous sommes ouverts de 8h à 18h, du lundi au samedi. Si vous avez besoin d\'aide technique, n\'hésitez pas à demander et je ferai de mon mieux pour vous aider ou vous diriger vers notre équipe de support.', '2026-06-28 03:14:36'),
(31, 'session', 7, 'user', 'hello', '2026-06-28 03:18:50'),
(32, 'session', 7, 'assistant', 'Bienvenue ! Nous sommes ravis de voir que vous appréciez les appareils Cisco. Le Cisco SG350-28 est un excellent choix pour les réseaux d\'entreprise, offrant une grande flexibilité et une fiabilité de haute qualité. Si vous souhaitez en savoir plus sur ses caractéristiques techniques ou si vous avez d\'autres questions, n\'hésitez pas à me demander. Nous sommes là pour vous aider. Qu\'est-ce que vous aimeriez savoir sur le Cisco SG350-28 ?', '2026-06-28 03:18:50'),
(33, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:23:16'),
(34, 'admin_check', 1, 'assistant', 'Il semble que vous continuiez à tester la connexion sans poser de questions spécifiques. Je vais vous proposer une dernière fois de discuter de vos besoins en matériel informatique. Si vous avez besoin d\'aide ou de recommandations sur nos produits, tels que des ordinateurs, des périphériques ou des solutions de stockage, n\'hésitez pas à me le faire savoir. Sinon, je vais considérer que notre conversation est terminée. Nous sommes disponibles pour vous aider à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique.', '2026-06-28 03:23:16'),
(35, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:23:40'),
(36, 'admin_check', 1, 'assistant', 'Je constate que vous continuez à tester la connexion sans fournir de contenu significatif. Comme mentionné précédemment, si vous avez des besoins spécifiques en matériel informatique ou des questions techniques, je suis là pour vous aider. Dans le cas contraire, je vais mettre fin à cette conversation. Si vous avez besoin de nous contacter plus tard, n\'hésitez pas à nous rendre visite à Delmas, Port-au-Prince, ou à contacter notre support technique. Nous acceptons les paiements via MonCash, NatCash, Visa, et nous sommes ouverts de 8h à 18h, du lundi au samedi.', '2026-06-28 03:23:40'),
(37, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:27:37'),
(38, 'admin_check', 1, 'assistant', 'Je vais mettre fin à cette conversation, car vous continuez à tester la connexion sans fournir de contenu significatif ou poser des questions spécifiques. Si vous avez besoin d\'aide ou de recommandations sur nos produits, vous pouvez nous contacter à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes ouverts de 8h à 18h, du lundi au samedi, et acceptons les paiements via MonCash, NatCash, Visa. Au revoir.', '2026-06-28 03:27:38'),
(39, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:30'),
(40, 'admin_check', 1, 'assistant', 'Je ne répondrai plus à vos \"ping\" répétitifs. Si vous avez un besoin spécifique en matériel informatique ou une question technique, veuillez nous contacter directement à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes là pour vous aider. Sinon, je considère cette conversation comme terminée.', '2026-06-28 03:29:30'),
(41, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:33'),
(42, 'admin_check', 1, 'assistant', 'Je vais mettre fin à cette conversation. Si vous avez besoin d\'aide, veuillez nous contacter à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes ouverts de 8h à 18h, du lundi au samedi. Au revoir.', '2026-06-28 03:29:33'),
(43, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:34'),
(44, 'admin_check', 1, 'assistant', 'Je vais mettre fin à cette conversation, car vous continuez à tester la connexion sans fournir de contenu significatif ou poser des questions spécifiques. Si vous avez besoin d\'aide ou de recommandations sur nos produits, vous pouvez nous contacter à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes ouverts de 8h à 18h, du lundi au samedi, et acceptons les paiements via MonCash, NatCash, Visa. Au revoir.', '2026-06-28 03:29:34'),
(45, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:34'),
(46, 'admin_check', 1, 'assistant', 'Je vais mettre fin à cette conversation, car vous continuez à tester la connexion sans fournir de contenu significatif ou poser des questions spécifiques. Si vous avez besoin d\'aide ou de recommandations sur nos produits, vous pouvez nous contacter à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes ouverts de 8h à 18h, du lundi au samedi, et acceptons les paiements via MonCash, NatCash, Visa. Au revoir.', '2026-06-28 03:29:34'),
(47, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:35'),
(48, 'admin_check', 1, 'assistant', 'Je vais mettre fin à cette conversation, car vous continuez à tester la connexion sans fournir de contenu significatif ou poser des questions spécifiques. Si vous avez besoin d\'aide ou de recommandations sur nos produits, tels que les ordinateurs HP EliteBook ou les périphériques Logitech, vous pouvez nous contacter à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes ouverts de 8h à 18h, du lundi au samedi, et acceptons les paiements via MonCash, NatCash, Visa. Au revoir.', '2026-06-28 03:29:35'),
(49, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:35'),
(50, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:35'),
(51, 'admin_check', 1, 'assistant', 'Je vais mettre fin à cette conversation, car vous continuez à tester la connexion sans fournir de contenu significatif ou poser des questions spécifiques. Si vous avez besoin d\'aide ou de recommandations sur nos produits, vous pouvez nous contacter à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes ouverts de 8h à 18h, du lundi au samedi, et acceptons les paiements via MonCash, NatCash, Visa. Au revoir.', '2026-06-28 03:29:35'),
(52, 'admin_check', 1, 'assistant', 'Je vais mettre fin à cette conversation, car vous continuez à tester la connexion sans fournir de contenu significatif ou poser des questions spécifiques. Si vous avez besoin d\'aide ou de recommandations sur nos produits, tels que les ordinateurs HP EliteBook ou les périphériques Logitech, vous pouvez nous contacter à notre magasin à Delmas, Port-au-Prince, ou par le biais de notre support technique. Nous sommes ouverts de 8h à 18h, du lundi au samedi, et acceptons les paiements via MonCash, NatCash, Visa. Au revoir.', '2026-06-28 03:29:35'),
(53, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:29:35'),
(54, 'admin_check', 1, 'assistant', 'Je comprends que vous testez la connexion, mais je vous invite à poser une question spécifique ou à demander de l\'aide sur nos produits, tels que nos ordinateurs, périphériques ou solutions de réseau. Nous sommes là pour vous aider. Si vous continuez à tester sans contenu, je serai obligé de mettre fin à cette conversation. Pouvez-vous me dire comment nous pouvons vous aider aujourd\'hui ?', '2026-06-28 03:29:35'),
(55, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:30:08'),
(56, 'admin_check', 1, 'assistant', 'Je vois que vous continuez à tester la connexion. Pour répondre à votre \"ping\", je suis présent et prêt à aider. Cependant, je vous invite à poser une question spécifique ou à demander des informations sur nos produits pour que je puisse vous aider de manière efficace. Nous avons une gamme de produits allant des ordinateurs HP et Dell aux périphériques Logitech et aux solutions de stockage Kingston. Comment puis-je vous aider aujourd\'hui ?', '2026-06-28 03:30:08'),
(57, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:30:09'),
(58, 'admin_check', 1, 'assistant', 'Je vois que vous continuez à tester la connexion. Pourriez-vous s\'il vous plaît me fournir plus de détails sur ce que vous recherchez ou poser une question spécifique sur nos produits ? Nous sommes là pour vous aider avec des recommandations sur les ordinateurs, les périphériques, les solutions de réseau, etc. Nous sommes à votre disposition pour répondre à vos questions.', '2026-06-28 03:30:09'),
(59, 'admin_check', 1, 'user', 'ping', '2026-06-28 03:34:49'),
(60, 'admin_check', 1, 'assistant', 'Je comprends que vous continuez à tester la connexion, mais je vous invite à aller plus loin pour que nous puissions discuter de vos besoins en matière de matériel informatique. Si vous avez besoin d\'aide pour choisir un produit, suivre une commande ou obtenir des informations techniques, n\'hésitez pas à me le faire savoir. Sinon, je peux simplement confirmer que je suis présent et prêt à aider lorsque vous serez prêt à discuter. Nous sommes ouverts de 8h à 18h, du lundi au samedi, et nous acceptons les paiements par MonCash, NatCash et Visa. Comment puis-je vous aider aujourd\'hui ?', '2026-06-28 03:34:50');

-- --------------------------------------------------------

--
-- Table structure for table `commandes`
--

CREATE TABLE `commandes` (
  `id_commande` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `montant` decimal(12,2) NOT NULL DEFAULT 0.00,
  `statut` enum('En attente','Confirmée','Expédiée','Livrée','Annulée') NOT NULL DEFAULT 'En attente',
  `adresse_livraison` text DEFAULT NULL,
  `date_commande` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `commandes`
--

INSERT INTO `commandes` (`id_commande`, `id_user`, `montant`, `statut`, `adresse_livraison`, `date_commande`) VALUES
(1, 2, 85000.00, 'Livrée', 'Delmas 33, Port-au-Prince', '2026-04-29 06:47:28'),
(2, 3, 71500.00, 'Livrée', 'Pétion-Ville, Rue Faubert', '2026-05-14 06:47:28'),
(3, 4, 62000.00, 'Livrée', 'Carrefour, Haïti', '2026-05-29 06:47:28'),
(4, 5, 22500.00, 'Expédiée', 'Tabarre, Port-au-Prince', '2026-06-18 06:47:28'),
(5, 2, 110000.00, 'Confirmée', 'Delmas 33, Port-au-Prince', '2026-06-23 06:47:28'),
(6, 3, 14000.00, 'En attente', 'Pétion-Ville', '2026-06-26 06:47:28'),
(7, 6, 32000.00, 'En attente', 'Cité Soleil, Haïti', '2026-06-27 06:47:28'),
(8, 4, 75000.00, 'Confirmée', 'Carrefour, Haïti', '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `details_commandes`
--

CREATE TABLE `details_commandes` (
  `id_detail` int(11) NOT NULL,
  `id_commande` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1,
  `prix` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `details_commandes`
--

INSERT INTO `details_commandes` (`id_detail`, `id_commande`, `id_produit`, `quantite`, `prix`) VALUES
(1, 1, 1, 1, 85000.00),
(2, 2, 14, 1, 15000.00),
(3, 2, 2, 1, 62000.00),
(4, 3, 2, 1, 62000.00),
(5, 4, 7, 1, 8500.00),
(6, 4, 20, 1, 14000.00),
(7, 5, 3, 1, 110000.00),
(8, 6, 8, 1, 14000.00),
(9, 7, 16, 1, 32000.00),
(10, 8, 12, 1, 75000.00);

-- --------------------------------------------------------

--
-- Table structure for table `feedbacks`
--

CREATE TABLE `feedbacks` (
  `id_feedback` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `note` tinyint(4) NOT NULL DEFAULT 5,
  `type_feedback` enum('Expérience','Problème','Suggestion','Commentaire') DEFAULT 'Expérience',
  `commentaire` text DEFAULT NULL,
  `statut` enum('En attente','Approuvé','Rejeté') NOT NULL DEFAULT 'En attente',
  `sentiment` varchar(20) DEFAULT NULL,
  `sentiment_score` decimal(4,2) DEFAULT NULL,
  `date_feedback` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `feedbacks`
--

INSERT INTO `feedbacks` (`id_feedback`, `id_user`, `nom`, `email`, `note`, `type_feedback`, `commentaire`, `statut`, `sentiment`, `sentiment_score`, `date_feedback`) VALUES
(1, 2, NULL, NULL, 5, 'Expérience', 'Excellent service ! Mon HP EliteBook est arrivé rapidement et en parfait état. Je recommande vivement Nexio S.A.', 'Approuvé', 'positif', NULL, '2026-06-28 06:47:28'),
(2, 3, NULL, NULL, 5, 'Expérience', 'Super plateforme ! Les prix sont compétitifs et le support via NEX est vraiment utile. Je reviendrai !', 'Approuvé', 'positif', NULL, '2026-06-28 06:47:28'),
(3, 4, NULL, NULL, 4, 'Expérience', 'Bonne expérience globale. La livraison était rapide et les produits de qualité.', 'Approuvé', 'positif', NULL, '2026-06-28 06:47:28'),
(4, 5, NULL, NULL, 5, 'Expérience', 'Je recommande à 100% ! L\'assistant NEX m\'a aidé à choisir le bon routeur pour mon bureau.', 'Approuvé', 'positif', NULL, '2026-06-28 06:47:28'),
(5, NULL, NULL, NULL, 3, 'Problème', 'Le délai de livraison était un peu plus long que prévu, mais le produit était conforme.', 'En attente', 'neutre', NULL, '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `fournisseurs`
--

CREATE TABLE `fournisseurs` (
  `id_fournisseur` int(11) NOT NULL,
  `nom` varchar(200) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `adresse` varchar(300) DEFAULT NULL,
  `pays` varchar(100) DEFAULT NULL,
  `statut` enum('Actif','Inactif') NOT NULL DEFAULT 'Actif',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fournisseurs`
--

INSERT INTO `fournisseurs` (`id_fournisseur`, `nom`, `email`, `telephone`, `adresse`, `pays`, `statut`, `date_creation`) VALUES
(1, 'Tech Import Haiti', 'import@techhaiti.ht', '509-3712-5000', NULL, 'Haïti', 'Actif', '2026-06-28 06:47:28'),
(2, 'Global IT Supplies', 'sales@globalit.com', '+1-305-555-0100', NULL, 'USA', 'Actif', '2026-06-28 06:47:28'),
(3, 'Lenovo Latin America', 'lenovo@lamed.com', '+55-11-3054-0000', NULL, 'Brésil', 'Actif', '2026-06-28 06:47:28'),
(4, 'HP Caribbean', 'hpcarib@hp.com', '+1-809-200-1000', NULL, 'République Dominicaine', 'Actif', '2026-06-28 06:47:28'),
(5, 'Seagate Distribution', 'distrib@seagate.com', '+1-408-658-1000', NULL, 'USA', 'Actif', '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `interactions`
--

CREATE TABLE `interactions` (
  `id_interaction` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `id_produit` int(11) NOT NULL,
  `action` varchar(50) NOT NULL DEFAULT 'view',
  `page` varchar(100) DEFAULT NULL,
  `date_interaction` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `interactions`
--

INSERT INTO `interactions` (`id_interaction`, `id_user`, `id_produit`, `action`, `page`, `date_interaction`) VALUES
(1, 2, 1, 'view', 'produit', '2026-06-28 06:47:28'),
(2, 2, 12, 'view', 'produit', '2026-06-28 06:47:28'),
(3, 2, 3, 'wishlist', 'produit', '2026-06-28 06:47:28'),
(4, 3, 9, 'view', 'produit', '2026-06-28 06:47:28'),
(5, 3, 13, 'view', 'produit', '2026-06-28 06:47:28'),
(6, 4, 11, 'view', 'produit', '2026-06-28 06:47:28'),
(7, 5, 6, 'view', 'produit', '2026-06-28 06:47:28'),
(8, 5, 7, 'view', 'produit', '2026-06-28 06:47:28'),
(9, 7, 16, 'view', 'produit', '2026-06-28 03:11:12');

-- --------------------------------------------------------

--
-- Table structure for table `journal_activites`
--

CREATE TABLE `journal_activites` (
  `id_log` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `action` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `ip_adresse` varchar(50) DEFAULT NULL,
  `date_action` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `journal_activites`
--

INSERT INTO `journal_activites` (`id_log`, `id_user`, `action`, `description`, `ip_adresse`, `date_action`) VALUES
(1, 1, 'connexion', 'Connexion de Nexio Admin', '127.0.0.1', '2026-06-28 06:47:28'),
(2, 2, 'connexion', 'Connexion de Marie Dupont', '192.168.1.10', '2026-06-28 06:47:28'),
(3, 1, 'produit_ajout', 'Nouveau produit : ASUS ROG Zephyrus G14', '127.0.0.1', '2026-06-28 06:47:28'),
(4, 1, 'connexion', 'Connexion de Nexio Admin', '::1', '2026-06-28 02:51:08'),
(5, 1, 'connexion', 'Connexion de Nexio Admin', '::1', '2026-06-28 03:01:51'),
(6, 7, 'connexion', 'Connexion de Hans Voltaire', '::1', '2026-06-28 03:08:58'),
(7, 1, 'connexion', 'Connexion de Nexio Admin', '::1', '2026-06-28 03:16:36'),
(8, 7, 'connexion', 'Connexion de Hans Voltaire', '::1', '2026-06-28 03:18:44'),
(9, 1, 'connexion', 'Connexion de Nexio Admin', '::1', '2026-06-28 03:22:36'),
(10, 1, 'connexion', 'Connexion de Nexio Admin', '::1', '2026-06-28 03:27:28'),
(11, 1, 'connexion', 'Connexion de Nexio Admin', '::1', '2026-06-28 03:34:14');

-- --------------------------------------------------------

--
-- Table structure for table `log_analyses_ia`
--

CREATE TABLE `log_analyses_ia` (
  `id` int(11) NOT NULL,
  `agent` varchar(50) NOT NULL,
  `action` varchar(100) NOT NULL,
  `statut` enum('succès','erreur','en_cours') DEFAULT 'succès',
  `duree_ms` int(11) DEFAULT 0,
  `tokens_utilises` int(11) DEFAULT 0,
  `detail` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `log_analyses_ia`
--

INSERT INTO `log_analyses_ia` (`id`, `agent`, `action`, `statut`, `duree_ms`, `tokens_utilises`, `detail`, `created_at`) VALUES
(1, 'AgentMessage', 'message_personnalise', 'succès', 0, 0, '{\"id_user\":\"2\",\"canal\":\"Email\"}', '2026-06-28 02:48:38'),
(2, 'AgentMessage', 'message_personnalise', 'succès', 0, 0, '{\"id_user\":\"2\",\"canal\":\"Email\"}', '2026-06-28 02:49:21'),
(3, 'AgentMessage', 'message_personnalise', 'succès', 0, 0, '{\"id_user\":\"2\",\"canal\":\"Email\"}', '2026-06-28 02:51:27'),
(4, 'AgentMessage', 'message_personnalise', 'succès', 0, 0, '{\"id_user\":\"7\",\"canal\":\"Email\"}', '2026-06-28 03:27:45'),
(5, 'AgentMessage', 'message_personnalise', 'succès', 0, 0, '{\"id_user\":4,\"canal\":\"Email\"}', '2026-06-28 03:30:14'),
(6, 'AgentMessage', 'message_personnalise', 'succès', 0, 0, '{\"id_user\":\"7\",\"canal\":\"Email\"}', '2026-06-28 03:30:56'),
(7, 'AgentComportemental', 'analyser_tous', 'succès', 0, 0, '{\"nb_ok\":6,\"nb_err\":0}', '2026-06-28 03:34:24');

-- --------------------------------------------------------

--
-- Table structure for table `marques`
--

CREATE TABLE `marques` (
  `id_marque` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `pays_origine` varchar(50) DEFAULT NULL,
  `logo_url` varchar(300) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `marques`
--

INSERT INTO `marques` (`id_marque`, `nom`, `pays_origine`, `logo_url`) VALUES
(1, 'Dell', 'USA', NULL),
(2, 'HP', 'USA', NULL),
(3, 'Lenovo', 'Chine', NULL),
(4, 'Apple', 'USA', NULL),
(5, 'Samsung', 'Corée du Sud', NULL),
(6, 'ASUS', 'Taiwan', NULL),
(7, 'TP-Link', 'Chine', NULL),
(8, 'Logitech', 'Suisse', NULL),
(9, 'Kingston', 'USA', NULL),
(10, 'Seagate', 'USA', NULL),
(11, 'Western Digital', 'USA', NULL),
(12, 'Nvidia', 'USA', NULL),
(13, 'AMD', 'USA', NULL),
(14, 'Cisco', 'USA', NULL),
(15, 'MSI', 'Taiwan', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `messages_contact`
--

CREATE TABLE `messages_contact` (
  `id_contact` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `sujet` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `statut` enum('Non lu','Lu','Répondu') NOT NULL DEFAULT 'Non lu',
  `date_envoi` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages_contact`
--

INSERT INTO `messages_contact` (`id_contact`, `nom`, `email`, `sujet`, `message`, `statut`, `date_envoi`) VALUES
(1, 'Jean Mackenson', 'jmackenson@gmail.com', 'Demande de prix groupé', 'Bonjour, je suis directeur IT d\'une entreprise de 50 employés. Pouvez-vous me faire une offre pour 10 PC bureaux Dell ?', 'Non lu', '2026-06-28 06:47:28'),
(2, 'Sophie Lafleur', 'sophie.lafleur@hotmail.com', 'Problème commande', 'Ma commande #00005 devrait être livrée depuis 3 jours mais je n\'ai aucune nouvelle.', 'Lu', '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `messages_marketing`
--

CREATE TABLE `messages_marketing` (
  `id_msg` int(11) NOT NULL,
  `id_campagne` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `canal` varchar(50) NOT NULL,
  `contenu` text NOT NULL,
  `statut` enum('Envoyé','Ouvert','Cliqué','Échec') DEFAULT 'Envoyé',
  `date_envoi` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `paiements`
--

CREATE TABLE `paiements` (
  `id_paiement` int(11) NOT NULL,
  `id_commande` int(11) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  `methode` enum('MonCash','NatCash','Visa','Espèces') NOT NULL DEFAULT 'MonCash',
  `statut` enum('En attente','Payé','Échoué') NOT NULL DEFAULT 'En attente',
  `date_paiement` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `paiements`
--

INSERT INTO `paiements` (`id_paiement`, `id_commande`, `montant`, `methode`, `statut`, `date_paiement`) VALUES
(1, 1, 85000.00, 'MonCash', 'Payé', '2026-06-28 06:47:28'),
(2, 2, 71500.00, 'NatCash', 'Payé', '2026-06-28 06:47:28'),
(3, 3, 62000.00, 'MonCash', 'Payé', '2026-06-28 06:47:28'),
(4, 4, 22500.00, 'Visa', 'Payé', '2026-06-28 06:47:28'),
(5, 5, 110000.00, 'MonCash', 'En attente', '2026-06-28 06:47:28'),
(6, 6, 14000.00, 'MonCash', 'En attente', '2026-06-28 06:47:28'),
(7, 7, 32000.00, 'Espèces', 'En attente', '2026-06-28 06:47:28'),
(8, 8, 75000.00, 'NatCash', 'En attente', '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `panier`
--

CREATE TABLE `panier` (
  `id_panier` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1,
  `date_ajout` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `preferences_utilisateur`
--

CREATE TABLE `preferences_utilisateur` (
  `id_pref` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `email_marketing` tinyint(1) NOT NULL DEFAULT 1,
  `notif_whatsapp` tinyint(1) NOT NULL DEFAULT 0,
  `notif_app` tinyint(1) NOT NULL DEFAULT 1,
  `recommandations_nex` tinyint(1) NOT NULL DEFAULT 1,
  `alerte_prix` tinyint(1) NOT NULL DEFAULT 1,
  `alerte_stock` tinyint(1) NOT NULL DEFAULT 1,
  `promo_newsletter` tinyint(1) NOT NULL DEFAULT 1,
  `campagne_facebook` tinyint(1) NOT NULL DEFAULT 0,
  `categories_interets` text DEFAULT NULL,
  `budget_min` int(11) DEFAULT NULL,
  `budget_max` int(11) DEFAULT NULL,
  `frequence` enum('immédiat','quotidien','hebdomadaire') NOT NULL DEFAULT 'quotidien',
  `date_modif` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produits`
--

CREATE TABLE `produits` (
  `id_produit` int(11) NOT NULL,
  `id_sous_categorie` int(11) DEFAULT NULL,
  `id_marque` int(11) DEFAULT NULL,
  `id_fournisseur` int(11) DEFAULT NULL,
  `nom` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `prix` decimal(12,2) NOT NULL DEFAULT 0.00,
  `cout` decimal(12,2) DEFAULT NULL,
  `quantite` int(11) NOT NULL DEFAULT 0,
  `seuil_alerte` int(11) NOT NULL DEFAULT 5,
  `image` varchar(500) DEFAULT NULL,
  `garantie` varchar(50) DEFAULT NULL,
  `statut` enum('Disponible','Rupture','Bientôt disponible') NOT NULL DEFAULT 'Disponible',
  `date_ajout` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produits`
--

INSERT INTO `produits` (`id_produit`, `id_sous_categorie`, `id_marque`, `id_fournisseur`, `nom`, `description`, `prix`, `cout`, `quantite`, `seuil_alerte`, `image`, `garantie`, `statut`, `date_ajout`) VALUES
(1, 1, 2, 1, 'HP EliteBook 840 G9', 'Laptop professionnel 14\", Intel Core i7, 16GB RAM, 512GB SSD, Windows 11 Pro', 85000.00, 70000.00, 8, 3, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(2, 1, 1, 1, 'Dell Inspiron 15 3520', 'Laptop 15.6\", Intel Core i5, 8GB RAM, 256GB SSD, parfait pour étudiants', 62000.00, 50000.00, 12, 5, 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(3, 1, 3, 3, 'Lenovo ThinkPad X1 Carbon', 'Ultrabook business 14\", i7 12th gen, 16GB RAM, 1TB SSD, léger 1.12kg', 110000.00, 90000.00, 5, 2, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&q=80', '2 ans', 'Disponible', '2026-06-28 06:47:28'),
(4, 2, 1, 1, 'Dell OptiPlex 7090', 'PC bureau compact, Intel Core i5, 8GB RAM, 500GB HDD, Windows 11', 45000.00, 36000.00, 10, 4, 'https://images.unsplash.com/photo-1593640408182-31c228f16b50?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(5, 2, 2, 4, 'HP ProDesk 400 G9', 'PC bureau tour, Intel Core i3, 8GB RAM, 256GB SSD, clavier/souris inclus', 38000.00, 30000.00, 7, 3, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(6, 5, 7, 1, 'TP-Link Archer AX73', 'Routeur WiFi 6 double bande, 5400 Mbps, 6 antennes, idéal bureau/maison', 18500.00, 14000.00, 20, 5, 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(7, 6, 7, 1, 'TP-Link TL-SG108', 'Switch 8 ports Gigabit, non manageable, plug & play, boîtier métal', 8500.00, 6500.00, 25, 8, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(8, 6, 14, 2, 'Cisco SG350-28', 'Switch manageable 28 ports Gigabit, VLAN, QoS, idéal PME', 85000.00, 68000.00, 4, 2, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80', '3 ans', 'Disponible', '2026-06-28 06:47:28'),
(9, 9, 9, 2, 'Kingston SSD A400 480GB', 'SSD SATA 2.5\", vitesse lecture 500MB/s, améliore drastiquement les performances', 9500.00, 7000.00, 30, 8, 'https://images.unsplash.com/photo-1597225244516-7b8a7ecfd28f?w=400&q=80', '3 ans', 'Disponible', '2026-06-28 06:47:28'),
(10, 9, 9, 2, 'Kingston SSD NV2 1TB NVMe', 'SSD M.2 NVMe PCIe 4.0, lecture 3500MB/s, idéal gaming et création contenu', 18000.00, 13500.00, 15, 5, 'https://images.unsplash.com/photo-1597225244516-7b8a7ecfd28f?w=400&q=80', '3 ans', 'Disponible', '2026-06-28 06:47:28'),
(11, 10, 10, 5, 'Seagate Barracuda 2TB', 'Disque dur interne 3.5\", 7200 RPM, SATA 6Gb/s, cache 256MB', 12000.00, 9500.00, 18, 5, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=400&q=80', '2 ans', 'Disponible', '2026-06-28 06:47:28'),
(12, 13, 12, 2, 'ASUS ROG Strix RTX 3060', 'Carte graphique 12GB GDDR6, HDMI 2.1, idéale gaming et design 3D', 75000.00, 60000.00, 6, 2, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', '3 ans', 'Disponible', '2026-06-28 06:47:28'),
(13, 13, 15, 2, 'MSI GeForce RTX 4060 Ti', 'Carte graphique 16GB GDDR6X, DLSS 3, ray tracing, encodeur AV1', 92000.00, 74000.00, 4, 2, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80', '3 ans', 'Disponible', '2026-06-28 06:47:28'),
(14, 17, 8, 1, 'Logitech MX Keys', 'Clavier sans fil premium, rétroéclairé, compatible multi-appareils, frappe silencieuse', 15000.00, 11000.00, 15, 5, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(15, 18, 8, 1, 'Logitech MX Master 3', 'Souris sans fil ergonomique, 8000 DPI, molette MagSpeed, compatible tous OS', 14000.00, 10500.00, 20, 6, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(16, 19, 5, 1, 'Samsung 27\" Monitor S27C310', 'Écran 27\", Full HD 1080p, IPS, 75Hz, Eye Care, HDMI+VGA', 32000.00, 25000.00, 9, 3, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(17, 21, NULL, 1, 'Caméra IP Dahua 4MP', 'Caméra de surveillance extérieure, vision nocturne 30m, résolution 4MP, IP67', 22000.00, 17000.00, 12, 4, 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(18, 25, 5, 1, 'Samsung Galaxy A54', 'Smartphone 6.4\", 128GB, 8GB RAM, triple caméra 50MP, batterie 5000mAh', 42000.00, 34000.00, 14, 5, 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(19, 11, 8, 1, 'Logitech G502 Hero', 'Souris gaming filaire, 25600 DPI, 11 boutons programmables, poids ajustable', 10500.00, 8000.00, 22, 6, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', '2 ans', 'Disponible', '2026-06-28 06:47:28'),
(20, 12, 9, 2, 'Kingston USB 64GB DataTraveler', 'Clé USB 3.2 Gen 1, vitesse lecture 100MB/s, boîtier métal durable', 2500.00, 1800.00, 50, 10, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&q=80', '5 ans', 'Disponible', '2026-06-28 06:47:28'),
(21, 28, 2, 4, 'HP LaserJet Pro M15w', 'Imprimante laser monochrome WiFi, 18ppm, compacte, toner inclus', 28000.00, 22000.00, 7, 2, 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&q=80', '1 an', 'Disponible', '2026-06-28 06:47:28'),
(22, 16, 6, 1, 'ASUS ROG Zephyrus G14', 'PC gaming 14\" AMD Ryzen 9, RTX 3060, 16GB RAM, 1TB NVMe, 120Hz', 135000.00, 108000.00, 3, 1, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&q=80', '2 ans', 'Disponible', '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `profils_ia`
--

CREATE TABLE `profils_ia` (
  `id_profil` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `centres_interet` text DEFAULT NULL,
  `score_achat` int(11) DEFAULT 0,
  `probabilite_achat` decimal(5,2) DEFAULT 0.00,
  `categorie_preferee` varchar(100) DEFAULT NULL,
  `budget_moyen` decimal(12,2) DEFAULT 0.00,
  `frequence_achat` varchar(50) DEFAULT NULL,
  `segment` varchar(100) DEFAULT NULL,
  `comportement` text DEFAULT NULL,
  `recommandations` text DEFAULT NULL,
  `derniere_analyse` datetime DEFAULT NULL,
  `date_creation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `publicites`
--

CREATE TABLE `publicites` (
  `id_pub` int(11) NOT NULL,
  `titre` varchar(200) NOT NULL,
  `contenu` text NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `lien` varchar(500) DEFAULT NULL,
  `segment_cible` varchar(100) DEFAULT NULL,
  `categorie_cible` int(11) DEFAULT NULL,
  `statut` enum('Active','Inactive') DEFAULT 'Active',
  `impressions` int(11) DEFAULT 0,
  `clics` int(11) DEFAULT 0,
  `date_creation` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `publicites`
--

INSERT INTO `publicites` (`id_pub`, `titre`, `contenu`, `image_url`, `lien`, `segment_cible`, `categorie_cible`, `statut`, `impressions`, `clics`, `date_creation`) VALUES
(1, '💻 Laptops HP à partir de 62 000 HTG', 'Découvrez notre sélection de laptops HP professionnels, garantie 1 an, livraison rapide.', NULL, '/', 'standard', 1, 'Active', 0, 0, '2026-06-28 06:47:28'),
(2, '🎮 Gaming Power — GPU RTX disponible !', 'Cartes graphiques ASUS ROG et MSI en stock. Parfait pour gaming et design 3D.', NULL, '/', 'gamers', 4, 'Active', 0, 0, '2026-06-28 06:47:28'),
(3, '📡 Réseau d\'entreprise — Cisco & TP-Link', 'Switches, routeurs WiFi 6 et solutions réseau complètes pour PME.', NULL, '/', 'entreprises', 2, 'Active', 0, 0, '2026-06-28 06:47:28');

-- --------------------------------------------------------

--
-- Table structure for table `recommandations`
--

CREATE TABLE `recommandations` (
  `id_reco` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `score` decimal(4,2) DEFAULT 0.50,
  `raison` varchar(255) DEFAULT NULL,
  `date_reco` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id_role` int(11) NOT NULL,
  `nom` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id_role`, `nom`) VALUES
(1, 'Administrateur'),
(2, 'Client'),
(3, 'Employé');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `sid` varchar(36) NOT NULL,
  `expires` datetime NOT NULL,
  `data` text NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `user_role` varchar(50) DEFAULT NULL,
  `user_email` varchar(150) DEFAULT NULL,
  `user_name` varchar(200) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sous_categories`
--

CREATE TABLE `sous_categories` (
  `id_sous_categorie` int(11) NOT NULL,
  `id_categorie` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sous_categories`
--

INSERT INTO `sous_categories` (`id_sous_categorie`, `id_categorie`, `nom`) VALUES
(1, 1, 'Laptops'),
(2, 1, 'PC Bureau'),
(3, 1, 'All-in-One'),
(4, 1, 'Stations de travail'),
(5, 2, 'Routeurs WiFi'),
(6, 2, 'Switches'),
(7, 2, 'Câbles réseau'),
(8, 2, 'Points d\'accès'),
(9, 3, 'SSD'),
(10, 3, 'HDD'),
(11, 3, 'Clés USB'),
(12, 3, 'Cartes mémoire'),
(13, 4, 'Cartes graphiques'),
(14, 4, 'Manettes'),
(15, 4, 'Casques gaming'),
(16, 4, 'PC gaming'),
(17, 5, 'Claviers'),
(18, 5, 'Souris'),
(19, 5, 'Écrans'),
(20, 5, 'Webcams'),
(21, 6, 'Caméras IP'),
(22, 6, 'Antivirus'),
(23, 6, 'Firewall'),
(24, 6, 'Onduleurs'),
(25, 7, 'Smartphones'),
(26, 7, 'Accessoires mobiles'),
(27, 7, 'Tablettes'),
(28, 8, 'Imprimantes'),
(29, 8, 'Scanners'),
(30, 8, 'Projecteurs');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id_user` int(11) NOT NULL,
  `id_role` int(11) NOT NULL DEFAULT 2,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL DEFAULT '',
  `pseudo` varchar(80) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `telephone` varchar(30) DEFAULT NULL,
  `adresse` text DEFAULT NULL,
  `statut` enum('Actif','Inactif') NOT NULL DEFAULT 'Actif',
  `date_creation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id_user`, `id_role`, `nom`, `prenom`, `pseudo`, `email`, `mot_de_passe`, `telephone`, `adresse`, `statut`, `date_creation`) VALUES
(1, 1, 'Admin', 'Nexio', NULL, 'admin@nexio.com', '$2b$12$6F370SrxD1ro5gH5nLx0ouMZSstXX6VpIPLGp19xExBgR5pN/48ny', '4810-8541', NULL, 'Actif', '2026-06-28 06:47:28'),
(2, 2, 'Dupont', 'Marie', NULL, 'client@nexio.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uEutDBsLy', '3712-0001', NULL, 'Actif', '2026-06-28 06:47:28'),
(3, 2, 'Pierre', 'Jean', NULL, 'jean@nexio.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uEutDBsLy', '3712-0002', NULL, 'Actif', '2026-06-28 06:47:28'),
(4, 2, 'François', 'Carla', NULL, 'carla@nexio.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uEutDBsLy', '3712-0003', NULL, 'Actif', '2026-06-28 06:47:28'),
(5, 2, 'Bastien', 'Paul', NULL, 'paul@nexio.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uEutDBsLy', '3712-0004', NULL, 'Actif', '2026-06-28 06:47:28'),
(6, 2, 'Joseph', 'Marc', NULL, 'marc@nexio.com', '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uEutDBsLy', NULL, NULL, 'Actif', '2026-06-28 06:47:28'),
(7, 2, 'Voltaire', 'Hans', NULL, 'olaurent352@gmail.com', '$2a$12$8P6YnrJPzt11eCMHPf7mduKh29uVLYSXbma/iA8N8IzRpXRd0hhHS', NULL, NULL, 'Actif', '2026-06-28 03:08:55');

-- --------------------------------------------------------

--
-- Table structure for table `wishlist`
--

CREATE TABLE `wishlist` (
  `id_wish` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_produit` int(11) NOT NULL,
  `date_ajout` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `wishlist`
--

INSERT INTO `wishlist` (`id_wish`, `id_user`, `id_produit`, `date_ajout`) VALUES
(1, 2, 3, '2026-06-28 06:47:28'),
(2, 2, 12, '2026-06-28 06:47:28'),
(3, 3, 13, '2026-06-28 06:47:28'),
(4, 4, 11, '2026-06-28 06:47:28');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `analyses_comportementales`
--
ALTER TABLE `analyses_comportementales`
  ADD PRIMARY KEY (`id_analyse`),
  ADD UNIQUE KEY `id_user` (`id_user`);

--
-- Indexes for table `avis`
--
ALTER TABLE `avis`
  ADD PRIMARY KEY (`id_avis`),
  ADD KEY `id_produit` (`id_produit`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `campagnes`
--
ALTER TABLE `campagnes`
  ADD PRIMARY KEY (`id_campagne`),
  ADD KEY `id_user_cible` (`id_user_cible`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id_categorie`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id_msg`),
  ADD KEY `idx_session` (`session_id`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `idx_chat_session` (`session_id`);

--
-- Indexes for table `commandes`
--
ALTER TABLE `commandes`
  ADD PRIMARY KEY (`id_commande`),
  ADD KEY `idx_commandes_statut` (`statut`),
  ADD KEY `idx_commandes_user` (`id_user`),
  ADD KEY `idx_commandes_date` (`date_commande`);

--
-- Indexes for table `details_commandes`
--
ALTER TABLE `details_commandes`
  ADD PRIMARY KEY (`id_detail`),
  ADD KEY `id_commande` (`id_commande`),
  ADD KEY `id_produit` (`id_produit`);

--
-- Indexes for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD PRIMARY KEY (`id_feedback`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `idx_feedbacks_statut` (`statut`);

--
-- Indexes for table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  ADD PRIMARY KEY (`id_fournisseur`);

--
-- Indexes for table `interactions`
--
ALTER TABLE `interactions`
  ADD PRIMARY KEY (`id_interaction`),
  ADD KEY `id_produit` (`id_produit`),
  ADD KEY `idx_interactions_user` (`id_user`);

--
-- Indexes for table `journal_activites`
--
ALTER TABLE `journal_activites`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `id_user` (`id_user`),
  ADD KEY `idx_journal_date` (`date_action`);

--
-- Indexes for table `log_analyses_ia`
--
ALTER TABLE `log_analyses_ia`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `marques`
--
ALTER TABLE `marques`
  ADD PRIMARY KEY (`id_marque`);

--
-- Indexes for table `messages_contact`
--
ALTER TABLE `messages_contact`
  ADD PRIMARY KEY (`id_contact`);

--
-- Indexes for table `messages_marketing`
--
ALTER TABLE `messages_marketing`
  ADD PRIMARY KEY (`id_msg`),
  ADD KEY `id_campagne` (`id_campagne`),
  ADD KEY `id_user` (`id_user`);

--
-- Indexes for table `paiements`
--
ALTER TABLE `paiements`
  ADD PRIMARY KEY (`id_paiement`),
  ADD KEY `id_commande` (`id_commande`);

--
-- Indexes for table `panier`
--
ALTER TABLE `panier`
  ADD PRIMARY KEY (`id_panier`),
  ADD UNIQUE KEY `uq_user_prod` (`id_user`,`id_produit`),
  ADD KEY `id_produit` (`id_produit`);

--
-- Indexes for table `preferences_utilisateur`
--
ALTER TABLE `preferences_utilisateur`
  ADD PRIMARY KEY (`id_pref`),
  ADD UNIQUE KEY `id_user` (`id_user`);

--
-- Indexes for table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id_produit`),
  ADD KEY `id_sous_categorie` (`id_sous_categorie`),
  ADD KEY `id_marque` (`id_marque`),
  ADD KEY `id_fournisseur` (`id_fournisseur`),
  ADD KEY `idx_produits_statut` (`statut`);

--
-- Indexes for table `profils_ia`
--
ALTER TABLE `profils_ia`
  ADD PRIMARY KEY (`id_profil`),
  ADD UNIQUE KEY `id_user` (`id_user`);

--
-- Indexes for table `publicites`
--
ALTER TABLE `publicites`
  ADD PRIMARY KEY (`id_pub`),
  ADD KEY `categorie_cible` (`categorie_cible`);

--
-- Indexes for table `recommandations`
--
ALTER TABLE `recommandations`
  ADD PRIMARY KEY (`id_reco`),
  ADD UNIQUE KEY `uq_reco` (`id_user`,`id_produit`),
  ADD KEY `id_produit` (`id_produit`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_role`),
  ADD UNIQUE KEY `nom` (`nom`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`sid`),
  ADD KEY `expires_idx` (`expires`);

--
-- Indexes for table `sous_categories`
--
ALTER TABLE `sous_categories`
  ADD PRIMARY KEY (`id_sous_categorie`),
  ADD KEY `id_categorie` (`id_categorie`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `id_role` (`id_role`);

--
-- Indexes for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD PRIMARY KEY (`id_wish`),
  ADD UNIQUE KEY `uq_wish` (`id_user`,`id_produit`),
  ADD KEY `id_produit` (`id_produit`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `analyses_comportementales`
--
ALTER TABLE `analyses_comportementales`
  MODIFY `id_analyse` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `avis`
--
ALTER TABLE `avis`
  MODIFY `id_avis` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `campagnes`
--
ALTER TABLE `campagnes`
  MODIFY `id_campagne` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id_categorie` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id_msg` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `commandes`
--
ALTER TABLE `commandes`
  MODIFY `id_commande` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `details_commandes`
--
ALTER TABLE `details_commandes`
  MODIFY `id_detail` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `feedbacks`
--
ALTER TABLE `feedbacks`
  MODIFY `id_feedback` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `fournisseurs`
--
ALTER TABLE `fournisseurs`
  MODIFY `id_fournisseur` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `interactions`
--
ALTER TABLE `interactions`
  MODIFY `id_interaction` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `journal_activites`
--
ALTER TABLE `journal_activites`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `log_analyses_ia`
--
ALTER TABLE `log_analyses_ia`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `marques`
--
ALTER TABLE `marques`
  MODIFY `id_marque` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `messages_contact`
--
ALTER TABLE `messages_contact`
  MODIFY `id_contact` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `messages_marketing`
--
ALTER TABLE `messages_marketing`
  MODIFY `id_msg` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `paiements`
--
ALTER TABLE `paiements`
  MODIFY `id_paiement` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `panier`
--
ALTER TABLE `panier`
  MODIFY `id_panier` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `preferences_utilisateur`
--
ALTER TABLE `preferences_utilisateur`
  MODIFY `id_pref` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produits`
--
ALTER TABLE `produits`
  MODIFY `id_produit` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `profils_ia`
--
ALTER TABLE `profils_ia`
  MODIFY `id_profil` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `publicites`
--
ALTER TABLE `publicites`
  MODIFY `id_pub` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `recommandations`
--
ALTER TABLE `recommandations`
  MODIFY `id_reco` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id_role` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `sous_categories`
--
ALTER TABLE `sous_categories`
  MODIFY `id_sous_categorie` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `wishlist`
--
ALTER TABLE `wishlist`
  MODIFY `id_wish` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `analyses_comportementales`
--
ALTER TABLE `analyses_comportementales`
  ADD CONSTRAINT `analyses_comportementales_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `avis`
--
ALTER TABLE `avis`
  ADD CONSTRAINT `avis_ibfk_1` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE,
  ADD CONSTRAINT `avis_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `campagnes`
--
ALTER TABLE `campagnes`
  ADD CONSTRAINT `campagnes_ibfk_1` FOREIGN KEY (`id_user_cible`) REFERENCES `users` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `commandes`
--
ALTER TABLE `commandes`
  ADD CONSTRAINT `commandes_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `details_commandes`
--
ALTER TABLE `details_commandes`
  ADD CONSTRAINT `details_commandes_ibfk_1` FOREIGN KEY (`id_commande`) REFERENCES `commandes` (`id_commande`) ON DELETE CASCADE,
  ADD CONSTRAINT `details_commandes_ibfk_2` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE;

--
-- Constraints for table `feedbacks`
--
ALTER TABLE `feedbacks`
  ADD CONSTRAINT `feedbacks_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `interactions`
--
ALTER TABLE `interactions`
  ADD CONSTRAINT `interactions_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL,
  ADD CONSTRAINT `interactions_ibfk_2` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE;

--
-- Constraints for table `journal_activites`
--
ALTER TABLE `journal_activites`
  ADD CONSTRAINT `journal_activites_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `messages_marketing`
--
ALTER TABLE `messages_marketing`
  ADD CONSTRAINT `messages_marketing_ibfk_1` FOREIGN KEY (`id_campagne`) REFERENCES `campagnes` (`id_campagne`) ON DELETE CASCADE,
  ADD CONSTRAINT `messages_marketing_ibfk_2` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `paiements`
--
ALTER TABLE `paiements`
  ADD CONSTRAINT `paiements_ibfk_1` FOREIGN KEY (`id_commande`) REFERENCES `commandes` (`id_commande`) ON DELETE CASCADE;

--
-- Constraints for table `panier`
--
ALTER TABLE `panier`
  ADD CONSTRAINT `panier_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `panier_ibfk_2` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE;

--
-- Constraints for table `preferences_utilisateur`
--
ALTER TABLE `preferences_utilisateur`
  ADD CONSTRAINT `preferences_utilisateur_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `produits_ibfk_1` FOREIGN KEY (`id_sous_categorie`) REFERENCES `sous_categories` (`id_sous_categorie`) ON DELETE SET NULL,
  ADD CONSTRAINT `produits_ibfk_2` FOREIGN KEY (`id_marque`) REFERENCES `marques` (`id_marque`) ON DELETE SET NULL,
  ADD CONSTRAINT `produits_ibfk_3` FOREIGN KEY (`id_fournisseur`) REFERENCES `fournisseurs` (`id_fournisseur`) ON DELETE SET NULL;

--
-- Constraints for table `profils_ia`
--
ALTER TABLE `profils_ia`
  ADD CONSTRAINT `profils_ia_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `publicites`
--
ALTER TABLE `publicites`
  ADD CONSTRAINT `publicites_ibfk_1` FOREIGN KEY (`categorie_cible`) REFERENCES `categories` (`id_categorie`) ON DELETE SET NULL;

--
-- Constraints for table `recommandations`
--
ALTER TABLE `recommandations`
  ADD CONSTRAINT `recommandations_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `recommandations_ibfk_2` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE;

--
-- Constraints for table `sous_categories`
--
ALTER TABLE `sous_categories`
  ADD CONSTRAINT `sous_categories_ibfk_1` FOREIGN KEY (`id_categorie`) REFERENCES `categories` (`id_categorie`) ON DELETE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`id_role`) REFERENCES `roles` (`id_role`);

--
-- Constraints for table `wishlist`
--
ALTER TABLE `wishlist`
  ADD CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`id_produit`) REFERENCES `produits` (`id_produit`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
