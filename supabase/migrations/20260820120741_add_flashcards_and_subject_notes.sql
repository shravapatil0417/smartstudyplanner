/*
# Add subject notes + flashcards table

## Overview
1. Adds a `notes` text column to the `subjects` table so students can store
   free-form study notes per subject.
2. Creates a new `flashcards` table for storing generated Q&A flashcards,
   linked to both a subject and (optionally) the source notes snapshot.

## New Columns
- `subjects.notes` (text, nullable) — free-form study notes for the subject.

## New Tables
- `flashcards`
  - `id` uuid PK
  - `user_id` uuid (defaults to auth.uid(), cascades on user delete)
  - `subject_id` uuid FK → subjects(id) ON DELETE CASCADE
  - `question` text NOT NULL
  - `answer` text NOT NULL
  - `source_notes` text (snapshot of the notes used to generate the card)
  - `reviewed` boolean default false (tracks whether the card was studied)
  - `created_at` timestamptz

## Security
- RLS enabled on `flashcards`.
- Owner-scoped CRUD: four separate policies (select/insert/update/delete),
  scoped to `TO authenticated` with `auth.uid() = user_id`.
- `user_id` defaults to `auth.uid()` so client inserts omitting it succeed.
*/

-- Add notes column to subjects
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS notes text;

-- Flashcards table
CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  source_notes text,
  reviewed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_flashcards" ON flashcards;
CREATE POLICY "select_own_flashcards" ON flashcards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_flashcards" ON flashcards;
CREATE POLICY "insert_own_flashcards" ON flashcards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_flashcards" ON flashcards;
CREATE POLICY "update_own_flashcards" ON flashcards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_flashcards" ON flashcards;
CREATE POLICY "delete_own_flashcards" ON flashcards FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_subject_id ON flashcards(subject_id);
