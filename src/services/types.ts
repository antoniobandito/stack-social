interface User {
    userId: string;
    username: string;
    avatar: string;
    messaging: {
      allowMessagesFrom: 'everyone' | 'followers' | 'mutuals';
      notificationsEnabled: boolean;
      mutedConversations: string[];
    };
    recentConversations: string[];
  }
  
  interface Message {
    messageId: string;
    conversationId: string;
    senderId: string;
    text: string;
    timestamp: Date;
    readBy: Record<string, Date>;
    attachments?: Array<{
      type: string;
      url: string;
      thumbnailUrl: string;
    }>;
    deleted: boolean;
  }
  
  interface Conversation {
    conversationId: string;
    participants: string[];
    lastMessage: {
      text: string;
      timestamp: Date;
      senderId: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
    isGroupChat: boolean;
    groupName?: string;
    groupAvatar?: string;
  }