// Fixed MessageThread.tsx with logging and fallback for missing timestamps
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
  getDocs
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { IoMdContact } from 'react-icons/io';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp?: any;
  readBy?: Record<string, boolean>;
}

interface MessageThreadProps {
  conversationId: string;
}

const MessageThread: React.FC<MessageThreadProps> = ({ conversationId }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  useEffect(() => {
    if (!conversationId || !currentUser) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        console.log('No messages found for conversation:', conversationId);
      }

      const msgData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          senderId: data.senderId,
          text: data.text,
          timestamp: data.timestamp,
          readBy: data.readBy || {},
        };
      });

      console.log('Loaded messages:', msgData);
      setMessages(msgData);
    });

    return () => unsubscribe();
  }, [conversationId, currentUser]);

  // Mark messages as read
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!conversationId || !currentUser) return;

      for (const msg of messages) {
        if (!msg.readBy || !msg.readBy[currentUser.uid]) {
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      senderId: currentUser?.uid,
      text: newMessage.trim(),
      timestamp: serverTimestamp(),
      readBy: { [currentUser!.uid]: true }
    };

    await updateDoc(doc(db, 'conversations', conversationId), {
      lastMessage: newMessage,
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'conversations', conversationId, 'messages'), newMsg);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
          key={msg.id}
          className={`mb-2 flex ${msg.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`rounded-lg px-4 py-2 max-w-[75%] text-sm shadow 
              ${msg.senderId === currentUser?.uid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}
            `}
          >
            <p>{msg.text}</p>
            {msg.timestamp && (
              <p className="text-[10px] text-gray-300 mt-1 text-right">
                {new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
            {msg.senderId === currentUser?.uid && msg.readBy && Object.keys(msg.readBy).length > 1 && (
              <p className="text-[10px] text-gray-300 mt-1 text-right">Seen</p>
            )}
          </div>
        </div>
        
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          className="flex-1 border border-gray-300 rounded px-4 py-2"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageThread;
