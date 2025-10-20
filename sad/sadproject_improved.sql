-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 20, 2025 at 06:40 PM
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
  `category` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('draft','pending','under_revision','approved','completed') NOT NULL DEFAULT 'draft',
  `current_file_id` bigint(20) UNSIGNED DEFAULT NULL,
  `pdf_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `activity_plan_dean_signatures`
--

CREATE TABLE `activity_plan_dean_signatures` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `activity_plan_id` bigint(20) UNSIGNED NOT NULL,
  `dean_id` bigint(20) UNSIGNED NOT NULL,
  `signature_data` text NOT NULL,
  `position_x` decimal(8,2) NOT NULL,
  `position_y` decimal(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
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
  `document_data` mediumtext DEFAULT NULL,
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
('efficiadmin_cache_5c785c036466adea360111aa28563bfd556b5fba', 'i:2;', 1760975402),
('efficiadmin_cache_5c785c036466adea360111aa28563bfd556b5fba:timer', 'i:1760975402;', 1760975402),
('efficiadmin_cache_7224f997fc148baa0b7f81c1eda6fcc3fd003db0', 'i:5;', 1760978490),
('efficiadmin_cache_7224f997fc148baa0b7f81c1eda6fcc3fd003db0:timer', 'i:1760978490;', 1760978490),
('efficiadmin_cache_dbc0f004854457f59fb16ab863a3a1722cef553f', 'i:2;', 1760975409),
('efficiadmin_cache_dbc0f004854457f59fb16ab863a3a1722cef553f:timer', 'i:1760975409;', 1760975409);

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
-- Table structure for table `email_verification_codes`
--

CREATE TABLE `email_verification_codes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `code` varchar(6) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
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
(1, 2, 'TV', 'Smart TV for presentations', 0, 3, 1, '2025-08-27 06:28:35', '2025-10-18 20:28:43'),
(2, 1, 'Speaker', 'Portable speakers', 0, 5, 1, '2025-08-27 06:28:35', '2025-10-18 20:28:43'),
(3, 2, 'Projector', 'Full HD projector', 0, 2, 1, '2025-08-27 06:28:35', '2025-10-18 20:28:43'),
(4, 3, 'HDMI Cable', '2-meter cable', 0, 10, 1, '2025-08-27 06:28:35', '2025-10-18 20:28:43');

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
  `category` enum('low','medium','high') DEFAULT 'medium',
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
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
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

--
-- Dumping data for table `jobs`
--

