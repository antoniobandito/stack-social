import React from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

const AdminUserSubcollections: React.FC = () => {
    const addSubsollectionsForExistingUsers = async () => {
        try {
            const usersSnapshot = await getDocs(collection(db, ' users'));

            usersSnapshot.forEach(async (userDoc) => {
                const userId = userDoc.id;

                const followersRef = doc(db, `users/${userId}/followers/_init`);
                const followingRef = doc(db, `users/${userId}/following/_init`);
                
                // Add subcollections if not already present 
                await setDoc(followersRef, {}, { merge: true });
                await setDoc(followingRef, {}, { merge: true });
            });
            
            console.group('Subcollections added for all existing users!');
        } catch (error) {
            console.error('Error adding subcollections:', error);
        }
    };

  return (
    <div>
        <h6> User Subcollections </h6>
        <button
            onClick={addSubsollectionsForExistingUsers}
            className='bg-black text-white px-4 py-2 rounded'
        />
    </div>
  );
};

export default AdminUserSubcollections;