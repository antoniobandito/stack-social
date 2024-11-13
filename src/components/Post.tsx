import React, { useState, useEffect } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../services/firebase';
import '../styles/global.css';
import { Link } from 'react-router-dom';

interface PostProps {
  id: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: Date;
  likes?: string[];
  reposts?: string[];
  mediaURL?: string;
  fileURL?: string;
}

const Post: React.FC<PostProps> = ({ 
  id, 
  authorId, 
  authorUsername, 
  content, 
  createdAt, 
  likes = [], 
  reposts = [], 
  mediaURL, 
  fileURL 
}) => {
  const user = auth.currentUser;
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [hasReposted, setHasReposted] = useState<boolean>(false);
  const [mediaSource, setMediaSource] = useState<string | null>(null);

  // Fetch downloadable URL from Firebase Storage
  const fetchMediaURL = async (path: string): Promise<string | null> => {
    try {
    const mediaRef = ref(storage, path);
    return await getDownloadURL(mediaRef);
  } catch (error) {
    console.error("Error fetching media URL:", error);
    return null;
  }
};

  // useEffect to load media source from Firebase
  useEffect(() => {
    const loadMediaURL = async () => {
      if (mediaURL) {
        const downloadURL = await fetchMediaURL(mediaURL);
        if (downloadURL) setMediaSource(downloadURL);
      }
    };
    loadMediaURL();
  }, [mediaURL]);
  
  // useEffect to load media source from Firebase
  useEffect(() => {
    if (user) {
      setHasLiked(likes.includes(user.email || ''));
      setHasReposted(reposts.includes(user.email || ''));
    }
  }, [likes, reposts, user]);

  const handleLike = async () => {
    if (!user) return;

    const postRef = doc(db, 'posts', id);
    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: arrayRemove(user.email),
        });
        setHasLiked(false);
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(user.email),
        });
        setHasLiked(true);
      }
    } catch (error) {
      console.error("Error updating likes:", error);
    }
  };

  const handleRepost = async () => {
    if (!user || hasReposted) return; 

    const postRef = doc(db, 'posts', id);
    try {
      await updateDoc(postRef, { reposts: arrayUnion(user.email || '') });
      await addDoc(collection(db, 'posts'), {
        content: `∞ ${authorUsername} reposted: ${content}`,
        authorId: user.uid,
        authorUsername: user.displayName || 'Unknown',
        createdAt: new Date(),
        likes: [],
        reposts: [],
      });
      setHasReposted(true);
    } catch (error) {
      console.error("Error handling repost:", error);
    }
  };

  const handleDelete = async () => {
    if (user && user.uid === authorId) {
      try {
        await deleteDoc(doc(db, 'posts', id));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  const renderMedia = () => {
    if (!mediaSource) return null;

    const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(mediaSource);
    const isGif = /\.gif$/i.test(mediaSource);

    if (isGif) {
      return <img src={mediaSource} alt="Uploaded GIF" className="w-full h-auto object-cover" />;
    } else if (isVideo) {
      return (
        <video controls autoPlay loop className="w-full h-auto object-cover">
          <source src={mediaSource} type="video/mp4" />
          <source src={mediaSource} type="video/webm" />
          <source src={mediaSource} type="video/ogg" />
          <source src={mediaSource} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      );
    }

    return <img src={mediaSource} alt="Uploaded media" className="w-full h-auto object-cover" />;
  };

  return (
    <div className={`grid-item ${mediaSource ? 'media-post' : 'text-post'} p-2 mt-3 rounded-md shadow-md`}>
      <div className="post-author font-bold p-1">
        <Link to={`/profile/${authorId}`} className='username-link'>
        {authorUsername || 'Unknown'}
        </Link>
      </div>
      {content && <div className="post-content p-1 mb-3">{content}</div>}

      {renderMedia()}

      {fileURL && (
        <div className="mb-3">
          <a 
            href={fileURL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-black">
            View attached file
          </a>
        </div>
      )}

      <div className='flex items-center'>
        <button 
          onClick={handleLike}
          className={`py-1 px-2 rounded ${hasLiked ? 'text-black' : 'text-black'}`}
        >
          {hasLiked ? '♡' : '♡'} {likes.length}
        </button>

        <button 
          onClick={handleRepost} 
          className={`py-1 px-2 rounded ${hasReposted ? 'text-black' : 'text-black'}`}
        >
          {hasReposted ? '∞︎︎' : '∞︎︎'} {reposts.length}
        </button>

        {user && user.uid === authorId && (
          <button 
            onClick={handleDelete}
            className='bg-white text-black'
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Post;
