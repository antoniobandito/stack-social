// MinimizedMessages.tsx - Component for minimized message window functionality
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoMdClose, IoMdExpand, IoMdContact, IoMdArrowDropupCircle, IoMdArrowDropdownCircle, IoMdArrowBack } from 'react-icons/io';
import { doc, getDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import MessageThread from './MessageThread';
import { useMessaging } from '../context/MessagingContext';

interface MinimizedMessagesProps {
  initialConversationId?: string | null;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: Date;
}

interface UserProfile {
  id: string;
  username?: string;
  profilePicUrl?: string;
}

const MinimizedMessages: React.FC<MinimizedMessagesProps> = ({ initialConversationId }) => {
  const { closeMinimizedWindow } = useMessaging();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(initialConversationId || null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;
    
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const conversationList: Conversation[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        participants: doc.data().participants,
        lastMessage: doc.data().lastMessage || '',
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      }));

      // Load all user profiles for these conversations
      const allUserIds = new Set<string>();
      conversationList.forEach(conv => {
        conv.participants.forEach(uid => {
          if (uid !== currentUser.uid) allUserIds.add(uid);
        });
      });
      
      await loadUserProfiles(Array.from(allUserIds));
      setConversations(conversationList);
      
      // Count unread messages for each conversation
      conversationList.forEach(conv => {
        countUnreadMessages(conv.id);
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Load user profiles
  const loadUserProfiles = async (userIds: string[]) => {
    const profiles: Record<string, UserProfile> = { ...userProfiles };
    
    await Promise.all(userIds.map(async (uid) => {
      if (!profiles[uid]) {
        try {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            profiles[uid] = {
              id: uid,
              username: userDoc.data().username || `User ${uid.substring(0, 4)}`,
              profilePicUrl: userDoc.data().profilePicUrl || null
            };
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      }
    }));
    
    setUserProfiles(profiles);
  };

  // Count unread messages
  const countUnreadMessages = async (conversationId: string) => {
    if (!currentUser) return;
    
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, where(`readBy.${currentUser.uid}`, '==', false));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCounts(prev => ({
        ...prev,
        [conversationId]: snapshot.docs.length
      }));
    });
    
    return () => unsubscribe();
  };

  const expandToFullMessages = () => {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem('scrollPositionBeforeMessages', scrollPosition.toString());
    sessionStorage.setItem('locationPathBeforeMessages', location.pathname);
    
    navigate('/messages', { 
      state: { activeConversationId } 
    });
  };

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setIsExpanded(true);
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    closeMinimizedWindow();
  };

  return (
    <div 
      ref={containerRef}
      className={`fixed z-50 bottom-16 left-4 bg-white rounded-lg shadow-xl overflow-hidden transition-[transform,width,height] duration-300 border border-gray-200
        ${isExpanded ? 'w-80 h-96' : 'w-64 h-12'}
      `}
    >
      {/* Header with animated layout */}
      <div className="flex items-center justify-between p-2 border-b h-10 text-black">
        <div className="flex items-center flex-1 overflow-hidden">
          {/* Animated back button container */}
          <div className={`transition-all duration-300 ${
            isExpanded && activeConversationId ? 'w-6 opacity-100' : 'w-0 opacity-0'
          }`}>
            {isExpanded && activeConversationId && (
              <button
                onClick={() => setActiveConversationId(null)}
                className="p-1 hover:bg-gray-200 rounded w-6"
              >
                <IoMdArrowBack size={16} />
              </button>
            )}
          </div>

          {/* Title with sliding animation */}
          <h3 className={`font-medium text-sm truncate transition-all duration-300 ${
            isExpanded && activeConversationId ? 'ml-2' : 'ml-0'
          }`}>
            {isExpanded && activeConversationId ? 
              conversations.find(c => c.id === activeConversationId)?.participants
                .filter(id => id !== currentUser?.uid)
                .map(id => userProfiles[id]?.username || 'User')
                .join(', ') : 
              'Messages'
            }
          </h3>
        </div>

        {/* Right-aligned control buttons */}
        <div className="flex items-center space-x-1">
          <button 
            onClick={toggleExpanded} 
            className="p-1 hover:bg-gray-200 rounded text-black"
          >
            {isExpanded ? <IoMdArrowDropdownCircle size={16} /> : <IoMdArrowDropupCircle size={16} />}
          </button>
          <button 
            onClick={expandToFullMessages} 
            className="p-1 hover:bg-gray-200 rounded text-black"
          >
            <IoMdExpand size={16} />
          </button>
          <button 
            onClick={handleClose}
            className="p-1 hover:bg-gray-200 rounded text-black"
          >
            <IoMdClose size={16} />
          </button>
        </div>
      </div>

      {/* Body content remains the same */}
      <div className={`flex flex-col ${isExpanded ? 'h-[calc(100%-32px)]' : 'h-0'} overflow-hidden`}>
        {isExpanded && activeConversationId ? (
          <div className="flex-1 overflow-hidden">
            <MessageThread 
              conversationId={activeConversationId}
              key={activeConversationId}
            />
          </div>
        ) : isExpanded ? (
          <div className="flex-1 overflow-y-auto p-1">
            {conversations.map((conversation) => {
              const otherUserIds = conversation.participants.filter(id => id !== currentUser?.uid);
              const hasUnread = unreadCounts[conversation.id] > 0;
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation.id)}
                  className={`p-2 cursor-pointer hover:bg-gray-50 rounded-md flex items-center ${
                    hasUnread ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="mr-2">
                    {otherUserIds.length > 0 && userProfiles[otherUserIds[0]]?.profilePicUrl ? (
                      <img
                        src={userProfiles[otherUserIds[0]].profilePicUrl}
                        alt="User"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <IoMdContact className="text-gray-600 w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <div className={`font-medium truncate text-sm ${hasUnread ? 'font-bold' : ''}`}>
                        {otherUserIds
                          .map(id => userProfiles[id]?.username || `User ${id.substring(0, 4)}`)
                          .join(', ')}
                      </div>
                      {hasUnread && (
                        <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs ml-1">
                          {unreadCounts[conversation.id]}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {conversation.lastMessage}
                    </div>
                  </div>
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No conversations yet
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Collapsed preview */}
      {!isExpanded && (
        <div className="h-full flex items-center px-2">
          <span className="text-sm font-medium">
            {conversations.length > 0 ? `${conversations.length} conversation${conversations.length !== 1 ? 's' : ''}` : 'No messages'}
          </span>
          {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) > 0 && (
            <span className="ml-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MinimizedMessages;