import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

interface Conversation {
    isGroupChat: any;
    conversationId: string;
    participants: string[];
    groupName?: string;
    lastMessage?: {
        text: string;
        senderId: string;
        timestamp: any;
    };
    updatedAt: any;
}

export const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = auth.currentUser;


    if (!currentUser) {
        setConversations([]);
        setLoading(false);
     return;
    }
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
      const conversationList = snapshot.docs.map(
        (doc: QueryDocumentSnapshot) => 
        ({
        ...doc.data(),
        conversationId: doc.id,
      } as Conversation)
      );
      setConversations(conversationList);
      setLoading(false);
    },
    (error) => {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { conversations, loading };
};