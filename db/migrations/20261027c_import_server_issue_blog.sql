-- One-off import of the old server-issue.online blog posts into documents, as published articles.
-- Skipped on purpose:
--   10 "Nginx" and 15 "Voice Bot": one-paragraph stubs.
--   18, 19, 20: already here as articles 176, 177 and 178 (cleaned-up copies).
-- Post 7's slug belongs to an existing article, so it gets its own slug.
-- Content is copied as stored; views start at zero because they were counted on the old site.
-- Safe to run more than once: a slug that already exists is skipped.
-- Needs read access to server_issue, so run it as root:
--   mysql linux_portal < db/migrations/20261027c_import_server_issue_blog.sql

INSERT INTO documents
  (title, slug, content, category, tags, excerpt, status, visibility, featured, views, created_at, published_at, updated_at)
SELECT p.title,
       CASE p.id WHEN 7 THEN 'linux-system-hardening-checklist' ELSE p.slug END,
       p.content,
       CASE p.id
         WHEN 1 THEN 'Cloud'
         WHEN 2 THEN 'Database'
         WHEN 3 THEN 'Database'
         WHEN 4 THEN 'Linux'
         WHEN 5 THEN 'Docker'
         WHEN 6 THEN 'Security'
         WHEN 7 THEN 'Security'
         WHEN 8 THEN 'Monitoring'
         WHEN 16 THEN 'VoIP'
         WHEN 17 THEN 'Security'
       END,
       (SELECT GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ',') FROM server_issue.post_tags pt
          JOIN server_issue.tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id),
       p.excerpt,
       'published',
       'public',
       0,
       0,
       p.created_at,
       COALESCE(p.published_at, p.created_at),
       p.updated_at
FROM server_issue.blog_posts p
WHERE p.id IN (1, 2, 3, 4, 5, 6, 7, 8, 16, 17)
  AND NOT EXISTS (
    SELECT 1 FROM documents d
    WHERE d.slug = (CASE p.id WHEN 7 THEN 'linux-system-hardening-checklist' ELSE p.slug END) COLLATE utf8mb4_unicode_ci
  );
