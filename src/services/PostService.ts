import { addDoc, collection, doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export const createPost = async (content: string) => {
  const user = auth.currentUser;

  if (user) {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const username = userDoc.exists() ? userDoc.data()?.username : 'Unknown';


    await addDoc(collection(db, 'posts'), {
      authorId: user.uid,
      authorUsername: username,
      content,
      createdAt: new Date(),
      likes: [],
      reposts: [],
    });
  }
};
