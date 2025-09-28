-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 28, 2025 at 03:50 PM
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
-- Database: `sadproject_improved`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_plans`
--

CREATE TABLE `activity_plans` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `activity_name` varchar(255) NOT NULL,
  `activity_purpose` text NOT NULL,
  `category` enum('minor','normal','urgent') NOT NULL DEFAULT 'normal',
  `status` enum('pending','under_revision','approved','completed') NOT NULL DEFAULT 'pending',
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `objectives` text DEFAULT NULL,
  `participants` text DEFAULT NULL,
  `methodology` text DEFAULT NULL,
  `expected_outcome` text DEFAULT NULL,
  `activity_location` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_plan_files`
--

CREATE TABLE `activity_plan_files` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `activity_plan_id` bigint(20) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_type` varchar(100) DEFAULT NULL,
  `file_size` bigint(20) UNSIGNED DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `announcements`
--

CREATE TABLE `announcements` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text NOT NULL,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('efficiadmin_cache_5a5b0f9b7d3f8fc84c3cef8fd8efaaa6c70d75ab', 'i:1;', 1759037782),
('efficiadmin_cache_5a5b0f9b7d3f8fc84c3cef8fd8efaaa6c70d75ab:timer', 'i:1759037782;', 1759037782),
('efficiadmin_cache_5c785c036466adea360111aa28563bfd556b5fba', 'i:1;', 1759067397),
('efficiadmin_cache_5c785c036466adea360111aa28563bfd556b5fba:timer', 'i:1759067397;', 1759067397),
('efficiadmin_cache_a72b20062ec2c47ab2ceb97ac1bee818f8b6c6cb', 'i:1;', 1758975353),
('efficiadmin_cache_a72b20062ec2c47ab2ceb97ac1bee818f8b6c6cb:timer', 'i:1758975353;', 1758975353),
('efficiadmin_cache_b888b29826bb53dc531437e723738383d8339b56', 'i:2;', 1759066491),
('efficiadmin_cache_b888b29826bb53dc531437e723738383d8339b56:timer', 'i:1759066491;', 1759066491);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `commentable_id` bigint(20) UNSIGNED NOT NULL,
  `commentable_type` varchar(50) NOT NULL,
  `text` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `parent_id` bigint(20) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `equipment`
--

CREATE TABLE `equipment` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `category_id` bigint(20) UNSIGNED DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_consumable` tinyint(1) NOT NULL DEFAULT 0,
  `total_quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `equipment`
--

INSERT INTO `equipment` (`id`, `category_id`, `name`, `description`, `is_consumable`, `total_quantity`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 2, 'TV', 'Smart TV for presentations', 0, 3, 1, '2025-08-27 06:28:35', '2025-09-23 10:59:25'),
(2, 1, 'Speaker', 'Portable speakers', 0, 5, 1, '2025-08-27 06:28:35', '2025-09-25 08:11:59'),
(3, 2, 'Projector', 'Full HD projector', 0, 2, 1, '2025-08-27 06:28:35', '2025-09-25 07:54:23'),
(4, 3, 'HDMI Cable', '2-meter cable', 0, 10, 1, '2025-08-27 06:28:35', '2025-09-27 21:34:43');

-- --------------------------------------------------------

--
-- Table structure for table `equipment_categories`
--

CREATE TABLE `equipment_categories` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `equipment_categories`
--

INSERT INTO `equipment_categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Audio', 'Sound-related equipment', '2025-08-27 06:46:21', '2025-08-27 06:46:21'),
(2, 'Visual', 'Display and projection equipment', '2025-08-27 06:46:21', '2025-08-27 06:46:21'),
(3, 'Accessories', 'Cables and small accessories', '2025-08-27 06:46:21', '2025-08-27 06:46:21');

-- --------------------------------------------------------

--
-- Table structure for table `equipment_requests`
--

