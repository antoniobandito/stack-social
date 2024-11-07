import React, { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import FloatingActionButton from '../components/FloatingActionButton';
import Post from '../components/Post';
import ProfileBanner from '../components/ProfileBanner';
import '../styles/global.css';
import { useAuth } from '../context/AuthContext'; // Assuming you have an Auth context
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';


interface PostData {
  id: string;
  content: string;
  authorId: string;
  authorUsername: string;
  likes?: string[];
  reposts?: string[];
  mediaURL?: string;
  fileURL?: string;
  createdAt: Date;
}

interface ProfileData {
  bio: string;
  location: string;
  prolink: string;
  username: string;
  profilePicUrl: string;
}

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [profileData, setProfileData] = useState<ProfileData>({ 
    bio: '', 
    location: '', 
    prolink: '',
    username: '',
    profilePicUrl: '',
  });


  useEffect(() => {
    if (!currentUser) return; // Exit if there's no user logged in

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData: PostData[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(), // Convert Firestore timestamp to JS Date
          };
        }) as PostData[];

        // Filter posts to only include those created by the current user
        const userPosts = postsData.filter(post => post.authorId === currentUser.uid);
        setPosts(userPosts);
      });

    // Fetch user's profile data
    const profileRef = doc(db, 'users', currentUser.uid);
    const unsubscribeProfile = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        setProfileData(doc.data() as ProfileData);
      }
    });

    return () => {

    unsubscribePosts();
    unsubscribeProfile();
    };
  }, [currentUser]);

    const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || !currentUser) return;
      
      const file = event.target.files[0];
      const storageRef = ref(storage, `profile_pics/${currentUser.uid}`);
      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', currentUser.uid), { profilePicUrl: downloadURL });
      setProfileData(prev => ({ ...prev, profilePicUrl: downloadURL }));
    };

  return (
    <div className="profile-page">
      <div className='profile-banner-container'>
      <ProfileBanner 
      bio={profileData.bio} 
      location={profileData.location} 
      prolink={profileData.prolink}
      username={profileData.username}
      profilePicUrl={profileData.profilePicUrl}
      onProfilePicUpload={handleProfilePicUpload} 
      />
      </div>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="grid-container"
        columnClassName="grid-item"
      >
        {posts.map(post => (
          <div key={post.id} className="grid-item">
            <Post {...post} />
          </div>
        ))}
      </Masonry>
      <FloatingActionButton />
    </div>
  );
};

export default ProfilePage;
