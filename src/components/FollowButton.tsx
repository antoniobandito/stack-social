import { deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

interface ProfileBannerProps {
    bio: string;
    prolink: string;
    location: string;
    profilePicUrl: string;
    username: string;
    email: string,
    isEditable: boolean; // Determines if the profile can be edited (only for currentUser)
    onProfilePicUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void; // Optional upload function  
    }    

const ProfileBanner: React.FC<ProfileBannerProps> = ({
    bio,
    prolink,
    location,
    profilePicUrl,
    username,
    email,
    isEditable,
    onProfilePicUpload,
    }) => {
    const { currentUser } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [newBio, setNewBio] = useState(bio);
    const [newLocation, setNewLocation] = useState(location);
    const [newProLink, setNewProLink] = useState(prolink);
    const [profilePic, setProfilePic] = useState(profilePicUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const isOwner = currentUser?.email === email;

    useEffect(() => {
        // Update editable fields when props change
            setNewBio(bio || '');
            setNewLocation(location || '');
            setNewProLink(prolink || '');
            setProfilePic(profilePicUrl || '');
        }, [bio, location, prolink, profilePicUrl]);


    useEffect(() => {
    // Check if the current user is following this profile 
    if (!currentUser || isOwner) return;

    const docRef = doc(db, 'users', currentUser.uid, 'following', email);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
    setIsFollowing(docSnap.exists());
    });

    return () => unsubscribe(); // Cleanup listener
    }, [currentUser, email, isOwner]);
    
    const handleFollow = async () => {
      if (!currentUser || isOwner || isLoading) return;
      setIsLoading(true);

      try {

        const userDocRef = doc(db, 'users', email);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          setIsLoading(false)
          return;
        }

        const targetUserUID = userDocSnap.id;
        // Add to 'following' subcollection of the current user
        await setDoc(doc(db, 'users', currentUser.uid, 'following', email), {
          email,
          username,
        });
        // Add to 'followers' subcollection of the target user
        await setDoc(doc(db, 'users', targetUserUID, 'followers', currentUser.email!), {
          email: currentUser.email,
          username: currentUser.displayName || currentUser.email,
        });

        setIsFollowing(true);
      } catch (error) {
        console.error('Error following user:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    const handleUnfollow = async () => {
      if (!currentUser || isOwner || isLoading) return;
      setIsLoading(true);

      try {
      // Remove from 'following' subcollection of the current
      await deleteDoc(doc(db, 'users', currentUser.uid, 'following', email));
      // Remove from 'followers' subcollection of the target user
       await deleteDoc(doc(db, 'users', email, 'followers', currentUser.email!));
      
       setIsFollowing(false);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    } finally {
      setIsLoading(false);
    }
  };


    const handleSave = async () => {
        // Save to database here
      if (!isOwner) return; // Only save changes if editing own profile
        try {
          const userDoc = doc(db, 'users', currentUser.uid);
          //Update Firestore document with new Values 
          await updateDoc(userDoc, {
          bio: newBio,
          location: newLocation,
          prolink: newProLink,
          });
          console.log("Profile updated successfully.");
          setIsEditing(false);
          } catch (error) {
          console.error('Error updating profile: ', error);
        }    
    };

    const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !isOwner) return;
    
        const file = event.target.files[0];
        const storageRef = ref(storage, `profilePic/${currentUser.uid}`);
        setIsUploading(true);

        try {
          await uploadBytes(storageRef, file);
          const downloadURL = await getDownloadURL(storageRef);
          await updateDoc(doc(db, 'users', currentUser.uid), { profilePicUrl: downloadURL, });
          setProfilePic(downloadURL);
          console.log('Profile picture updated successfully!');
        } catch (error) {
          console.error('Error uploading profile picture:', error);
        } finally {
          setIsUploading(false);
        }
      };
    
    
    return (
    <div className='profile-banner'>
        {/* Profile Picture */}
        <div className='profile-pic'>
            <label htmlFor='profile-pic-upload'> 
            {isUploading ? (
            <div className="spinner">Loading...</div> 
            ) : (
            <img
            src={profilePic}
            className='profile-pic-img'/>
            )}
            </label>
            {isOwner && (
            <input 
            id='profile-pic-upload'
            type='file'
            accept='image/*'
            style={{ display: 'none' }}
            onChange={onProfilePicUpload || handleProfilePicUpload}
            />
            )}
            </div>

        {/* Username Display */}
        <h2>{username}</h2>

        {/* Editable Profile Info */}
        <div className='profile-info'>
            {isEditing ? (
            <>
                <input 
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder='Bio' 
                />
                <input 
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder='Location'
                />
                <input 
                value={newProLink}
                onChange={(e) => setNewProLink(e.target.value)}
                placeholder='Link'
                />
            </>
        ) : (
            <>
                <p>{bio || ''}</p>
                <p>{location || ''}</p>
                <p>{prolink || ''}</p>
            </>
        )}
        </div>
        {/* Edit/Save Buttons */}
        {isOwner ? (
        <div className='profile-edit-button'>
            {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)}>Edit</button>
          )}
        </div>
        ) : (
        // FollowButton Component 
        <div className='follow-button'>
          {isFollowing ? (
            <button onClick={handleUnfollow} disabled={isLoading}>
              {isLoading ? '...' : 'unfollow'}
            </button>
        ) : (
            <button onClick={handleFollow} disabled={isLoading}>
              {isLoading ? '...' : 'follow'}
            </button>
          )}
          </div>
        )}
    </div>
  );
};

ProfileBanner.defaultProps = {
  bio: "",
  prolink: "",
  location: "",
  profilePicUrl: "",
  username: "",
  email: "",
  isEditable: false,
};

export default ProfileBanner;