import React, { useEffect, useState } from 'react';
import Masonry from 'react-masonry-css';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';
import FloatingActionButton from '../components/FloatingActionButton';
import Post from '../components/Post';
import '../styles/global.css';

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

const breakpointColumnsObj = {
  default: 4,
  1100: 3,
  700: 2,
  500: 1,
};

const Home: React.FC = () => {
  const [posts, setPosts] = useState<PostData[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const postsData: PostData[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt.toDate(), // Convert Firestore timestamp to JS Date
          };
        }) as PostData[];
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="main-wrapper">
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="grid-container"
        columnClassName="grid-item"
      >
        {posts.filter(post => post.content || post.mediaURL || post.fileURL).map(post => (
          <div key={post.id} className="grid-item">
            <Post 
              id={post.id}
              authorId={post.authorId}
              authorUsername={post.authorUsername}
              content={post.content}
              createdAt={post.createdAt}
              likes={post.likes}
              reposts={post.reposts}
              mediaURL={post.mediaURL}
              fileURL={post.fileURL}
            />
          </div>
        ))}
      </Masonry>
      <FloatingActionButton />
    </div>
  );
};

export default Home;
