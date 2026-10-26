-- Enquiries and appointment bookings from the services pages, handled from the admin inbox.
-- Additive only.
--   mysql linux_portal < db/migrations/20261027_service_requests.sql

CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('enquiry', 'booking') NOT NULL DEFAULT 'enquiry',
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30) NULL,
  company VARCHAR(150) NULL,
  service VARCHAR(100) NOT NULL,
  message TEXT NULL,
  budget VARCHAR(50) NULL,
  -- What the customer asked for (bookings only).
  preferred_date DATE NULL,
  preferred_slot VARCHAR(20) NULL,
  -- What the admin confirmed, in UTC.
  scheduled_at DATETIME NULL,
  status ENUM('new', 'contacted', 'scheduled', 'completed', 'closed', 'spam') NOT NULL DEFAULT 'new',
  admin_notes TEXT NULL,
  user_id INT NULL,
  source VARCHAR(30) NOT NULL DEFAULT 'web',
  ip_address VARCHAR(45) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_service_requests_status (status, created_at),
  KEY idx_service_requests_type (type, created_at),
  KEY idx_service_requests_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