CREATE TABLE `equipment_requests` (
  `id` int(11) NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `activity_plan_id` bigint(20) UNSIGNED DEFAULT NULL,
  `category` enum('minor','normal','urgent') NOT NULL DEFAULT 'normal',
  `purpose` varchar(255) NOT NULL,
  `status` enum('pending','under_revision','approved','completed','denied','cancelled','checked_out','returned','overdue') NOT NULL DEFAULT 'pending',
  `start_datetime` datetime NOT NULL,
  `end_datetime` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `equipment_request_items`
--

CREATE TABLE `equipment_request_items` (
  `id` int(11) NOT NULL,
  `equipment_request_id` int(11) NOT NULL,
  `equipment_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `description` text DEFAULT NULL,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invitation_tokens`
--

CREATE TABLE `invitation_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `token` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('dean','admin_assistant') NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `reason` text DEFAULT NULL,
  `invited_by` bigint(20) UNSIGNED NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_sent_at` timestamp NULL DEFAULT NULL,
  `send_count` int(11) NOT NULL DEFAULT 1,
  `used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invitation_tokens`
--

INSERT INTO `invitation_tokens` (`id`, `token`, `email`, `role`, `first_name`, `middle_name`, `last_name`, `reason`, `invited_by`, `expires_at`, `last_sent_at`, `send_count`, `used_at`, `created_at`, `updated_at`) VALUES
(1, 'RAusGiSMdtV1SMxXrksNyxh09w7b6A4ygpsvnglitwQYOJ69QeVReUDgwI2hs5Lq', 'stephencraine245666@gmail.com', 'admin_assistant', 'stephen test', 'jimenez', 'nailes', NULL, 59, '2025-09-28 13:23:25', NULL, 1, '2025-09-28 05:23:25', '2025-09-28 05:22:26', '2025-09-28 05:23:25');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `likes`
--

CREATE TABLE `likes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `likeable_id` bigint(20) UNSIGNED NOT NULL,
  `likeable_type` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `likes`
--

INSERT INTO `likes` (`id`, `user_id`, `likeable_id`, `likeable_type`, `created_at`, `updated_at`) VALUES
(4, 59, 8, 'events', '2025-09-23 11:07:23', '2025-09-23 11:07:23'),
(5, 69, 8, 'events', '2025-09-23 11:10:59', '2025-09-23 11:10:59'),
(7, 59, 16, 'events', '2025-09-25 10:02:41', '2025-09-25 10:02:41'),
(8, 59, 26, 'events', '2025-09-25 10:25:42', '2025-09-25 10:25:42');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2024_12_20_000000_add_profile_fields_to_users_table', 2),
(5, '2025_09_21_085619_create_notifications_table', 3),
(6, '2025_09_21_090849_drop_notifications_table', 4),
(7, '2025_09_21_095932_add_viewed_at_to_request_approvals_table', 5),
(8, '2025_09_21_124110_create_notifications_table', 6),
(9, '2025_09_20_000000_create_request_approvals_table', 7),
(10, '2025_09_22_100427_add_user_id_to_events_and_announcements_tables', 7),
(11, '2025_09_22_160618_add_parent_id_to_comments_table', 7),
(12, '2025_09_22_160627_create_likes_table', 7),
(13, '2025_09_22_170000_normalize_polymorphic_types', 7),
(14, '2025_09_23_000001_add_details_columns_to_activity_plans', 7),
(15, '2025_09_23_000002_add_user_id_to_announcements_and_events', 7),
(16, '2025_09_23_000003_add_parent_id_to_comments_table', 7),
(17, '2025_09_23_000004_create_likes_table', 7),
(18, '2025_09_23_000005_add_foreign_keys_to_equipment_request_items', 8),
(19, '2025_09_28_000001_create_role_current_holders_table', 9),
(20, '2025_09_28_000002_create_role_handover_logs_table', 9),
(21, '2025_09_28_122827_create_invitation_tokens_table', 10),
(22, '2025_09_28_132620_add_resend_fields_to_invitation_tokens_table', 11);

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `action_url` varchar(255) DEFAULT NULL,
  `priority` enum('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post_images`
--

CREATE TABLE `post_images` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `imageable_type` varchar(255) NOT NULL,
  `imageable_id` bigint(20) UNSIGNED NOT NULL,
  `path` varchar(255) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `mime_type` varchar(255) NOT NULL,
  `size` bigint(20) NOT NULL,
  `width` int(11) DEFAULT NULL,
  `height` int(11) DEFAULT NULL,
  `order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `request_approvals`
--

CREATE TABLE `request_approvals` (
  `id` bigint(20) NOT NULL,
  `request_type` enum('equipment','activity_plan') NOT NULL,
  `request_id` bigint(20) NOT NULL,
  `category` enum('minor','normal','urgent') NOT NULL DEFAULT 'normal',
  `approver_role` enum('admin_assistant','dean') NOT NULL,
  `approver_id` bigint(20) UNSIGNED DEFAULT NULL,
  `status` enum('pending','approved','revision_requested') DEFAULT 'pending',
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `viewed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `role_current_holders`
--

CREATE TABLE `role_current_holders` (
  `role` enum('dean','admin_assistant') NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `switched_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_current_holders`
--

INSERT INTO `role_current_holders` (`role`, `user_id`, `switched_at`, `created_at`, `updated_at`) VALUES
('dean', 60, '2025-09-28 02:43:39', '2025-09-28 02:43:39', '2025-09-28 02:43:39'),
('admin_assistant', 80, '2025-09-28 05:23:25', '2025-09-28 02:43:39', '2025-09-28 05:23:25');

-- --------------------------------------------------------

--
-- Table structure for table `role_handover_logs`
--

CREATE TABLE `role_handover_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `role` enum('dean','admin_assistant') NOT NULL,
  `from_user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `to_user_id` bigint(20) UNSIGNED NOT NULL,
  `performed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_handover_logs`
--

INSERT INTO `role_handover_logs` (`id`, `role`, `from_user_id`, `to_user_id`, `performed_by`, `reason`, `created_at`, `updated_at`) VALUES
(1, 'admin_assistant', 59, 80, 59, NULL, '2025-09-28 05:23:25', '2025-09-28 05:23:25');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('DezuYuPOF6rFKY5PbLhYFzYthMnOpvWZQD9xvl30', 80, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YTo1OntzOjY6Il90b2tlbiI7czo0MDoieW9VSTUyRzdkR2hSRlBVYzI1dnp4V3JqR3Fnc3F6NnlrS1JBTXhZOCI7czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6Mzc6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9hZG1pbi9kYXNoYm9hcmQiO31zOjY6Il9mbGFzaCI7YToyOntzOjM6Im9sZCI7YTowOnt9czozOiJuZXciO2E6MDp7fX1zOjUwOiJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI7aTo4MDtzOjM6InVybCI7YToxOntzOjg6ImludGVuZGVkIjtzOjM3OiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvYWRtaW4vZGFzaGJvYXJkIjt9fQ==', 1759066444),
('z9oQW2R2zWW18S3aWEOMD7gWI7tOtWHHTEG5Ynij', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiWlJLZGlnVXRxbGF6Sk45Um1mdVN3MEIzTDlHQWlST3BUVzNwWjJkWSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo5OiJfcHJldmlvdXMiO2E6MTp7czozOiJ1cmwiO3M6NDI6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMC9sb2dpbj9sb2dvdXQ9c3VjY2VzcyI7fX0=', 1759067343);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `middle_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `role` enum('student','admin_assistant','dean') NOT NULL DEFAULT 'student',
  `profile_picture` varchar(255) DEFAULT NULL,
  `school_id_number` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `contact_number` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `middle_name`, `last_name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`, `role`, `profile_picture`, `school_id_number`, `date_of_birth`, `address`, `city`, `province`, `region`, `contact_number`) VALUES
(59, 'Admin', 'User', 'Assistant', 'admin@example.com', '2025-08-03 05:21:41', '$2y$12$LFD4leE6mimXj6mYyzLEduS1ab6aHsKFuZckp55hcHY5PWTVLyY2O', 'dmDpbMrmDETaZj1Djt2YiygNV6srlbaVE3migHWhSWE45Q8XVGGbdtwPMekj', '2025-08-03 05:21:41', '2025-09-28 13:49:03', 'admin_assistant', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(60, 'Dean', 'User', 'User', 'dean@example.com', '2025-08-03 05:22:49', '$2y$12$6hmAl4SM3Ggw5L1IULgjAe9PtoTitJUzxmDIic9R.Q2ntf/FvKr8q', 'ibkkNr7jCAju738EP8PlXQoGanWgsniedm8uJTnE0Mta9Wj4gp8X6TO1hNrr', '2025-08-03 05:22:49', '2025-09-28 09:12:20', 'dean', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(69, 'Stephen Craine', 'Jimenez', 'Nailes', 'stephencraine24@gmail.com', '2025-09-08 08:49:41', '$2y$12$IPY/xRmAgsVQ491WvMP.0exv0IpKfDFLFZ7B0M7ilMuLHRZ74sKu6', NULL, '2025-09-08 08:49:15', '2025-09-25 06:49:02', 'student', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(80, 'stephen test', 'jimenez', 'nailes', 'stephencraine245666@gmail.com', '2025-09-28 05:34:02', '$2y$12$vR9cXqifQUXzwRtNEfvFyun8RzDZTZPoulnY8lwkqmkG/hbczfLcu', NULL, '2025-09-28 05:23:25', '2025-09-28 05:34:02', 'admin_assistant', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_plans`
--
ALTER TABLE `activity_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_activity_requests_user` (`user_id`),
  ADD KEY `activity_requests_status_idx` (`status`),
  ADD KEY `activity_requests_user_start_idx` (`user_id`,`start_datetime`),
  ADD KEY `activity_requests_start_end_idx` (`start_datetime`,`end_datetime`);
ALTER TABLE `activity_plans` ADD FULLTEXT KEY `ft_activity_purpose` (`activity_purpose`);

--
-- Indexes for table `activity_plan_files`
--
ALTER TABLE `activity_plan_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_request_file` (`activity_plan_id`),
  ADD KEY `activity_request_files_activity_id_idx` (`activity_plan_id`),
  ADD KEY `activity_request_files_type_idx` (`file_type`);

--
-- Indexes for table `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `announcements_date_idx` (`date`),
  ADD KEY `announcements_user_id_foreign` (`user_id`);
ALTER TABLE `announcements` ADD FULLTEXT KEY `ft_announcements_description` (`description`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `comments_user_id_index` (`user_id`),
  ADD KEY `comments_commentable_index` (`commentable_id`,`commentable_type`),
  ADD KEY `comments_parent_id_index` (`parent_id`);

--
-- Indexes for table `equipment_requests`
--
ALTER TABLE `equipment_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_equipment_requests_activity_plan` (`activity_plan_id`),
  ADD KEY `fk_equipment_requests_user` (`user_id`);

--
-- Indexes for table `equipment_request_items`
--
ALTER TABLE `equipment_request_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `equipment_request_items_equipment_request_id_index` (`equipment_request_id`),
  ADD KEY `equipment_request_items_equipment_id_index` (`equipment_id`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD KEY `events_date_idx` (`date`),
  ADD KEY `events_user_id_foreign` (`user_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `invitation_tokens`
--
ALTER TABLE `invitation_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invitation_tokens_token_unique` (`token`),
  ADD KEY `invitation_tokens_invited_by_foreign` (`invited_by`),
  ADD KEY `invitation_tokens_token_expires_at_index` (`token`,`expires_at`),
  ADD KEY `invitation_tokens_email_role_index` (`email`,`role`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`),
  ADD KEY `jobs_created_at_idx` (`created_at`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `likes_user_id_likeable_id_likeable_type_unique` (`user_id`,`likeable_id`,`likeable_type`),
  ADD KEY `likes_likeable_id_likeable_type_index` (`likeable_id`,`likeable_type`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id_read_at_index` (`user_id`,`read_at`),
  ADD KEY `notifications_user_id_created_at_index` (`user_id`,`created_at`),
  ADD KEY `notifications_type_index` (`type`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `post_images`
--
ALTER TABLE `post_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `post_images_imageable_type_imageable_id_index` (`imageable_type`,`imageable_id`);

--
-- Indexes for table `request_approvals`
--
ALTER TABLE `request_approvals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_request_approvals_request` (`request_type`,`request_id`),
  ADD KEY `fk_request_approvals_approver` (`approver_id`);

--
-- Indexes for table `role_current_holders`
--
ALTER TABLE `role_current_holders`
  ADD PRIMARY KEY (`role`),
  ADD KEY `role_current_holders_user_id_index` (`user_id`);

--
-- Indexes for table `role_handover_logs`
--
ALTER TABLE `role_handover_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `role_handover_logs_from_user_id_foreign` (`from_user_id`),
  ADD KEY `role_handover_logs_to_user_id_foreign` (`to_user_id`),
  ADD KEY `role_handover_logs_performed_by_foreign` (`performed_by`),
  ADD KEY `role_handover_logs_role_created_at_index` (`role`,`created_at`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_role_index` (`role`);
ALTER TABLE `users` ADD FULLTEXT KEY `ft_users_name` (`first_name`,`last_name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_plans`
--
ALTER TABLE `activity_plans`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `activity_plan_files`
--
ALTER TABLE `activity_plan_files`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `equipment_requests`
--
ALTER TABLE `equipment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=55;

--
-- AUTO_INCREMENT for table `equipment_request_items`
--
ALTER TABLE `equipment_request_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invitation_tokens`
--
ALTER TABLE `invitation_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `likes`
--
ALTER TABLE `likes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=69;

--
-- AUTO_INCREMENT for table `post_images`
--
ALTER TABLE `post_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `request_approvals`
--
ALTER TABLE `request_approvals`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `role_handover_logs`
--
ALTER TABLE `role_handover_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=81;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_plans`
--
ALTER TABLE `activity_plans`
  ADD CONSTRAINT `fk_activity_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_plan_files`
--
ALTER TABLE `activity_plan_files`
  ADD CONSTRAINT `fk_activity_plan_files_plan` FOREIGN KEY (`activity_plan_id`) REFERENCES `activity_plans` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_request_file` FOREIGN KEY (`activity_plan_id`) REFERENCES `activity_plans` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `announcements`
--
ALTER TABLE `announcements`
  ADD CONSTRAINT `announcements_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `comments`
--
ALTER TABLE `comments`
  ADD CONSTRAINT `comments_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `comments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `equipment_requests`
--
ALTER TABLE `equipment_requests`
  ADD CONSTRAINT `fk_equipment_requests_activity_plan` FOREIGN KEY (`activity_plan_id`) REFERENCES `activity_plans` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_equipment_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `equipment_request_items`
--
ALTER TABLE `equipment_request_items`
  ADD CONSTRAINT `equipment_request_items_equipment_request_id_foreign` FOREIGN KEY (`equipment_request_id`) REFERENCES `equipment_requests` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `events`
--
ALTER TABLE `events`
  ADD CONSTRAINT `events_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invitation_tokens`
--
ALTER TABLE `invitation_tokens`
  ADD CONSTRAINT `invitation_tokens_invited_by_foreign` FOREIGN KEY (`invited_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `likes`
--
ALTER TABLE `likes`
  ADD CONSTRAINT `likes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `request_approvals`
--
ALTER TABLE `request_approvals`
  ADD CONSTRAINT `fk_request_approvals_approver` FOREIGN KEY (`approver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `role_current_holders`
--
ALTER TABLE `role_current_holders`
  ADD CONSTRAINT `role_current_holders_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `role_handover_logs`
--
ALTER TABLE `role_handover_logs`
  ADD CONSTRAINT `role_handover_logs_from_user_id_foreign` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `role_handover_logs_performed_by_foreign` FOREIGN KEY (`performed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `role_handover_logs_to_user_id_foreign` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
