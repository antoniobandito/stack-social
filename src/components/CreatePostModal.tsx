import React, { useRef, useState } from 'react';
import { auth, db, storage } from '../services/firebase';
import { collection, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaImage, FaFile, FaMusic } from 'react-icons/fa';
import {ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import '../styles/global.css';

interface CreatePostModalProps {
    onClose: () => void;
    currentUser: { email: string; displayName: string } | null;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose }) => {
    const [content, setContent] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState<boolean>(false);
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'gif' | 'video' | 'audio' | null>(null);
    const [originalFileName, setOriginalFileName] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const { currentUser } = useAuth();

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const fileURL = URL.createObjectURL(file);

            // Determine media type
            if (file.type === 'image/gif') {
                setMediaType('gif');
            } else if (file.type.startsWith('image/')) {
                setMediaType('image');
            } else if (file.type.startsWith('video/')) {
                setMediaType('video');
            } else if (file.type.startsWith('audio/')) {
                setMediaType('audio');
                setMediaPreview(URL.createObjectURL(file));
            }

            setMediaFile(file);
            setMediaPreview(fileURL);
            setOriginalFileName(file.name);
            setError('');
        }
    };

    const uploadFileToStorage = async (file: File, folder: string): Promise<string> => {
        const fileRef = ref(storage, `${folder}${uuidv4()}-${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
    };

    const handleCreatePost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !mediaFile) {
            setError('Post cannot be empty.');
            return;
        }
        
        setLoading(true);

        try {
            let mediaURL = '';
            let originalFileName = '';

            // Determine the appropriate folder based on media type
            if (mediaFile) {
            originalFileName = mediaFile.name;
            console.log('Creating post with file:', {
                mediaURL,
                originalFileName,
                mediaType
            });
            const storageFolderMap: Record<string, string> = {
                image: 'images/',
                gif: 'gifs/',
                video: 'videos/',
                audio: 'audio/',
            };
            const folder = storageFolderMap[mediaType!] || 'media/';
            mediaURL = await uploadFileToStorage(mediaFile, folder);
            

            //Capture the original filename
            originalFileName = mediaFile.name;
        }

            // Retrieve the username from Firestore 
            let authorUsername = 'Unknown';
            if (currentUser) {
                const userRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists()) {
                    authorUsername = userDoc.data().username || 'Unknown';
                }
            }

            // Create post in Firestore
            await addDoc(collection(db, 'posts'), {
                content,
                authorId: currentUser?.uid,
                authorUsername,
                createdAt: Timestamp.now(),
                mediaURL: mediaURL || '',
                originalFileName: originalFileName,
                mediaType: mediaType || 'image',
                likes:[],
                reposts: [],
            });

            setContent('');
            setMediaFile(null);
            setMediaPreview(null);
            setMediaType(null);
            setOriginalFileName(null);
            setError('');
            onClose();
        } catch (err) {
            console.error("Failed to create post:", err);
            setError("Failed to create post");
        }   finally {
            setLoading(false);
        }
    };

    const renderMediaPreview = () => {
        if (!mediaPreview) return null;

        switch (mediaType) {
            case 'image':
            case 'gif':
                return (
                <div className='media-preview-container'>
                    <img 
                    src={mediaPreview} 
                    alt='Selected media' 
                    className='media-preview' 
                    />
                </div>
            );
            case 'video':
                return (
                    <div className='media-preview-container'>
                    <video
                        ref={videoRef}
                        src={mediaPreview} 
                        controls 
                        className='media-preview max-h-60 w-full'
                        onLoadedMetadata={() => {
                        if (videoRef.current) {
                            videoRef.current.volume = 0.1;
                        }
                    }}
                    >
                        Your browser does not support the video tag.
                    </video>
                </div>
                );
            case 'audio':
                return (
                    <div className="media-preview-container flex items-center">
                        <FaMusic className="mr-2" />
                        <audio 
                            ref={audioRef}
                            src={mediaPreview}
                            controls
                            className='audio-preview w-full'
                            onLoadedMetadata={() => {
                                if (audioRef.current) {
                                    audioRef.current.volume = 0.5;
                                }
                            }}
                        >
                            Your browser does not support the audio tag.
                        </audio>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="max-w-md w-full bg-white p-8 rounded shadow-md">
            <h2 className="text-2xl font-bold bg-inherit mb-6 text-center">Create Post</h2>
            {error && <p className="text-red-500 text-center">{error}</p>}
            <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="relative">
                    <label htmlFor="content" className="block text-sm font-medium text-black"></label>
                    <textarea
                        id="content"
                        value={content}
                        onChange={handleContentChange}
                        placeholder="Share something..."
                        className="mt-1 block w-full p-2 border rounded"
                    />
                    {renderMediaPreview()}
                    <div className="absolute bottom-2 right-2 flex space-x-2 text-black">
                        <label htmlFor="upload-media" className="cursor-pointer">
                            <FaImage size={20} />
                            <input
                                id="upload-media"
                                type="file"
                                accept="image/*,video/*,audio/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                        <label htmlFor="upload-file" className="cursor-pointer">
                            <FaFile size={20} />
                            <input
                                id="upload-file"
                                type="file"
                                accept="*/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-600">
                    Post
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700 mt-2"
                >
                    Cancel
                </button>
            </form>
        </div>
    </div>
);
};

export default CreatePostModal;