-- One-off import of leads and appointments from the old server-issue.online app (database server_issue)
-- into service_requests. Safe to run more than once: rows already imported are skipped.
-- The old leads table is utf8mb4_general_ci, hence the explicit COLLATE in its comparison.
-- Needs read access to server_issue, so run it as root:
--   mysql linux_portal < db/migrations/20261027b_import_server_issue_requests.sql

INSERT INTO service_requests
  (type, name, email, phone, service, message, status, source, created_at)
SELECT 'enquiry',
       COALESCE(NULLIF(TRIM(l.name), ''), 'Unknown'),
       COALESCE(TRIM(l.email), ''),
       NULLIF(TRIM(l.phone), ''),
       COALESCE(NULLIF(TRIM(l.service), ''), 'General enquiry'),
       NULLIF(TRIM(l.message), ''),
       'new',
       'old-site-lead',
       COALESCE(l.created_at, NOW())
FROM server_issue.leads l
WHERE NOT EXISTS (
  SELECT 1 FROM service_requests r
  WHERE r.source = 'old-site-lead' AND r.email = COALESCE(TRIM(l.email), '') COLLATE utf8mb4_unicode_ci AND r.created_at = COALESCE(l.created_at, NOW())
);

-- Old appointments had one date-time field; it becomes the preferred date, and also the confirmed time
-- for appointments that were already confirmed or completed.
INSERT INTO service_requests
  (type, name, email, phone, service, message, preferred_date, scheduled_at, status, user_id, source, created_at)
SELECT 'booking',
       a.visitor_name,
       a.visitor_email,
       a.visitor_phone,
       a.service,
       a.notes,
       DATE(a.appointment_date),
       CASE WHEN a.status IN ('confirmed', 'completed') THEN a.appointment_date END,
       CASE a.status WHEN 'confirmed' THEN 'scheduled' WHEN 'completed' THEN 'completed' WHEN 'cancelled' THEN 'closed' ELSE 'new' END,
       NULL,
       'old-site-booking',
       COALESCE(a.created_at, NOW())
FROM server_issue.appointments a
WHERE NOT EXISTS (
  SELECT 1 FROM service_requests r
  WHERE r.source = 'old-site-booking' AND r.email = a.visitor_email AND r.created_at = COALESCE(a.created_at, NOW())
);
