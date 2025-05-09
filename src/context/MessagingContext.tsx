import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface MessagingContextType {
  isMinimized: boolean;
  openMinimizedMessages: (conversationId: string | null) => void;
  showMinimizedMessages: boolean;
  activeConversationId: string | null;
  minimizeMessages: (conversationId?: string | null) => void;
  maximizeMessages: () => void;
  closeMinimizedMessages: () => void;
  toggleMinimizedMessages: () => void;
  setActiveConversation: (conversationId: string | null) => void;
  closeMinimizedWindow: () => void;
}

// Properly initialized context with default values
const MessagingContext = createContext<MessagingContextType>({
  isMinimized: false,
  openMinimizedMessages: () => {},
  showMinimizedMessages: false,
  activeConversationId: null,
  minimizeMessages: () => {},
  maximizeMessages: () => {},
  closeMinimizedMessages: () => {},
  toggleMinimizedMessages: () => {},
  setActiveConversation: () => {},
  closeMinimizedWindow: () => {}
});

export const useMessaging = (): MessagingContextType => {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error(
      'useMessaging must be used within a MessagingProvider. ' +
      'Wrap your root component with <MessagingProvider>'
    );
  }
  return context;
};

interface MessagingProviderProps {
  children: React.ReactNode;
}

export const MessagingProvider: React.FC<MessagingProviderProps> = ({ children }) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [isMinimizedOpen, setIsMinimizedOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showMinimizedMessages, setShowMinimizedMessages] = useState<boolean>(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [previousLocation, setPreviousLocation] = useState<string | null>(null);
  const [previousScrollPosition, setPreviousScrollPosition] = useState<number>(0);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const state = location.state as { activeConversationId?: string | null } | null;
    if (state?.activeConversationId) {
      setActiveConversationId(state.activeConversationId);
    }
  }, [location]);

  const openMinimizedMessages = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    setIsMinimizedOpen(true);
  };

  const minimizeMessages = (conversationId?: string | null) => {
    if (location.pathname !== '/messages') {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      sessionStorage.setItem('scrollPositionBeforeMessages', scrollPosition.toString());
      sessionStorage.setItem('locationPathBeforeMessages', location.pathname);
    }

    if (conversationId) {
      setActiveConversationId(conversationId);
    }

    setIsMinimized(true);
    setShowMinimizedMessages(true);
  };

  const maximizeMessages = () => {
    if (location.pathname !== '/messages') {
      const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
      sessionStorage.setItem('scrollPositionBeforeMessages', scrollPosition.toString());
      sessionStorage.setItem('locationPathBeforeMessages', location.pathname);
    }

    setIsMinimized(false);
    setShowMinimizedMessages(false);
    navigate('/messages', { state: { activeConversationId } });
  };

  const closeMinimizedMessages = () => {
    setIsMinimizedOpen(false);
    setCurrentConversationId(null);
  };

  const closeMinimizedWindow = () => {
    setShowMinimizedMessages(false);
    setIsMinimizedOpen(false);
    setActiveConversationId(null);
  };

  const toggleMinimizedMessages = () => {
    if (location.pathname === '/messages') {
      const storedPath = sessionStorage.getItem('locationPathBeforeMessages');
      const scroll = sessionStorage.getItem('scrollPositionBeforeMessages');

      minimizeMessages(activeConversationId);

      if (storedPath && storedPath !== '/messages') {
        navigate(storedPath);

        setTimeout(() => {
          if (scroll) {
            window.scrollTo(0, parseInt(scroll));
          }
        }, 100);
      }
    } else if (showMinimizedMessages) {
      maximizeMessages();
    } else {
      minimizeMessages();
    }
  };

  const setActiveConversation = (conversationId: string | null) => {
    setActiveConversationId(conversationId);
  };

  const contextValue = useMemo(() => ({
    isMinimized,
    openMinimizedMessages,
    showMinimizedMessages,
    activeConversationId,
    minimizeMessages,
    maximizeMessages,
    closeMinimizedMessages,
    toggleMinimizedMessages,
    setActiveConversation,
    closeMinimizedWindow
  }), [
    isMinimized,
    showMinimizedMessages,
    activeConversationId,
    location.pathname
  ]);

  return (
    <MessagingContext.Provider value={contextValue}>
      {children}
    </MessagingContext.Provider>
  );
};

export default MessagingContext;