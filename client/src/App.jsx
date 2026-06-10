import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Classroom from './pages/Classroom';
import AssignmentDetail from './pages/AssignmentDetail';
import Teacher from './pages/Teacher';
import Student from './pages/Student';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Teacher-Only Protected Route Wrapper
function TeacherRoute({ children }) {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-canvas-soft flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser.role !== 'Teacher') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/student" 
            element={
              <ProtectedRoute>
                <Student />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher" 
            element={
              <TeacherRoute>
                <Teacher />
              </TeacherRoute>
            } 
          />
          <Route 
            path="/class/:id" 
            element={
              <ProtectedRoute>
                <Classroom />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/class/:id/assignment/:assignmentId" 
            element={
              <ProtectedRoute>
                <AssignmentDetail />
              </ProtectedRoute>
            } 
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

