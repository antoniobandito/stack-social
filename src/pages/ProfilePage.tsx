import React, { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import { collection, doc, onSnapshot, orderBy, query, updateDoc, getDoc, where } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import FloatingActionButton from '../components/FloatingActionButton';
import Post from '../components/Post';
import ProfileBanner from '../components/ProfileBanner';
import '../styles/global.css';
import { useAuth } from '../context/AuthContext'; // Assuming you have an Auth context
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { useParams } from 'react-router-dom';


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
  email: string;
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
  const { userId } = useParams<{ userId: string }>();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<ProfileData | null>(null);
  const isEditable = currentUser?.email === userProfile?.email;
 
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) return;
      setLoading(true);
      
    
      try {
        // Fetch the profile data
        const userDoc = doc(db, "users", userId); // Ensure userId is correctly set
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
            setUserProfile(docSnap.data() as ProfileData);
        } else {
            console.log("No profile found");
        }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }   
};

    fetchProfileData();
  }, [userId]);


    // Fetch posts from selected user
    useEffect(() => {
      if (!userId) return;

    // Fetch posts for the selected user
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const userPosts: PostData[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(), // Convert Firestore timestamp to JS Date
        })) as PostData[];
        setPosts(userPosts);
      },
      (error) => {
          console.error("Error fetching posts:", error);
      }
    );

    return () => unsubscribePosts();
  }, [userId]);


    const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || !currentUser || currentUser.uid !== userId) return;
      
      const file = event.target.files[0];
      const storageRef = ref(storage, `profile_pics/${currentUser.uid}`);
      
      try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, 'users', currentUser.uid), { profilePicUrl: downloadURL });
      setProfileData((prev) => (prev ? { ...prev, profilePicUrl: downloadURL } : null));
      } catch (error) {
        console.error("Error uploading profile picture", error);
      }
    };

    // Display loading screen or the users postsand profile 
    if (loading) {
       return <div>Loading...</div>;
    }
    if (!userProfile) {
      return <div>No user data found</div>
    }

  return (
    <div className="profile-page"> 
      <div className='profile-banner-container'>
      <ProfileBanner 
          bio={userProfile.bio || ''}
          location={userProfile.location || ''}
          prolink={userProfile.prolink || ''}
          username={userProfile.username || ''}
          profilePicUrl={userProfile.profilePicUrl || ''}
          email={userProfile.email || ''}
          isEditable={isEditable}
          onProfilePicUpload={currentUser?.uid === userId ? handleProfilePicUpload : undefined}
          />
      </div>
      {posts.length === 0 ? (
      <div>No posts available</div>
      ) : (
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="grid-container"
        columnClassName="grid-item"
      >
        {posts.map((post) => (
          <div key={post.id} className="grid-item">
            <Post {...post} />
          </div>
        ))}
      </Masonry>
      )}
      {currentUser?.uid === userId && <FloatingActionButton />}
    </div>
  );
};

export default ProfilePage;