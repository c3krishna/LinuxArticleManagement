-- Profile photos. Additive only.
--   mysql linux_portal < db/migrations/20261026b_user_avatars.sql

ALTER TABLE users
  ADD COLUMN avatar_url VARCHAR(255) NULL AFTER last_login_at;
