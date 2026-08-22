import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { Landing } from '@/pages/Landing';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';
import { Dashboard } from '@/pages/Dashboard';
import { Tasks } from '@/pages/Tasks';
import { Subjects } from '@/pages/Subjects';
import { Sessions } from '@/pages/Sessions';
import { Exams } from '@/pages/Exams';
import { CalendarPage } from '@/pages/CalendarPage';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';
import { Flashcards } from '@/pages/Flashcards';
import { Chat } from '@/pages/Chat';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="tasks" element={<Tasks />} />
                <Route path="subjects" element={<Subjects />} />
                <Route path="sessions" element={<Sessions />} />
                <Route path="exams" element={<Exams />} />
                <Route path="calendar" element={<CalendarPage />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="flashcards" element={<Flashcards />} />
                <Route path="chat" element={<Chat />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
