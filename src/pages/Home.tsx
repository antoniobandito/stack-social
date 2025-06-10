import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  const [activeTab, setActiveTab] = useState<'forYou' | 'following'>('forYou');
  const [followingUsers, setFollowingUsers] = useState<string[]>([]);
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
    setSuggestions([]); // Clear suggestions after navigation
    setSearchInput(''); // Clear search input
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

  // Fetch the current user's following list
  const fetchFollowing = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setFollowingUsers(userData.following || []);
      }
    } catch (error) {
      console.error('Error fetching following list:', error);
    }
  }, [currentUser]);

  // Filter posts based on active tab
  const filteredPosts = useMemo(() => {
    if (activeTab === 'forYou') {
      return posts;
    } else {
      return posts.filter(post => 
        followingUsers.includes(post.authorId)
      );
    }
  }, [posts, activeTab, followingUsers]);

  // Fetch following list on mount and when currentUser changes
  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);




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
    <div className="app-container">
      {/* Sticky Navigation Bar */}
      <nav className="sticky-nav">
        {/* Brand/Logo */}
        <div className="nav-brand">
          <h1 className="brand-title">stack</h1>
        </div>

        {/* Search Bar */}
        <div className="nav-search">
          <div className="search-container">
            <input
              type="text"
              placeholder="search..."
              value={searchInput}
              onChange={handleSearchChange}
              className="search-input-nav"
            />
            {suggestions.length > 0 && (
              <ul className="suggestions-dropdown">
                {suggestions.map(user => (
                  <li 
                    key={user.id} 
                    onClick={() => handleProfileClick(user.id)} 
                    className="suggestion-item-nav"
                  >
                    {user.profilePicUrl ? (
                      <img
                        src={user.profilePicUrl}
                        alt={`${user.username}'s profile`}
                        className="suggestion-avatar"
                      />
                    ) : (
                      <div className="suggestion-avatar-fallback">
                        <IoMdContact className="avatar-icon" />
                      </div>
                    )}
                    <span className="suggestion-username">{user.username || 'No username found'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Profile Dropdown */}
        {currentUser && (
          <div className="nav-profile">
            <div className="profile-dropdown-container">
              <button onClick={toggleDropdown} className="profile-button">
                {profilePicUrl ? (
                  <img 
                    src={profilePicUrl}
                    alt="Profile"
                    className="profile-avatar"
                  />
                ) : (
                  <IoMdContact className="profile-icon" />
                )}
              </button>

              {isDropdownOpen && (
                <div className="profile-dropdown">
                  <button 
                    onClick={() => navigate(`/profile/${currentUser.uid}`)}
                    className="dropdown-item"
                  >
                    profile
                  </button>
                  <button 
                    onClick={handleSignOut}
                    className="dropdown-item signout"
                  >
                    sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Tab Selector */}
      <div className="tab-selector">
        <button 
          className={`tab-button ${activeTab === 'forYou' ? 'active' : ''}`}
          onClick={() => setActiveTab('forYou')}
        >
          for you
        </button>
        <button 
          className={`tab-button ${activeTab === 'following' ? 'active' : ''}`}
          onClick={() => setActiveTab('following')}
        >
          following
        </button>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Posts Feed */}
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="grid-container"
          columnClassName="grid-item"
        >
          {filteredPosts.filter(post => post.content || post.mediaURL || post.fileURL)
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
    </div>
  );
};

export default Home;