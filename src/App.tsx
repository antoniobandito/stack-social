import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Messages from './components/Message';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';

const App: React.FC = () => {
  return (
  <AuthProvider>
    <Router>
      <div className='main-content'>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/signup" />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Header />
              <Home />
              <Navigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId" 
          element={
            <ProtectedRoute>
              <ProfilePage />
              <Navigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
              <Navigation />
            </ProtectedRoute>
          }
        />
        </Routes>
      </div>
    </Router>
    </AuthProvider>
  );
};

export default App;
