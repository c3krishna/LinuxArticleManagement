-- Admin redesign: article workflow (draft / published / scheduled), user management, activity log.
-- Additive only: no columns or tables are dropped. Every existing article stays published.
--   mysqldump linux_portal > linux_portal_before_admin_redesign.sql
--   mysql linux_portal < db/migrations/20261026_admin_redesign.sql

SET NAMES utf8mb4;

-- status defaults to 'published' so rows inserted the old way (seed files, old API) keep today's behaviour.
-- The admin API always sets status explicitly.
ALTER TABLE documents
  ADD COLUMN status ENUM('draft','published','scheduled') NOT NULL DEFAULT 'published' AFTER category,
  ADD COLUMN visibility ENUM('public','unlisted') NOT NULL DEFAULT 'public' AFTER status,
  ADD COLUMN scheduled_at DATETIME NULL AFTER visibility,
  ADD COLUMN published_at DATETIME NULL AFTER scheduled_at,
  ADD COLUMN updated_at DATETIME NULL AFTER published_at,
  ADD COLUMN excerpt VARCHAR(500) NULL AFTER tags,
  ADD COLUMN featured TINYINT(1) NOT NULL DEFAULT 0 AFTER excerpt,
  ADD COLUMN author_id INT NULL AFTER featured,
  ADD INDEX idx_documents_status (status, scheduled_at),
  ADD INDEX idx_documents_category (category);

UPDATE documents
SET published_at = created_at,
    updated_at = created_at
WHERE published_at IS NULL;

ALTER TABLE users
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role,
  ADD COLUMN last_login_at DATETIME NULL AFTER is_active;

ALTER TABLE document_views
  ADD INDEX idx_document_views_doc_ip (document_id, ip_address, created_at),
  ADD INDEX idx_document_views_created (created_at);

CREATE TABLE activity_log (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NULL,
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(20) NOT NULL,
  entity_id INT NULL,
  summary VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_activity_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Give "Recent activity" a starting point from the latest existing publications.
INSERT INTO activity_log (user_id, action, entity_type, entity_id, summary, created_at)
SELECT NULL, 'published', 'document', id, LEFT(title, 255), created_at
FROM documents
ORDER BY id DESC
LIMIT 10;
