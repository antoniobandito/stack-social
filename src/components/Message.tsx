// Updated Messages.tsx with proper bottom navigation spacing
import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  getDoc,
  getDocs,
  where,
  startAt,
  endAt,
  updateDoc,
  addDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IoMdContact } from 'react-icons/io';
import { debounce } from 'lodash';
import { getAuth } from 'firebase/auth';
import '../styles/global.css';
import MessageThread from './MessageThread';

interface ConversationData {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Date;
}

interface UserProfileData {
  id: string;
  profilePicUrl?: string;
  username?: string;
}

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationData[]>([]);
  const { currentUser, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<UserProfileData[]>([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [conversationUsers, setConversationUsers] = useState<Record<string, UserProfileData>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const navigate = useNavigate();
  const firebaseAuth = getAuth();
  const messageThreadContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!currentUser) return;
    console.log('🔍 Current User UID:', currentUser.uid);
    console.log('🔍 Firebase Auth Status:', firebaseAuth.currentUser ? 'Authenticated' : 'Not authenticated');
    
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('🔍 Conversations snapshot received, count:', snapshot.docs.length);
      const conversationData: ConversationData[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        participants: doc.data().participants,
        lastMessage: doc.data().lastMessage,
        updatedAt: doc.data().updatedAt.toDate(),
      }));

      const allUserIds = conversationData
        .flatMap(conv => conv.participants)
        .filter(id => id !== currentUser.uid);

      await fetchUserProfiles([...new Set(allUserIds)]);
      setConversations(conversationData);
    }, (error) => {
      console.error('🔍 Error getting conversations:', error);
      setDebugInfo(prevInfo => prevInfo + '\nError getting conversations: ' + error.message);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Effect to ensure message thread container scrolls properly
  useEffect(() => {
    if (activeConversationId && messageThreadContainerRef.current) {
      // Ensure the container scrolls to show both the messages and reply area
      messageThreadContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeConversationId]);

  const fetchUserProfiles = async (userIds: string[]) => {
    const updatedProfiles: Record<string, UserProfileData> = { ...conversationUsers };
    await Promise.all(userIds.map(async (uid) => {
      if (!updatedProfiles[uid]) {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          updatedProfiles[uid] = {
            id: uid,
            username: userDoc.data().username || `User ${uid.substring(0, 4)}`,
            profilePicUrl: userDoc.data().profilePicUrl || null
          };
        }
      }
    }));
    setConversationUsers(updatedProfiles);
  };

  const debouncedSearch = debounce(async (value: string) => {
    if (!value) return setSuggestions([]);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        orderBy('username'),
        startAt(value),
        endAt(value + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        username: doc.data().username,
        profilePicUrl: doc.data().profilePicUrl || null,
      }));
      setSuggestions(results);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, 300);

  // Search functionality (same as Home component)
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

  const handleUserSelect = (user: UserProfileData) => {
    setSelectedUser(user);
    setSearchInput(user.username || '');
    setSuggestions([]);
    setIsMessageModalOpen(true);
  };

  const handleConversationSelect = (conversationId: string) => {
    // Reset scroll position when selecting a conversation
    window.scrollTo(0, 0);
    setActiveConversationId(conversationId);
    
    // Small delay to ensure DOM is updated before scrolling
    setTimeout(() => {
      if (messageThreadContainerRef.current) {
        messageThreadContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSendMessage = async () => {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    setDebugInfo(''); // Reset debug info
  
    // Check auth & inputs
    if (!firebaseUser) {
      const errMsg = '⚠️ Firebase auth user is null. Cannot send message.';
      console.warn(errMsg);
      setDebugInfo(errMsg);
      return;
    }
    if (!selectedUser || !newMessage.trim()) {
      const errMsg = '⚠️ Missing selectedUser or message input.';
      console.warn(errMsg);
      setDebugInfo(errMsg);
      return;
    }
  
    console.log('📤 Starting send message...');
    console.log('Firebase Auth UID:', firebaseUser.uid);
    console.log('Selected User ID:', selectedUser.id);
    console.log('Message:', newMessage);
    
    setDebugInfo(prev => prev + '\nStarting message send process...' + 
                '\nCurrent User: ' + firebaseUser.uid + 
                '\nSelected User: ' + selectedUser.id);
  
    const sortedIds = [firebaseUser.uid, selectedUser.id].sort();
    const conversationId = sortedIds.join('_');
    const conversationRef = doc(db, 'conversations', conversationId);
    
    console.log('Sorted IDs for conversation:', sortedIds);
    console.log('Conversation document path:', `conversations/${conversationId}`);
    
    setDebugInfo(prev => prev + '\nConversation ID: ' + conversationId);
  
    try {
      // STEP 1: Only create/update the conversation document first
      console.log('Step 1: Creating conversation document');
      setDebugInfo(prev => prev + '\nStep 1: Creating conversation document');
      
      const conversationDoc = await getDoc(conversationRef);
      
      if (!conversationDoc.exists()) {
        console.log('🆕 Creating new conversation...');
        setDebugInfo(prev => prev + '\nCreating new conversation document');
        
        await setDoc(conversationRef, {
          participants: sortedIds,
          lastMessage: newMessage.trim(),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Conversation created');
        setDebugInfo(prev => prev + '\n✅ Conversation created successfully');
      } else {
        console.log('🔁 Updating existing conversation...');
        setDebugInfo(prev => prev + '\nUpdating existing conversation');
        
        await updateDoc(conversationRef, {
          lastMessage: newMessage.trim(),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Conversation updated');
        setDebugInfo(prev => prev + '\n✅ Conversation updated successfully');
      }
      
      // STEP 2: Now try to add the message to the subcollection
      console.log('Step 2: Creating message document');
      setDebugInfo(prev => prev + '\nStep 2: Creating message document');
      
      const messagesRef = collection(conversationRef, 'messages');
      const newMessageData = {
        senderId: firebaseUser.uid,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        readBy: {
          [firebaseUser.uid]: true,
        },
      };
      
      await addDoc(messagesRef, newMessageData);
      console.log('✅ Message added');
      setDebugInfo(prev => prev + '\n✅ Message added successfully');
  
      // Reset input/UI only after both operations succeed
      setNewMessage('');
      setSelectedUser(null);
      setSearchInput('');
      setIsMessageModalOpen(false);
      
      // Set active conversation to the one just created/messaged
      setActiveConversationId(conversationId);
      
      // Ensure message thread and reply area are visible after sending
      setTimeout(() => {
        if (messageThreadContainerRef.current) {
          messageThreadContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      console.log('✅ Message send process completed successfully');
      setDebugInfo(prev => prev + '\n✅ Message send process completed successfully');
    } catch (err: any) {
      console.error('❌ Error sending message:', err);
      console.error('Error occurred at path:', err.path || 'unknown path'); 
      console.error('Error details:', err.code, err.message);
      
      setDebugInfo(prev => prev + '\n❌ Error sending message: ' + err.message + 
                  '\nError code: ' + err.code +
                  '\nError path: ' + (err.path || 'unknown'));
    }
  };

  return (
    <div className="app-container">
      {/* Sticky Navigation Bar - Same as Home component */}
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

      {/* Main Content */}
      <div className="main-content">
        {/* Main content area - automatically centered when screen gets wider */}
        <div className="flex-1 flex overflow-hidden mt-16">
          <div className="w-full max-w-6xl mx-auto flex" style={{ height: 'calc(100vh - 5rem - 85px)' }}>
            {/* Conversation list */}
            <div className="w-1/3 max-w-sm border-r border-gray-200 bg-gray-50 overflow-y-auto">
              <button
                className="m-4 bg-gray-800 hover:bg-slate-300 text-white hover:text-black font-bold py-2 px-4 rounded"
                onClick={() => setIsMessageModalOpen(true)}
              >
                new message
              </button>
              
              {conversations.length === 0 ? (
                <p className="text-gray-500 p-4">You have no conversations</p>
              ) : (
                conversations.map((conversation) => {
                  // Find the other user in this conversation
                  const otherUserIds = conversation.participants.filter(id => id !== currentUser?.uid);
                  
                  return (
                    <div
                      key={conversation.id}
                      onClick={() => handleConversationSelect(conversation.id)}
                      className={`p-4 cursor-pointer border-b border-gray-200 ${
                        activeConversationId === conversation.id ? '' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        {/* Profile picture */}
                        <div className="mr-3">
                          {otherUserIds.length === 1 && conversationUsers[otherUserIds[0]]?.profilePicUrl ? (
                            <img
                              src={conversationUsers[otherUserIds[0]].profilePicUrl}
                              alt={conversationUsers[otherUserIds[0]].username || "User"}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : otherUserIds.length > 1 ? (
                            <div className="w-12 h-12 relative">
                              {/* For group chats, show up to 2 profile pictures in a stack */}
                              {otherUserIds.slice(0, 2).map((id, index) => (
                                conversationUsers[id]?.profilePicUrl ? (
                                  <img
                                    key={id}
                                    src={conversationUsers[id].profilePicUrl}
                                    alt="User"
                                    className={`w-8 h-8 rounded-full object-cover absolute ${
                                      index === 0 ? 'top-0 left-0' : 'bottom-0 right-0'
                                    } border-2 border-white`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/${id}`);
                                    }}
                                  />
                                ) : (
                                  <div 
                                    key={id}
                                    className={`w-8 h-8 rounded-full flex items-center justify-center absolute ${
                                      index === 0 ? 'top-0 left-0' : 'bottom-0 right-0'
                                    } border-2 border-white`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/profile/${id}`);
                                    }}
                                  >
                                    <IoMdContact className="text-gray-600 w-6 h-6" />
                                  </div>
                                )
                              ))}
                            </div>
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/profile/${otherUserIds[0]}`);
                              }}
                            >
                              <IoMdContact className="text-gray-600 w-8 h-8" />
                            </div>
                          )}
                        </div>
                        
                        {/* Conversation info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {conversation.participants
                              .filter(id => id !== currentUser?.uid)
                              .map(id => conversationUsers[id]?.username || `User ${id.substring(0, 4)}`)
                              .join(', ')}
                          </div>
                          <div className="text-gray-600 truncate">{conversation.lastMessage}</div>
                          <div className="text-xs text-gray-400">
                            {conversation.updatedAt.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Message thread area */}
            <div className="flex-1 bg-gray-50 overflow-y-auto" ref={messageThreadContainerRef}>
              {activeConversationId ? (
                <MessageThread 
                  conversationId={activeConversationId} 
                  key={activeConversationId}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* New message modal */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Start a New Message</h2>

            {/* Search input */}
            <input
              type="text"
              placeholder="Search users by username"
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full border px-3 py-2 mb-2 rounded"
            />
            {suggestions.length > 0 && (
              <div className="border rounded mb-4 max-h-60 overflow-y-auto">
                {suggestions.map(user => (
                  <div
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {user.profilePicUrl ? (
                      <img 
                        src={user.profilePicUrl} 
                        alt="" 
                        className="w-8 h-8 rounded-full mr-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${user.id}`);
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/profile/${user.id}`);
                        }}
                      >
                        <IoMdContact className="text-gray-500" />
                      </div>
                    )}
                    <span>{user.username || user.id.substring(0, 6)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Message input and send */}
            {selectedUser && (
              <>
                <p className="mb-2 text-sm text-gray-500">To: {selectedUser.username}</p>
                <textarea
                  placeholder="..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full border px-3 py-2 h-20 mb-4 rounded"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`text-white px-4 py-2 rounded mr-2 ${
                    newMessage.trim()
                    ? 'bg-slate-600 hover:bg-slate-700'
                    : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Send
                </button>
              </>
            )}

            {/* Cancel */}
            <button
              onClick={() => {
                setIsMessageModalOpen(false);
                setNewMessage('');
                setSelectedUser(null);
                setSuggestions([]);
                setSearchInput('');
              }}
              className="text-sm text-gray-500 mt-2 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;