INSERT INTO `jobs` (`id`, `queue`, `payload`, `attempts`, `reserved_at`, `available_at`, `created_at`) VALUES
(4, 'default', '{\"uuid\":\"80bd8f66-e38b-49ab-9a2c-cefab25480e0\",\"displayName\":\"App\\\\Mail\\\\RoleUpdateApproved\",\"job\":\"Illuminate\\\\Queue\\\\CallQueuedHandler@call\",\"maxTries\":null,\"maxExceptions\":null,\"failOnTimeout\":false,\"backoff\":null,\"timeout\":null,\"retryUntil\":null,\"data\":{\"commandName\":\"Illuminate\\\\Mail\\\\SendQueuedMailable\",\"command\":\"O:34:\\\"Illuminate\\\\Mail\\\\SendQueuedMailable\\\":15:{s:8:\\\"mailable\\\";O:27:\\\"App\\\\Mail\\\\RoleUpdateApproved\\\":3:{s:12:\\\"requestModel\\\";O:45:\\\"Illuminate\\\\Contracts\\\\Database\\\\ModelIdentifier\\\":5:{s:5:\\\"class\\\";s:28:\\\"App\\\\Models\\\\RoleUpdateRequest\\\";s:2:\\\"id\\\";i:3;s:9:\\\"relations\\\";a:1:{i:0;s:4:\\\"user\\\";}s:10:\\\"connection\\\";s:5:\\\"mysql\\\";s:15:\\\"collectionClass\\\";N;}s:2:\\\"to\\\";a:1:{i:0;a:2:{s:4:\\\"name\\\";N;s:7:\\\"address\\\";s:27:\\\"stephencraine2456@gmail.com\\\";}}s:6:\\\"mailer\\\";s:4:\\\"smtp\\\";}s:5:\\\"tries\\\";N;s:7:\\\"timeout\\\";N;s:13:\\\"maxExceptions\\\";N;s:17:\\\"shouldBeEncrypted\\\";b:0;s:10:\\\"connection\\\";N;s:5:\\\"queue\\\";N;s:5:\\\"delay\\\";N;s:11:\\\"afterCommit\\\";N;s:10:\\\"middleware\\\";a:0:{}s:7:\\\"chained\\\";a:0:{}s:15:\\\"chainConnection\\\";N;s:10:\\\"chainQueue\\\";N;s:19:\\\"chainCatchCallbacks\\\";N;s:3:\\\"job\\\";N;}\"},\"createdAt\":1759992650,\"delay\":null}', 0, NULL, 1759992650, 1759992650);

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
(22, '2025_09_28_132620_add_resend_fields_to_invitation_tokens_table', 11),
(23, '2025_09_28_135800_add_inactive_roles_to_users_table', 12),
(24, '2025_10_07_000001_create_role_update_requests_table', 13),
(25, '2025_10_07_162608_add_verification_fields_to_role_update_requests_table', 14),
(26, '2025_10_07_163525_add_is_estimated_date_to_role_update_requests_table', 15),
(27, '2025_10_07_164238_drop_is_estimated_date_from_role_update_requests_table', 16),
(28, '2025_10_08_192823_add_student_officer_to_users_role_enum', 17),
(29, '2025_10_09_000000_create_email_verification_codes_table', 18),
(30, '2025_10_10_000001_create_activity_plan_signatures_table', 19),
(31, '2025_10_10_000003_update_activity_plans_for_document_only', 20),
(32, '2025_10_10_030245_add_draft_status_to_activity_plans_table', 21),
(33, '2025_10_17_000001_add_pdf_path_to_activity_plans_table', 22),
(34, '2025_10_18_211016_add_start_end_datetime_to_events_and_announcements_tables', 23),
(35, '2025_10_18_230000_drop_datetime_fields_from_announcements', 24),
(36, '2025_10_19_000001_add_document_data_to_activity_plan_files_table', 25),
(37, '2025_10_19_000200_alter_document_data_mediumtext', 26),
(38, '2025_10_20_163020_create_activity_plan_dean_signatures_table', 27),
(39, '2025_10_20_185153_drop_activity_plan_signatures_table', 28),
(40, '2025_10_20_225726_add_indexes_to_notifications_table', 29),
(41, '2025_10_21_000001_update_priority_values_to_low_medium_high', 30);

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
  `priority` enum('low','medium','high') DEFAULT 'medium',
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
  `category` enum('low','medium','high') DEFAULT 'medium',
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
('dean', 103, '2025-10-17 22:06:01', '2025-10-17 22:06:01', '2025-10-17 22:06:01'),
('admin_assistant', 102, '2025-10-17 22:06:01', '2025-10-17 22:06:01', '2025-10-17 22:06:01');

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

-- --------------------------------------------------------

--
-- Table structure for table `role_update_requests`
--

CREATE TABLE `role_update_requests` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `requested_role` varchar(255) NOT NULL,
  `officer_organization` varchar(255) DEFAULT NULL,
  `officer_position` varchar(255) DEFAULT NULL,
  `election_date` date DEFAULT NULL,
  `term_duration` varchar(255) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `role_update_requests`
--

