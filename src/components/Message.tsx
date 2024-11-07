import React, { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

const Messages: React.FC = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const fetchMessages = async () => {
        const messagesQuery = query(collection(db, 'messages'), where('to', '==', user.email));
        const messagesSnapshot = await getDocs(messagesQuery);
        const messagesList = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setMessages(messagesList);
      };
      fetchMessages();
    }
  }, [user]);

  const handleSend = async () => {
    if (user) {
      await addDoc(collection(db, 'messages'), {
        from: user.email,
        to: recipient, // Replace with actual recipient logic
        content: newMessage,
        createdAt: new Date(),
      });
      setNewMessage('');
      setRecipient('');
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input 
          type="text" 
          value={recipient} 
          onChange={(e) => setRecipient(e.target.value)} 
          placeholder="Recipient Email" 
          className="border p-2 rounded" 
          required 
        />
        <textarea 
          value={newMessage} 
          onChange={(e) => setNewMessage(e.target.value)} 
          placeholder="Type a message" 
          className="border p-2 rounded w-full" 
          required 
        />
        <button onClick={handleSend} className="mt-2 bg-blue-500 text-white px-4 py-2 rounded">Send</button>
      </div>
      <div>
        {messages.map(message => (
          <div key={message.id} className="border p-4 rounded-lg shadow-md mb-4">
            <div>From: {message.from}</div>
            <div>{message.content}</div>
            <div className="text-sm text-gray-600">{new Date(message.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Messages;