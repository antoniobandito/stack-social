import React from 'react'
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';
import { useNavigate } from 'react-router-dom';
import { Home, User, MessageSquare } from 'lucide-react'; // Import icons

interface PostProps {
  authorUsername: string;
  authorId: string;
}
const Navigation: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { minimizeMessages } = useMessaging();

  if (!currentUser) return null;

  const handleMessagesClick = () => {
    if (window.innerWidth > 700) {
      console.log('Opening minimized messages');
      minimizeMessages(null);  // Use this instead of openMinimizedMessages
    } else {
      console.log('Navigating to /messages');
      navigate('/messages');
    }
  };

  

  return (
    <nav className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4 z-50">
      <Link
        to="/"
        className="bg-transparent text-black p-3 rounded-full shadow hover:bg-gray-100 hover:text-black transition"
        aria-label="Home"
      >
        <Home className="w-5 h-5"/>
      </Link>
      <Link
        to={`/profile/${currentUser.uid}`}
        className="bg-transparent text-black p-3 rounded-full shadow hover:bg-gray-100 hover:text-black transition"
        aria-label="Profile"
      >
        <User className="w-5 h-5"/>
      </Link>
      <button
        onClick={handleMessagesClick}
        className="bg-transparent text-black p-3 rounded-full shadow hover:bg-gray-100 hover:text-black transition"
        aria-label="Messages"
      >
        <MessageSquare className="w-5 h-5" />
      </button>
    </nav>
  );
};

export default Navigation;