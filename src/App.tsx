import React from 'react';
import modal from 'react-modal';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Messages from './components/Message';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import { AudioPlayerProvider } from './context/AudioPlayerContent';
import MiniAudioPlayer from './components/MiniAudioPlayer';

// Add error boundary
class AudioErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Audio Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className='p-4'>Error loading audio player</div>;
    }
    return this.props.children;
  }
}

const AppContent: React.FC = () => {
  return (
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
        <AudioErrorBoundary>
        <MiniAudioPlayer />
        </AudioErrorBoundary>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AudioErrorBoundary>
          <AudioPlayerProvider>
            <AppContent />
          </AudioPlayerProvider>
        </AudioErrorBoundary>
      </Router>
    </AuthProvider>
  );
};

export default App;

