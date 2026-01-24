-- Drop the unique constraint on user_id to allow multiple projects per user
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_user_id_key;