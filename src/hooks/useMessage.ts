import { collection, where, orderBy, onSnapshot, QueryDocumentSnapshot, query } from "firebase/firestore";
import { useState, useEffect } from "react";
import { db } from "../services/firebase";

interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: any;
  readBy?: Record<string, boolean>;
  deleted?: boolean;
  
}

export const useMessages = (conversationId: string) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
  
    useEffect(() => {
      if (!conversationId) {
      setMessages([]);
      setLoading(false);
      return;
    }
  
      const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('timestamp', 'desc')
      );
  
      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
        const messageList = snapshot.docs.map(
          (doc: QueryDocumentSnapshot) => 
          ({
          ...doc.data(),
          messageId: doc.id,
          } as Message)
        );
        
        setMessages(messageList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching messages: ', error)
        setLoading(false)
        }
      );
  
      return () => unsubscribe();
    }, [conversationId]);
  
    return { messages, loading };
  };