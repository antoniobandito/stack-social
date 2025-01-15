import React, { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import { collection, doc, endAt, getDoc, onSnapshot, orderBy, query, startAt, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import FloatingActionButton from '../components/FloatingActionButton';
import Post from '../components/Post';
import '../styles/global.css';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { IoMdContact } from 'react-icons/io';

interface PostData {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  likes?: string[];
  reposts?: string[];
  mediaURL?: string;
  fileURL?: string;
  createdAt: Date;
}

interface UserProfileData {
  id: string;
  profilePicUrl?: string;
  username?: string;
}

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

const Home: React.FC = () => {
  const [posts, setPosts] = useState<PostData[]>([]);
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<UserProfileData[]>([]);
  const navigate = useNavigate();

  // Fetch additional user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setProfilePicUrl(userData.profilePicUrl || null);
        }
      } catch (error) {
        console.error('Error fetching profile picture:', error);
      }
    };
      
    fetchUserProfile();
  },  [currentUser]);

  // Search functionality 
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchInput(value);

    if (!value) {
      setSuggestions([]);
      return;
    }

    try {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef, 
      orderBy('username'), 
      startAt(value), 
      endAt(value + '\uf8ff')
      );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      console.log('Search results:', querySnapshot.docs.map(doc => doc.data()));  
    } else {
      console.log('No matching results found');
    }

    const results = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      username: doc.data().username,
      profilePicUrl: doc.data().profilePicUrl || null,
    }));

    setSuggestions(results as UserProfileData[]);
  } catch (error) {
    console.error('Error fetching user suggestions:', error);
    }
  };

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Sign out error', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Fetch posts for the feed 
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const postsData: PostData[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(), // Convert Firestore timestamp to JS Date
          };
        }) as PostData[];
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-wrapper">
      <div className='search-bar z-10'>
        <input
          type='text'
          placeholder='search...'
          value={searchInput}
          onChange={handleSearchChange}
          className='search-input focus:outline-none'
          />
          {suggestions.length > 0 && (
            <ul className='suggestions-list hover:bg-gray-200'>
              {suggestions.map(user => (
                <li 
                key={user.id} 
                onClick={() => handleProfileClick(user.id)} 
                className='suggestion-item flex items-center p-2 hover:bg-gray-200 hover:'
                >
                  {user.profilePicUrl ? (
                    <img
                    src={user.profilePicUrl}
                    alt={`${user.username}'s profile`}
                    className='w-10 h-10 rounded-full object-cover'
                    />
                  ) : (
                    <div className='w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-white'>
                      {/* Fallback Icon */}
                      <IoMdContact className='w-5 h-5' />
                    </div>
                  )}
                  <span>{user.username || 'No username found'}</span>
                </li>
              ))}
            </ul>
          )}
      </div>

      {/* User Profile Dropdown in Top Right */}
      {currentUser && (
        <div className="absolute top-4  right-4">
          <div className="relative">
            <button onClick={toggleDropdown} className="focus:outline-none">
              {profilePicUrl ? (
              <img 
                src={profilePicUrl}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover cursor-pointer transition-opacity outline-none focus:outline-none"
            />
            ) : (
              <IoMdContact className='w-10 h-10 cursor-pointer' />
            )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 w-36 bg-inherit border rounded-lg shadow-lg z-50 focus:outline-none">
                <button 
                  onClick={() => navigate(`/profile/${currentUser.uid}`)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  profile
                </button>
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                >
                  sign out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Posts Feed */}
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="grid-container"
        columnClassName="grid-item"
      >
        {posts.filter(post => post.content || post.mediaURL || post.fileURL)
        .map(post => (
          <div key={post.id} className="grid-item">
            <Post 
              id={post.id}
              authorId={post.authorId}
              authorUsername={post.authorUsername}
              content={post.content}
              createdAt={post.createdAt}
              likes={post.likes}
              reposts={post.reposts}
              mediaURL={post.mediaURL}
              fileURL={post.fileURL}
            />
          </div>
        ))}
      </Masonry>

      <FloatingActionButton />
    </div>
  );
};

export default Home;
