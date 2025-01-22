import React, { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IoMdContact } from 'react-icons/io';
import '../styles/global.css';


interface ConversationData {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated: Date;
}

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const navigate = useNavigate();

  // Fetch Profile Picture
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!currentUser) return;

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setProfilePicUrl(userData.profilePicUrl || null);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  // Fetch Conversations
  useEffect(() => {
    if (!currentUser) return;

    const conversationsRef = collection(db, 'conversations');
    const q = query(conversationsRef, orderBy('lastUpdated', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversationData: ConversationData[] = snapshot.docs
        .filter((doc) =>
          doc.data().participants.includes(currentUser.uid)
        )
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
          lastUpdated: doc.data().lastUpdated.toDate(), // Firestore timestamp to JS Date
        }));
      setConversations(conversationData);
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const handleConversationClick = (conversationId: string) => {
    navigate(`/messages/${conversationId}`);
  };

  return (
    <div className="main-wrapper">
      {/* Search Bar */}
      <div className="search-bar z-10">
        <input
          type="text"
          placeholder="search conversations..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="search-input focus:outline-none"
        />
      </div>

      {/* User Profile Dropdown in Top Right */}
      {currentUser && (
        <div className="absolute top-4 right-4">
          <div className="relative">
            <button onClick={toggleDropdown} className="focus:outline-none">
              {profilePicUrl ? (
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover cursor-pointer"
                />
              ) : (
                <IoMdContact className="w-10 h-10 cursor-pointer" />
              )}
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 w-36 bg-inherit border rounded-lg shadow-lg z-50">
                <button
                  onClick={() => navigate(`/profile/${currentUser.uid}`)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100"
                >
                  Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messaging Content */}
      <div className="messages-layout flex">
        {/* Conversations List */}
        <div className="conversations-list w-1/3 border-r">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleConversationClick(conversation.id)}
              className="conversation-item p-4 hover:bg-gray-200 cursor-pointer flex items-center"
            >
              <IoMdContact className="w-10 h-10 text-gray-500 mr-4" />
              <div>
                <p className="text-sm font-medium">
                  {conversation.participants
                    .filter((id) => id !== currentUser.uid)
                    .join(', ')}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {conversation.lastMessage || 'No messages yet'}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Messages View */}
        <div className="messages-view w-2/3 p-4">
          <h2 className="text-lg font-semibold mb-4">Select a conversation</h2>
          {/* Add logic to display selected conversation messages */}
        </div>
      </div>
    </div>
  );
};

export default Messages;
