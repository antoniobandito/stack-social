import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import MediaRenderer from './MediaRenderer';
import { useAudioPlayer } from '../context/AudioPlayerContent';
import { auth, db, storage } from '../services/firebase';
import { addDoc, collection, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { Link } from 'react-router-dom';
import { IoIosHeart, IoIosHeartEmpty } from 'react-icons/io';
import { IoEllipsisHorizontal, IoSyncCircleOutline, IoSyncCircleSharp } from 'react-icons/io5';
import '../styles/global.css';

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
  fileURL?: string;
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
  originalFileName,  
  audioFileURL,
  audioFileName,
}) => {
  const user = auth.currentUser;
  const [hasLiked, setHasLiked] = useState<boolean>(false);
  const [hasReposted, setHasReposted] = useState<boolean>(false);
  const [mediaSource, setMediaSource] = useState<string | null>(null);;
  const [mediaType, setMediaType] = useState<string | null>(propMediaType);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [audioPlayer, setAudioPlayer] = useState<{
    isPlaying: boolean;
    url: string;
    title: string;
  } | null>(null);

  const { playAudio, currentAudio } = useAudioPlayer();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

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
      'png': 'image',
    };
    return typeMap[extension] || 'image';
  };

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

  // Add this useEffect to debug props
useEffect(() => {
  console.log('Post props:', {
    fileURL,
    originalFileName,
    audioFileURL,
    audioFileName,
    mediaType,
    mediaSource
  });
}, [fileURL, originalFileName, audioFileURL, audioFileName, mediaType, mediaSource]);

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

  const handlePlayAudio = (url: string) => {
      const title = audioFileName || originalFileName || 'Audio File';
      console.log('Post handlePlayAudio:', {
      url,
      audioFileName,
      originalFileName,
      finalTitle: title
    });
      playAudio(url, title);
  };

  return (
    <div>
      <div className={`grid-item ${mediaSource ? 'media-post' : 'text-post'} p-2 mt-3 rounded-md shadow-md relative post-container`}
      onClick={openModal}
    >
      <div className='flex justify-between items-center mb-2'>
        <div className="post-author font-bold p-1">
        <Link to={`/profile/${authorId}`} className='username-link'>
        {authorUsername || 'Unknown'}
        </Link>
      </div>
      
        <div className='relative dropdown-container'>
        <button
        onClick={(event) => {
          event.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen)
        }}
        className='p-1 rounded-full  focus:outline-none'
        >
          <IoEllipsisHorizontal />
        </button>

        {isDropdownOpen && user && user.uid === authorId && (
          <div className='absolute top-full right-0 w-40 rounded-md shadow-sm z-20'>
            <button 
            onClick={handleDelete}
            className='block w-full text-left px-4 py-2 hover:bg-gray-100'
          >
              delete 
            </button>
          </div>
          )}
        </div>
      </div>

      {content && <div className="post-content p-1 mb-3">{content}</div>}
      {mediaSource && mediaType && (
      <MediaRenderer
        mediaSource={mediaSource}
        mediaType={mediaType as 'image' | 'gif' | 'video' | 'audio'}
        fileURL={fileURL}
        originalFileName={originalFileName}
        onPlay={handlePlayAudio} // Trigger MiniAudioPlayer when audio plays
       />
      )}

      <div className='flex items-center'>
        <button 
          onClick={(event) => {
            event.stopPropagation(); // Prevent modal from opening
            handleLike();
          }}
          className={`py-1 px-2 rounded ${hasLiked ? 'text-black' : 'text-black'}`}
          >
          {hasLiked ? <IoIosHeart/> : <IoIosHeartEmpty/> } {likes.length}
        </button>

        <button 
          onClick={(event) => {
            event.stopPropagation(); 
            handleRepost();
          }} 
          className={`py-1 px-2 rounded ${hasReposted ? 'text-black' : 'text-black'}`}
          >
          {hasReposted ? <IoSyncCircleSharp/> : <IoSyncCircleOutline/> } {reposts.length}
        </button>
      </div>
    </div>

    <Modal 
    isOpen={isModalOpen} 
    onRequestClose={closeModal}
    style={{
      content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      maxWidth: '100%',
      padding: '2%',
      width: '50%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    overlay: {
      
      backgroundColor: 'rgba(0, 0, 0, 0.75)'
    },
  }}
  >
    <div className="modal-post-details">
      <div className="modal-author font-bold">
        <Link to={`/profile/${authorId}`}>{authorUsername || 'Unknown'}</Link>
      </div>
      <div className="modal-createdAt text-gray-500">{createdAt.toLocaleString()}</div>
      <div className="modal-content p-2">{content}</div>
      {mediaSource && mediaType && (
        <MediaRenderer
        mediaSource={mediaSource}
        mediaType={mediaType as 'image' | 'gif' | 'video' | 'audio'}
        fileURL={fileURL}
        originalFileName={originalFileName}
        onPlay={handlePlayAudio}
        /> 
      )}
    </div>
  </Modal>
  </div>
  );
};

export default Post;
