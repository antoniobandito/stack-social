import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';

import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Messages from './components/Message';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import { AudioPlayerProvider } from './context/AudioPlayerContent';
import MiniAudioPlayer from './components/MiniAudioPlayer';
import MessageThread from './components/MessageThread';
import MinimizedMessages from './components/MinimizedMessages';
import { MessagingProvider, useMessaging } from './context/MessagingContext';
import FrontPage from './pages/FrontPage';
import AdsPortal from './pages/AdsPortal';

// Error boundary for MiniAudioPlayer
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
      return <div className="p-4">Error loading audio player</div>;
    }
    return this.props.children;
  }
}

// Separate AppRoutes to access hooks
const AppRoutes: React.FC = () => {
  const {
    showMinimizedMessages,
    closeMinimizedMessages,
    activeConversationId,
    minimizeMessages,
  } = useMessaging();

  const { currentUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 700 && location.pathname === '/messages') {
        const scrollY = window.scrollY;
        sessionStorage.setItem('scrollY', scrollY.toString());
        minimizeMessages(activeConversationId);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname, minimizeMessages, activeConversationId]);

  useEffect(() => {
    if (location.pathname !== '/messages' && sessionStorage.getItem('scrollY')) {
      window.scrollTo(0, parseInt(sessionStorage.getItem('scrollY') || '0'));
    }
  }, [location.pathname]);

  return (
    <div className="main-content flex flex-col h-screen">
      <Routes>
        {/* Auth-related */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected: Profile */}
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Header />
              <ProfilePage />
              <Navigation />
            </ProtectedRoute>
          }
        />

        {/* Protected: Messages */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Header />
              <Messages />
              <Navigation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:conversationId"
          element={
            <ProtectedRoute>
              <Header />
              <MessageThread conversationId={''} />
              <Navigation />
            </ProtectedRoute>
          }
        />
        <Route
        path="/ads"
        element={
          <ProtectedRoute>
            <Header />
            <AdsPortal />
            </ProtectedRoute>
          }
        />


        {/* Conditionally render "/" route based on auth state */}
        <Route
          path="/"
          element={
            currentUser ? (
              <ProtectedRoute>
                <Header />
                <Home />
                <Navigation />
              </ProtectedRoute>
            ) : (
              <FrontPage />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global audio player 
      <AudioErrorBoundary>
        <MiniAudioPlayer />
      </AudioErrorBoundary>
      */}

      {/* Minimized messages */}
      {showMinimizedMessages && (
        <MinimizedMessages
          onClose={closeMinimizedMessages}
          initialConversationId={activeConversationId}
        />
      )}
    </div>
  );
};

// App wrapper
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AudioErrorBoundary>
          <AudioPlayerProvider>
            <MessagingProvider>
              <AppRoutes />
            </MessagingProvider>
          </AudioPlayerProvider>
        </AudioErrorBoundary>
      </Router>
    </AuthProvider>
  );
};

export default App;
