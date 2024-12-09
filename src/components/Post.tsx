import React, { useState, useEffect } from 'react';
import { addDoc, collection, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../services/firebase';
import '../styles/global.css';
import { Link } from 'react-router-dom';
import { FaMusic, FaPlay, FaPause } from 'react-icons/fa';
import AudioPlayer from './AudioPlayer';

interface PostProps {
  id: string;
  authorId: string;
  authorUsername: string;
  content: string;
  createdAt: Date;
  likes?: string[];
  reposts?: string[];
  mediaURL?: string;
  mediaType?: 'image' | 'gif' | 'video' | 'audio';
  fileURL: string;
  originalFileName?: string;
  audioFileURL?: string;
  audioFileName?: string;
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
  mediaType: propMediaType = 'image',
  fileURL,
  originalFileName  
}) => {
  const user = auth.currentUser;
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [hasReposted, setHasReposted] = useState<boolean>(false);
  const [mediaSource, setMediaSource] = useState<string | null>(null);;
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [mediaType, setMediaType] = useState<string | null>(propMediaType);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const extractFileExtension = (url: string): string | null => {
    const match = url.match(/\.([0-9a-z]+)(?=[?#]|$)/i);
    return match ? match[1].toLowerCase() : null;
  };

  const mapExtensionToMediaType = (extension: string): string => {
    const typeMap: { [key: string]: string } = {
      'gif': 'gif',
      'mp4': 'video',
      'webm': 'video',
      'mov': 'video',
      'mp3': 'audio',
      'wav': 'audio',
      'ogg': 'audio',
      'm4a': 'audio',
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image'
    }
    return typeMap[extension] || 'image';
  }
  // useEffect to load media source from Firebase
  useEffect(() => {
    const loadMediaURL = async () => {
      try {
        let url = mediaURL || fileURL;
        
        if (url) {
          const downloadURL = mediaURL
            ? await getDownloadURL(ref(storage, mediaURL))
            : url;
  
          if (downloadURL) {
            setMediaSource(downloadURL);

            const extension = extractFileExtension(downloadURL);
            const finalType = extension ? mapExtensionToMediaType(extension) : 'image';

            setMediaType(finalType);
          }
        }
      } catch (error) {
        console.error('Error loading media URL:', error);
      }
    };
    loadMediaURL();
  }, [mediaURL, fileURL]);
  
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

    const getAudioFileName = (url: string | undefined, fallbackFileName: string | undefined): string => {
      if (!url) return fallbackFileName || 'Audio File'; 
      
      // decode the URL to handle encoded characters
      const decodedUrl = decodeURIComponent(url);

      // Extract the filename part from the URL, ensuring we dont't include any metadata like UUIDs
      const fileNameWithExtension = decodedUrl.split('/').pop()?.split('?')[0];

      // Extract file name without extension (if necesssary)
      const fileName = fileNameWithExtension?.replace(/\.[^/.]+$/, '') || 'Audio File';

      return fileName;
    };

    const audioFileName = getAudioFileName(fileURL, originalFileName);

    switch (mediaType) {
      case 'gif':
        return <img src={mediaSource} alt="Uploaded GIF" className="w-full h-auto object-cover" />;
      
      case 'video':
        return (
          <video controls className="w-full h-auto object-cover">
            <source src={mediaSource} type="video/mp4" />
            <source src={mediaSource} type="video/webm" />
            <source src={mediaSource} type="video/ogg" />
            <source src={mediaSource} type="video/quicktime" />
            Your browser does not support the video tag.
          </video>
        );
      case 'audio':
        return (
         <AudioPlayer 
            audioSrc={mediaSource}
            audioTitle={audioFileName} 
            fileURL={mediaSource}        
          />
        );
      case 'image':
      default:
        return <img src={mediaSource} alt="Uploaded media" className="w-full h-auto object-cover" />;
    }
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

      {fileURL && mediaType === null && (
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
            className='bg-none text-black'
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default Post;