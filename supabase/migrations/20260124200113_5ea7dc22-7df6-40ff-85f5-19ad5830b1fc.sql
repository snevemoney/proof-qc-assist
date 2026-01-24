-- Add language column to verification_history table
ALTER TABLE verification_history ADD COLUMN language text DEFAULT 'fr';

-- Add verification_language column to projects table
ALTER TABLE projects ADD COLUMN verification_language text DEFAULT 'fr';