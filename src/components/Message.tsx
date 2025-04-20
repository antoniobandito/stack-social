// Fully fixed Messages.tsx with real-time conversation list sync and modal closing
import React, { useEffect, useState } from 'react';
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
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { IoMdContact } from 'react-icons/io';
import { debounce } from 'lodash';
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
  const [message, setMessage] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfileData | null>(null);
  const [conversationUsers, setConversationUsers] = useState<Record<string, UserProfileData>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const navigate = useNavigate();

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
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
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
    });

    return () => unsubscribe();
  }, [currentUser]);

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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setSearchInput(value);
    debouncedSearch(value);
  };

  const handleUserSelect = (user: UserProfileData) => {
    setSelectedUser(user);
    setSearchInput(user.username || '');
    setSuggestions([]);
    setIsMessageModalOpen(true);
  };

  const handleSendMessage = async () => {
  if (!selectedUser || !message.trim() || !currentUser) return;
  let conversationId;

  try {
    // Create the conversation document
    const newConversationRef = await addDoc(collection(db, 'conversations'), {
      participants: [currentUser.uid, selectedUser.id],
      lastMessage: message,
      updatedAt: serverTimestamp(),
    });

    conversationId = newConversationRef.id;

    // ✅ Immediately set the selectedUser in conversationUsers map (prevents missing username)
    setConversationUsers(prev => ({
      ...prev,
      [selectedUser.id]: selectedUser,
    }));

    // ✅ Also ensure their full profile is fetched (just in case)
    await fetchUserProfiles([selectedUser.id]);
  } catch (err: any) {
    console.error('Create conversation failed:', err);
    return;
  }

  try {
    // Add the first message
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: currentUser.uid,
      text: message,
      timestamp: serverTimestamp(),
      readBy: { [currentUser.uid]: true },
    });

    // Update conversation with latest message info
    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: message,
      updatedAt: serverTimestamp(),
    });

    // ✅ Optional fallback in case the snapshot hasn’t updated UI yet
    const exists = conversations.some(c => c.id === conversationId);
    if (!exists) {
      const fallbackConversation: ConversationData = {
        id: conversationId,
        participants: [currentUser.uid, selectedUser.id],
        lastMessage: message,
        updatedAt: new Date(), // Temporarily local timestamp
      };
      setConversations(prev => [fallbackConversation, ...prev]);
    }

    // Update state and UI
    setActiveConversationId(conversationId);
    setMessage('');
    setSearchInput('');
    setSelectedUser(null);

    // Close modal
    setTimeout(() => {
      setIsMessageModalOpen(false);
    }, 100);
  } catch (err) {
    console.error('Send message failed:', err);
  }
};


  return (
    <div className="main-wrapper">
      {/* Top bar with search and profile */}
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
                onClick={() => handleUserSelect(user)}
                className='suggestion-item flex items-center p-2 hover:bg-gray-200'
              >
                {user.profilePicUrl ? (
                  <img
                    src={user.profilePicUrl}
                    alt={user.username || 'User'}
                    className='w-10 h-10 rounded-full object-cover'
                  />
                ) : (
                  <div className='w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center text-white'>
                    <IoMdContact className='w-5 h-5' />
                  </div>
                )}
                <span>{user.username || 'No username found'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <h1 className="text-xl font-bold absolute top-4 left-4">Messages</h1>

      <div className="absolute top-4 right-4">
        <button onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          {profilePicUrl ? (
            <img
              src={profilePicUrl}
              alt="Profile"
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <IoMdContact className='w-10 h-10 cursor-pointer' />
          )}
        </button>
        {isDropdownOpen && (
          <div className="absolute right-0 w-36 bg-white border rounded shadow z-50">
            <button
              onClick={() => navigate(`/profile/${currentUser?.uid}`)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              Profile
            </button>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-500"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div className="flex mt-16 h-[calc(100vh-4rem)] overflow-hidden">
        <div className="w-6/12 border-r border-gray-200 bg-gray-50 overflow-y-auto">
          <button
            className="m-4 bg-slate-500 hover:bg-slate-300 text-white hover:text-black font-bold py-2 px-4 rounded"
            onClick={() => setIsMessageModalOpen(true)}
          >
            new message
          </button>
          {conversations.length === 0 ? (
            <p className="text-gray-500 p-4">You have no conversations</p>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => setActiveConversationId(conversation.id)}
                className="p-4 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
              >
                <div className="font-medium">
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
            ))
          )}
        </div>
        <div className="flex-1 bg-gray-50 overflow-y-auto">
          {activeConversationId ? (
            <MessageThread conversationId={activeConversationId} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <p>Select a conversation to start messaging</p>
            </div>
          )}
        </div>
      </div>
      {isMessageModalOpen && (
  <div className="transition-opacity duration-200 ease-in-out fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white w-full max-w-md p-6 rounded shadow-lg">
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
                <img src={user.profilePicUrl} alt="" className="w-8 h-8 rounded-full mr-2" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
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
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border px-3 py-2 h-20 mb-4 rounded"
          />
          <button
            onClick={handleSendMessage}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded mr-2"
          >
            Send
          </button>
        </>
      )}

      {/* Cancel */}
      <button
        onClick={() => {
          setIsMessageModalOpen(false);
          setMessage('');
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

      {/* Message Modal and other components remain unchanged */}
    </div>
  );
};

export default Messages;
