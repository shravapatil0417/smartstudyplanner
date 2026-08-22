/*
# Add user_settings table for Groq API key storage

## Overview
Creates a `user_settings` table to store per-user settings, starting with
the Groq API key that powers the AI chatbot feature.

## New Tables
- `user_settings`
  - `id` uuid PK
  - `user_id` uuid (defaults to auth.uid(), cascades on user delete, unique)
  - `groq_api_key` text (nullable — the user's Groq API key for AI chat)
  - `created_at` timestamptz
  - `updated_at` timestamptz

## Security
- RLS enabled.
- Owner-scoped CRUD: four separate policies, scoped to authenticated users.
- `user_id` defaults to `auth.uid()`.
*/

CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  groq_api_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_user_settings" ON user_settings;
CREATE POLICY "select_own_user_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_user_settings" ON user_settings;
CREATE POLICY "insert_own_user_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_user_settings" ON user_settings;
CREATE POLICY "update_own_user_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_user_settings" ON user_settings;
CREATE POLICY "delete_own_user_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
