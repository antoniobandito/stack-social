import React from 'react'
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessaging } from '../context/MessagingContext';
import { useNavigate } from 'react-router-dom';

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
    <nav className='fixed bottom-0 left-0 right-0 text-black p-4 flex justify-center'>
        <div>
            <Link to='/' className='mr-4 bg-inherit'>Home</Link>
            <Link to={`/profile/${currentUser.uid}`} className='mr-4'>Profile</Link>
            <button onClick={handleMessagesClick} className='mr-4'>Messages</button>
        </div>
    </nav>
  );
};

export default Navigation;