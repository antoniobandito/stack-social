import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';


const ProfileBanner = () => { 
    const { currentUser, profileData } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [newBio, setNewBio] = useState(profileData?.bio || '');
    const [newLocation, setNewLocation] = useState(profileData?.location || '');
    const [newProLink, setNewProLink] = useState(profileData?.prolink || '');
    const [newProfilePicUrl, setNewProfilePicUrl] = useState(profileData?.profilePicUrl || '');

    useEffect(() => {
        if (profileData) {
            setNewBio(profileData.bio || '');
            setNewLocation(profileData.location || '');
            setNewProLink(profileData.prolink || '');
            setNewProfilePicUrl(profileData.profilePicUrl || '');
        }
    }, [profileData]);

    const handleSave = async () => {
        // Save to database here
        if (!currentUser) return;

        setIsEditing(false);

        try {
            const userDoc = doc(db, 'users', currentUser.uid);
            await updateDoc(userDoc, {
                bio: newBio,
                location: newLocation,
                prolink: newProLink,
                profilePicUrl: newProfilePicUrl,
            });
            console.log("Profile updated successfully.");
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating profile: ', error);
        }    
    };

    const handleProfilePicUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !currentUser) return;

        const file = event.target.files[0];
        const storageRef = ref(storage, `profile_pics/${currentUser.uid}`);

        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            setNewProfilePicUrl(downloadURL);

            // Update the Firestore document with the new profile picture URL
            const userDoc = doc(db, 'users', currentUser.uid);
            await updateDoc(userDoc, { profilePicUrl: downloadURL });
            console.log("Profile picture updated successfully.");
        } catch (error) {
            console.error("Error uploading profile picture:", error);
        }
    };

    return (
    <div className='profile-banner'>
        <div className='profile-pic'>
            <label htmlFor='profile-pic-upload'>
                <img
                src={newProfilePicUrl || 'src/assets/default_pfp.svg.png'}
                alt=''
                className='profile-pic-img'
                />
            </label>
            <input 
            id='profile-pic-upload'
            type='file'
            accept='image/*'
            style={{ display: 'none' }}
            onChange={handleProfilePicUpload}
            />
        </div>
        {/* Username Display */}
        <h2>{profileData?.username || ''}</h2>

        {/* Editable Profile Info */}
        <div className='profile-info'>
            {isEditing ? (
                <input 
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder='Bio' 
                />
            ) : (
                <p>{newBio}</p>
            )}

            {isEditing ? (
                <input 
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder='Location'
                />
            ) : (
                <p>{newLocation}</p>
            )}

            {isEditing ? (
                <input 
                value={newProLink}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder='Link'
                />
            ) : (
                <p>{newProLink}</p>
            )}
        </div>

        <div className='profile-links'>
            <span>follow </span>
            <span>message </span>
        </div>

        <div className='profile-edit-button'>
            <button onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? "Cancel" : "Edit"}
            </button>
            {isEditing && <button onClick={handleSave}>Save</button>}
        </div>
    </div>
  )
}

export default ProfileBanner