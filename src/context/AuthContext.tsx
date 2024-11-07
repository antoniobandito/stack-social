import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  profileData: { bio: string; location: string; prolink: string; profilePicUrl: string } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider : React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<{ bio: string; location: string; prolink: string; profilePicURL: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
      setCurrentUser(user);
      await fetchProfileData(user.uid);
      } else {
      setCurrentUser(null);
      setProfileData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchProfileData = async (uid: string) => {
    try {
      const userDoc = doc(db, 'users', uid);
      const docSnapshot = await getDoc(userDoc);
      if (docSnapshot.exists()) {
        setProfileData(docSnapshot.data() as { bio: string; location: string; prolink: string; profilePicURL: string });
      } else {
        console.log('No profile data found');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, profileData }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