INSERT INTO `role_update_requests` (`id`, `user_id`, `requested_role`, `officer_organization`, `officer_position`, `election_date`, `term_duration`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `remarks`, `created_at`, `updated_at`) VALUES
(6, 101, 'student_officer', 'SITES', 'Mayor', '2025-04-24', '1_semester', 'test', 'approved', 102, '2025-10-18 20:26:53', NULL, '2025-10-18 20:21:41', '2025-10-18 20:26:53');

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
('9JP8DNNx7fo3y46tS6f6iLkSh82K2u2AuXFogJvS', 106, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'YTo0OntzOjY6Il90b2tlbiI7czo0MDoicVZnc0h2c3kxN2VwZUF5dXRSREhqMU02SXRLblh6TE4wd2cwQmxibCI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319czo1MDoibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiO2k6MTA2O3M6OToiX3ByZXZpb3VzIjthOjE6e3M6MzoidXJsIjtzOjQyOiJodHRwOi8vMTI3LjAuMC4xOjgwMDAvc3R1ZGVudC9hY3Rpdml0eS1sb2ciO319', 1760978436),
('QyczwVZc9Ye0KjF7dHbR12pfhdBcXtFhVEWYEklt', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36', 'YToyOntzOjY6Il90b2tlbiI7czo0MDoiMnZ5ZnJBU29UN1pOWnlEeTFYaGxIUklFOHRNbU9sUExpTGtENDNkaSI7czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1760972970);

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
  `role` enum('student','student_officer','admin_assistant','dean') NOT NULL DEFAULT 'student',
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
(101, 'stephen craine', 'J', 'selian', 'stephencraine24@gmail.com', '2025-10-17 22:04:24', '$2y$12$uZK9FO2OTQONhPMpMxbzj.k5xDNwWYfTVvNiQP4yOcK0wto1RMmSa', NULL, '2025-10-17 22:03:43', '2025-10-18 20:26:53', 'student_officer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(102, 'Admin', NULL, 'Assistant', 'admin@example.com', '2025-10-17 22:06:01', '$2y$12$/oL3mACZ5zpwZhXs58bDeO8liV0V.RGl9.SuicL87TiZ3XRHE7uAq', NULL, '2025-10-17 22:06:01', '2025-10-17 22:06:01', 'admin_assistant', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 'Dean', NULL, 'User', 'dean@example.com', '2025-10-17 22:06:01', '$2y$12$h9iMmuHepEIhkEd0idDst.LliwnucjnbGY0WI8fggWLbH70r45RFW', NULL, '2025-10-17 22:06:01', '2025-10-17 22:06:01', 'dean', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(106, 'stephen craine', 'adsdsdd', 'asddsad', 'stephencraine2456@gmail.com', '2025-10-20 15:08:51', '$2y$12$DQv4C8Wk3L7YKaNonbJiC.buErRjSMl7bE2vWe4kCbVjLIh.rCHle', NULL, '2025-10-20 15:08:30', '2025-10-20 15:08:51', 'student', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

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
  ADD KEY `activity_requests_user_start_idx` (`user_id`),
  ADD KEY `activity_plans_current_file_id_foreign` (`current_file_id`);

--
-- Indexes for table `activity_plan_dean_signatures`
--
ALTER TABLE `activity_plan_dean_signatures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `activity_plan_dean_signatures_activity_plan_id_foreign` (`activity_plan_id`),
  ADD KEY `activity_plan_dean_signatures_dean_id_foreign` (`dean_id`);

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
-- Indexes for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email_verification_codes_user_id_unique` (`user_id`),
  ADD KEY `email_verification_codes_user_id_code_index` (`user_id`,`code`);

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
  ADD KEY `notifications_type_index` (`type`),
  ADD KEY `notifications_user_created_idx` (`user_id`,`created_at`),
  ADD KEY `notifications_user_read_idx` (`user_id`,`read_at`),
  ADD KEY `notifications_user_priority_read_idx` (`user_id`,`priority`,`read_at`),
  ADD KEY `notifications_user_type_idx` (`user_id`,`type`);

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
-- Indexes for table `role_update_requests`
--
ALTER TABLE `role_update_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `role_update_requests_user_id_foreign` (`user_id`),
  ADD KEY `role_update_requests_reviewed_by_foreign` (`reviewed_by`);

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=185;

--
-- AUTO_INCREMENT for table `activity_plan_dean_signatures`
--
ALTER TABLE `activity_plan_dean_signatures`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `activity_plan_files`
--
ALTER TABLE `activity_plan_files`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=973;

--
-- AUTO_INCREMENT for table `announcements`
--
ALTER TABLE `announcements`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `equipment_requests`
--
ALTER TABLE `equipment_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=77;

--
-- AUTO_INCREMENT for table `equipment_request_items`
--
ALTER TABLE `equipment_request_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=112;

--
-- AUTO_INCREMENT for table `events`
--
ALTER TABLE `events`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

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
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `likes`
--
ALTER TABLE `likes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=208;

--
-- AUTO_INCREMENT for table `post_images`
--
ALTER TABLE `post_images`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `request_approvals`
--
ALTER TABLE `request_approvals`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=113;

--
-- AUTO_INCREMENT for table `role_handover_logs`
--
ALTER TABLE `role_handover_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `role_update_requests`
--
ALTER TABLE `role_update_requests`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=107;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `activity_plans`
--
ALTER TABLE `activity_plans`
  ADD CONSTRAINT `activity_plans_current_file_id_foreign` FOREIGN KEY (`current_file_id`) REFERENCES `activity_plan_files` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_activity_requests_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `activity_plan_dean_signatures`
--
ALTER TABLE `activity_plan_dean_signatures`
  ADD CONSTRAINT `activity_plan_dean_signatures_activity_plan_id_foreign` FOREIGN KEY (`activity_plan_id`) REFERENCES `activity_plans` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `activity_plan_dean_signatures_dean_id_foreign` FOREIGN KEY (`dean_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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
-- Constraints for table `email_verification_codes`
--
ALTER TABLE `email_verification_codes`
  ADD CONSTRAINT `email_verification_codes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

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

--
-- Constraints for table `role_update_requests`
--
ALTER TABLE `role_update_requests`
  ADD CONSTRAINT `role_update_requests_reviewed_by_foreign` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `role_update_requests_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
