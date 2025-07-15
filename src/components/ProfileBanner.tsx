import { collection, query, serverTimestamp, deleteDoc, doc, getDoc, onSnapshot, setDoc, updateDoc, where, writeBatch, getDocs } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

interface ProfileBannerProps {
    bio: string;
    prolink: string;
    location: string;
    profilePicUrl: string;
    username: string;
    email: string;
    isEditable: boolean;
    onProfilePicUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface UserItem {
    uid: string;
    username: string;
    profilePicUrl: string;
}

const ProfileBanner: React.FC<ProfileBannerProps> = ({
    bio,
    prolink,
    location,
    profilePicUrl,
    username,
    email,
    onProfilePicUpload,
}) => {
    const { currentUser } = useAuth();
    const isOwner = currentUser?.email === email;

    // State management
    const [isEditing, setIsEditing] = useState(false);
    const [newBio, setNewBio] = useState(bio);
    const [newLocation, setNewLocation] = useState(location);
    const [newProLink, setNewProLink] = useState(prolink);
    const [profilePic, setProfilePic] = useState(profilePicUrl || '');
    const [isUploading, setIsUploading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Follow Stats
    const [followerCount, setFollowerCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [showFollowersModal, setShowFollowersModal] = useState(false);
    const [showFollowingModal, setShowFollowingModal] = useState(false);
    const [followerList, setFollowerList] = useState<UserItem[]>([]);
    const [followingList, setFollowingList] = useState<UserItem[]>([]);

    useEffect(() => {
        setNewBio(bio || '');
        setNewLocation(location || '');
        setNewProLink(prolink || '');
        setProfilePic(profilePicUrl || '');
    }, [bio, location, prolink, profilePicUrl]);

    useEffect(() => {
        const checkFollowStatus = async () => {
            if (!currentUser || isOwner) return;

            try {
                const userQuery = query(
                    collection(db, 'users'),
                    where('email', '==', email)
                );
                const userSnapshot = await getDocs(userQuery);

                if (userSnapshot.empty) return;

                const targetUserDoc = userSnapshot.docs[0];
                const targetUserUID = targetUserDoc.id;

                const followDocRef = doc(
                    db,
                    'users',
                    currentUser.uid,
                    'following',
                    targetUserUID
                );

                const followDocSnap = await getDoc(followDocRef);
                setIsFollowing(followDocSnap.exists());
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        };
        checkFollowStatus();
    }, [currentUser, email, isOwner]);

    useEffect(() => {
        const fetchFollowCounts = async () => {
            const userSnapshot = await getDocs(
                query(collection(db, 'users'), where('email', '==', email))
            );
            if (userSnapshot.empty) return;
            const uid = userSnapshot.docs[0].id;

            const followersSnap = await getDocs(collection(db, 'users', uid, 'followers'));
            const followingSnap = await getDocs(collection(db, 'users', uid, 'following'));

            setFollowerCount(followersSnap.size);
            setFollowingCount(followingSnap.size);
        };
        fetchFollowCounts();
    }, [email, isFollowing]);

    const handleFollow = async () => {
      if (!currentUser || isOwner || isLoading) return;
      setIsLoading(true);
    
      try {
        // Find target user by email
        const userQuery = query(
          collection(db, 'users'),
          where('email', '==', email)
        );
        const userSnapshot = await getDocs(userQuery);
    
        if (userSnapshot.empty) return;
    
        const targetUserDoc = userSnapshot.docs[0];
        const targetUserUID = targetUserDoc.id;
    
        // Get current user's full data
        const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const currentUserData = currentUserDoc.data();
    
        const batch = writeBatch(db);
    
        const currentUserFollowingRef = doc(
          db,
          'users',
          currentUser.uid,
          'following',
          targetUserUID
        );
    
        const targetUserFollowersRef = doc(
          db,
          'users',
          targetUserUID,
          'followers',
          currentUser.uid
        );
    
        batch.set(currentUserFollowingRef, {
          email,
          username,
          followedAt: serverTimestamp()
        });
    
        batch.set(targetUserFollowersRef, {
          email: currentUser.email,
          username: currentUserData?.username || currentUser.email,
          profilePicUrl: currentUserData?.profilePicUrl || '',
          followedAt: serverTimestamp()
        });
    
        await batch.commit();
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
            const userQuery = query(
                collection(db, 'users'),
                where('email', '==', email)
            );
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.empty) {
                throw new Error('User not found');
            }

            const targetUserDoc = userSnapshot.docs[0];
            const targetUserUID = targetUserDoc.id;

            const batch = writeBatch(db);

            batch.delete(
                doc(db, 'users', currentUser.uid, 'following', targetUserUID)
            );
            batch.delete(
                doc(db, 'users', targetUserUID, 'followers', currentUser.uid)
            );

            await batch.commit();
            setIsFollowing(false);
        } catch (error) {
            console.error('Error unfollowing user:', error);
            alert('Failed to unfollow user. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!isOwner || !currentUser) return;
        try {
            const userDoc = doc(db, 'users', currentUser.uid);
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
        if (!event.target.files || !isOwner || !currentUser) return;

        const file = event.target.files[0];
        const storageRef = ref(storage, `profilePic/${currentUser.uid}`);
        setIsUploading(true);

        try {
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            await updateDoc(doc(db, 'users', currentUser.uid), { profilePicUrl: downloadURL });
            setProfilePic(downloadURL);
            console.log('Profile picture updated successfully!');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const fetchList = async (type: 'followers' | 'following') => {
        try {
            const userSnapshot = await getDocs(
                query(collection(db, 'users'), where('email', '==', email))
            );
            if (userSnapshot.empty) return;
            const uid = userSnapshot.docs[0].id;

            const listSnap = await getDocs(collection(db, 'users', uid, type));
            const items: UserItem[] = [];

            for (const listDoc of listSnap.docs) {
                const userId = listDoc.id;
                const userDoc = await getDoc(doc(db, 'users', userId));
                
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    items.push({
                        uid: userId,
                        username: userData.username || userData.email,
                        profilePicUrl: userData.profilePicUrl || ''
                    });
                }
            }

            if (type === 'followers') setFollowerList(items);
            else setFollowingList(items);
        } catch (err) {
            console.error(`Error fetching ${type}:`, err);
        }
    };

    const openModal = async (type: 'followers' | 'following') => {
        await fetchList(type);
        if (type === 'followers') setShowFollowersModal(true);
        else setShowFollowingModal(true);
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
                            src={profilePic || '/default-pic.png'}
                            className='profile-pic-img'
                            alt="Profile"
                        />
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
                    <button
                        onClick={isFollowing ? handleUnfollow : handleFollow}
                        disabled={isLoading}
                        className={`
                        ${isFollowing ? 'bg-white' : 'bg-slate-100'}
                        text-black px-3 border-slate-400 mt-2`
                        }
                    >
                        {isLoading
                            ? '...'
                            : (isFollowing ? 'unfollow' : 'follow')
                        }
                    </button>
                </div>
            )}

            {/* Follow Stats */}
            <div className="flex space-x-6 mt-4">
                <div
                    className="cursor-pointer text-center"
                    onClick={() => openModal('followers')}
                >
                    <span className="font-bold text-lg">{followerCount}</span>
                    <div className="text-sm">Followers</div>
                </div>
                <div
                    className="cursor-pointer text-center"
                    onClick={() => openModal('following')}
                >
                    <span className="font-bold text-lg">{followingCount}</span>
                    <div className="text-sm">Following</div>
                </div>
            </div>

            {/* Modals */}
            {showFollowersModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">Followers</h3>
                        <ul>
                            {followerList.map(user => (
                                <li key={user.uid} className="flex items-center mb-3">
                                    <img
                                        src={user.profilePicUrl || '/default-pic.png'}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full mr-3"
                                    />
                                    <Link to={`/profile/${user.uid}`} className="hover:underline">
                                        {user.username}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setShowFollowersModal(false)}
                            className="mt-4 px-4 py-2 bg-gray-200 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showFollowingModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">Following</h3>
                        <ul>
                            {followingList.map(user => (
                                <li key={user.uid} className="flex items-center mb-3">
                                    <img
                                        src={user.profilePicUrl || '/default-pic.png'}
                                        alt={user.username}
                                        className="w-8 h-8 rounded-full mr-3"
                                    />
                                    <Link to={`/profile/${user.uid}`} className="hover:underline">
                                        {user.username}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <button
                            onClick={() => setShowFollowingModal(false)}
                            className="mt-4 px-4 py-2 bg-gray-200 rounded"
                        >
                            Close
                        </button>
                    </div>
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