import React from 'react'
import { Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { logOut } from '../services/auth';
import { useAuth } from '../context/AuthContext';

interface PostProps {
  authorUsername: string;
  authorId: string;
}

const Navigation: React.FC = () => {
    const { currentUser } = useAuth();

    if (!currentUser) return null;

  return (
    <nav className='fixed bottom-0 left-0 right-0 bg-white text-black p-4 flex justify-center'>
        <div>
            <Link to='/' className='mr-4'>Home</Link>
            <Link to={`/profile/${currentUser.uid}`} className='mr-4'>Profile</Link>
            <Link to='/messages' className='mr-4'>Messages</Link>
        </div>
        
    </nav>
  );
};

export default Navigation;