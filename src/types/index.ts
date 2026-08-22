export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type ExamType = 'exam' | 'assignment' | 'project' | 'submission' | 'other';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  study_goal: number;
  created_at: string;
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  target_hours: number;
  notes: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  priority: Priority;
  status: TaskStatus;
  due_date: string | null;
  estimated_minutes: number;
  created_at: string;
  completed_at: string | null;
  subject?: Subject | null;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_id: string | null;
  duration_minutes: number;
  session_date: string;
  notes: string | null;
  created_at: string;
  subject?: Subject | null;
}

export interface Exam {
  id: string;
  user_id: string;
  subject_id: string | null;
  title: string;
  description: string | null;
  exam_date: string;
  exam_time: string | null;
  location: string | null;
  type: ExamType;
  created_at: string;
  subject?: Subject | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
}

export interface SubjectWithStats extends Subject {
  studied_minutes: number;
  studied_hours: number;
  progress: number;
  task_count: number;
  completed_tasks: number;
  flashcard_count: number;
}

export interface Flashcard {
  id: string;
  user_id: string;
  subject_id: string | null;
  question: string;
  answer: string;
  source_notes: string | null;
  reviewed: boolean;
  created_at: string;
  subject?: Subject | null;
}
