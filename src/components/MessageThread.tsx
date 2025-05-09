// Enhanced MessageThread.tsx with original styling but improved functionality
import React, { useEffect, useRef, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  addDoc,
  getDocs,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { IoMdContact, IoMdSend, IoMdImage } from 'react-icons/io';
import { BsCheckAll, BsCheck } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp?: any;
  readBy?: Record<string, boolean>;
  mediaUrl?: string;
  mediaType?: string;
}

interface UserProfile {
  id: string;
  username?: string;
  profilePicUrl?: string;
  displayName?: string;
  isTyping?: boolean;
}

interface MessageThreadProps {
  conversationId: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({ conversationId }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [inputRows, setInputRows] = useState(1);

  useEffect(() => {
    if (messages.length > 0 && messagesEndRef.current) {
      const messageContainer = messagesEndRef.current.parentElement;
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    const fetchParticipants = async () => {
      if (!conversationId) return;

      try {
        const conversationRef = doc(db, 'conversations', conversationId);
        const conversationSnap = await getDoc(conversationRef);
        
        if (conversationSnap.exists()) {
          const participantIds = conversationSnap.data().participants || [];
          const participantsData: UserProfile[] = [];
          
          for (const userId of participantIds) {
            if (userId !== currentUser?.uid) {
              const userRef = doc(db, 'users', userId);
              const userSnap = await getDoc(userRef);
              
              if (userSnap.exists()) {
                participantsData.push({
                  id: userId,
                  username: userSnap.data().username || 'User',
                  profilePicUrl: userSnap.data().profilePicUrl || null,
                  displayName: userSnap.data().displayName || userSnap.data().username || 'User',
                  isTyping: false
                });
              }
            }
          }
          
          setParticipants(participantsData);
        }
      } catch (error) {
        console.error('Error fetching participants:', error);
      }
    };

    fetchParticipants();
  }, [conversationId, currentUser]);

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          text: data.text || '',
          timestamp: data.timestamp,
          readBy: data.readBy || {},
          mediaUrl: data.mediaUrl || null,
          mediaType: data.mediaType || null
        };
      });

      setMessages(msgData);
    });

    return () => unsubscribe();
  }, [conversationId, currentUser]);

  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!conversationId || !currentUser) return;

      for (const msg of messages) {
        if (msg.senderId !== currentUser.uid && (!msg.readBy || !msg.readBy[currentUser.uid])) {
          const msgRef = doc(db, 'conversations', conversationId, 'messages', msg.id);
          await updateDoc(msgRef, {
            [`readBy.${currentUser.uid}`]: true
          });
        }
      }
    };

    if (messages.length > 0) markMessagesAsRead();
  }, [messages, conversationId, currentUser]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      updateTypingStatus(false);
    };
  }, []);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const lineHeight = parseInt(getComputedStyle(textareaRef.current).lineHeight);
      const maxHeight = lineHeight * 3;
      
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      setInputRows(Math.min(Math.floor(scrollHeight / lineHeight), 3));
    }
  };

  const handleProfileClick = (userId: string) => {
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 3000);
  };

  const updateTypingStatus = async (isTyping: boolean) => {
    if (!currentUser || !conversationId) return;
    
    try {
      const typingRef = doc(db, 'conversations', conversationId, 'typing', currentUser.uid);
      await setDoc(typingRef, {
        userId: currentUser.uid,
        isTyping,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !fileUpload) || !currentUser) return;

    try {
      setIsTyping(false);
      updateTypingStatus(false);
      
      let mediaUrl = null;
      let mediaType = null;
      
      if (fileUpload) {
        setIsUploading(true);
        const storage = getStorage();
        const fileRef = ref(storage, `messages/${conversationId}/${Date.now()}_${fileUpload.name}`);
        
        await uploadBytes(fileRef, fileUpload);
        mediaUrl = await getDownloadURL(fileRef);
        mediaType = fileUpload.type.startsWith('image/') ? 'image' : 'file';
        
        setFileUpload(null);
        setImagePreview(null);
        setIsUploading(false);
      }

      const newMsg = {
        senderId: currentUser.uid,
        text: newMessage.trim(),
        timestamp: serverTimestamp(),
        readBy: { [currentUser.uid]: true },
        ...(mediaUrl && { mediaUrl, mediaType })
      };

      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: mediaType ? `${currentUser.displayName || 'User'} sent ${mediaType === 'image' ? 'an image' : 'a file'}` : newMessage,
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, 'conversations', conversationId, 'messages'), newMsg);
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      setInputRows(1);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileUpload(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    }
  };

  const cancelFileUpload = () => {
    setFileUpload(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    let currentGroup: { date: string; messages: Message[] } | null = null;

    messages.forEach(message => {
      if (!message.timestamp) return;
      
      const messageDate = new Date(message.timestamp.seconds * 1000);
      const formattedDate = format(messageDate, 'MMMM d, yyyy');
      
      if (formattedDate !== currentDate) {
        currentDate = formattedDate;
        currentGroup = { date: formattedDate, messages: [] };
        groups.push(currentGroup);
      }
      
      currentGroup?.messages.push(message);
    });
    
    return groups;
  };

  const renderMessageStatus = (message: Message) => {
    if (!message.timestamp) return null;
    
    const isRead = message.readBy && 
                  Object.keys(message.readBy).filter(uid => uid !== currentUser?.uid).length > 0;
    
    return (
      <div className="flex items-center text-xs space-x-1">
        <span className="text-gray-400">
          {format(new Date(message.timestamp.seconds * 1000), 'h:mm a')}
        </span>
        {message.senderId === currentUser?.uid && (
          <span className="text-blue-500">
            {isRead ? <BsCheckAll size={14} /> : <BsCheck size={14} />}
          </span>
        )}
      </div>
    );
  };

  const isAnyoneTyping = participants.some(p => p.isTyping);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center sticky top-0 z-10 h-16">
        {participants.length > 0 ? (
          <div className="flex items-center">
            {participants[0].profilePicUrl ? (
              <img 
                src={participants[0].profilePicUrl} 
                alt={participants[0].displayName} 
                className="w-10 h-10 rounded-full mr-3 object-cover"
                onClick={() => handleProfileClick(participants[0].id)}
              />
            ) : (
              <div className="w-10 h-10 rounded-full mr-3 flex items-center justify-center">
                <IoMdContact 
                  className="text-gray-600 w-6 h-6" 
                  onClick={() => handleProfileClick(participants[0].id)}
                />
              </div>
            )}
            <div>
              <h3 className="font-bold text-gray-900">
                {participants.length === 1 
                  ? participants[0].displayName 
                  : `${participants[0].displayName} and ${participants.length - 1} others`}
              </h3>
              <p className="text-xs text-gray-500">
                {participants.length === 1 
                  ? `@${participants[0].username}` 
                  : `@${participants[0].username} and others`}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full mr-3" />
            <div className="h-4 w-24 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {groupMessagesByDate().map((group, groupIndex) => (
          <div key={groupIndex}>
            <div className="flex justify-center my-4">
              <div className="text-gray-500 text-xs px-3 py-1 rounded-full">
                {group.date}
              </div>
            </div>
            
            {group.messages.map((msg, msgIndex) => {
              const isCurrentUser = msg.senderId === currentUser?.uid;
              const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
              const nextMsg = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : null;
              
              const isFirstInSequence = !prevMsg || prevMsg.senderId !== msg.senderId;
              const isLastInSequence = !nextMsg || nextMsg.senderId !== msg.senderId;
              
              return (
                <div 
                  key={msg.id}
                  className={`mb-1 flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <div className="mr-2 self-start flex-shrink-0 mt-4 w-6">
                      {isFirstInSequence && (
                        participants.find(p => p.id === msg.senderId)?.profilePicUrl ? (
                          <img 
                            src={participants.find(p => p.id === msg.senderId)?.profilePicUrl} 
                            alt="avatar" 
                            className="w-6 h-6 rounded-full object-cover"
                            onClick={() => handleProfileClick(msg.senderId)}
                          />
                        ) : (
                          <div 
                            className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center"
                            onClick={() => handleProfileClick(msg.senderId)}
                          >
                            <IoMdContact className="w-4 h-4 text-gray-600" />
                          </div>
                        )
                      )}
                    </div>
                  )}
                  
                  <div className={`${isCurrentUser ? 'ml-4' : ''} ${isFirstInSequence ? 'mt-2' : 'mt-0.5'}`}>
                    <div
                      className={`
                        px-3 py-2 max-w-[450px] shadow-sm
                        ${isCurrentUser 
                          ? 'text-black rounded-2xl rounded-tr-sm' 
                          : 'bg-gray-50 text-black rounded-2xl rounded-tl-sm'}
                      `}
                    >
                      {msg.mediaUrl && msg.mediaType === 'image' && (
                        <div className="mb-2">
                          <img 
                            src={msg.mediaUrl} 
                            alt="attached media" 
                            className="rounded-lg max-w-full max-h-64 object-contain"
                          />
                        </div>
                      )}
                      
                      {msg.mediaUrl && msg.mediaType !== 'image' && (
                        <div className="mb-2 flex items-center text-sm">
                          <a 
                            href={msg.mediaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className={`flex items-center ${isCurrentUser ? 'text-white' : 'text-blue-500'}`}
                          >
                            <IoMdImage className="mr-1" />
                            <span className="underline">Attachment</span>
                          </a>
                        </div>
                      )}
                      
                      {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                    </div>
                    
                    {isLastInSequence && (
                      <div className={`text-[10px] mt-1 ${isCurrentUser ? 'text-right mr-1' : 'ml-1'}`}>
                        {renderMessageStatus(msg)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {isAnyoneTyping && (
          <div className="flex items-center mt-2 mb-4">
            <div className="flex space-x-1 p-2 bg-gray-100 rounded-full">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              {participants.find(p => p.isTyping)?.displayName || ''} ...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200  z-10 sticky bottom-0">
        {imagePreview && (
          <div className="px-4 pt-2">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="h-16 w-auto rounded object-cover"
              />
              <button 
                onClick={cancelFileUpload}
                className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {isUploading && (
          <div className="px-4 text-xs text-gray-500">Uploading media...</div>
        )}
        
        <div className="flex items-end gap-2 px-4 py-3 max-w-6xl mx-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-500 hover:text-blue-600 mb-1"
            disabled={isUploading}
          >
            <IoMdImage size={20} />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
            disabled={isUploading}
          />
          
          <textarea
            ref={textareaRef}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              adjustTextareaHeight();
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !isUploading) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="..."
            className="flex-1 border rounded-full px-4 py-2 outline-none resize-none"
            style={{
              minHeight: '2.5rem',
              maxHeight: '7.5rem',
              lineHeight: '1.25rem',
            }}
            rows={1}
            disabled={isUploading}
          />
          
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !fileUpload) || isUploading}
            className="text-black hover:text-blue-600 mb-1"
          >
            <IoMdSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;