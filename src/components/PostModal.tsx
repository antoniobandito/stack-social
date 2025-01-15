import React from 'react';
import '../styles/global.css';
import '../styles/PostModal.css';
import Modal from 'react-modal';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import { format } from 'date-fns';

interface PostModalProps {
    isOpen: boolean;
    onClose: () => void;
    authorUsername: string;
    content: string;
    createdAt: Date;
    hashtags?: string[];
    comments?: { id: string; authorUsername: string; content: string }[];
}

const PostModal: React.FC<PostModalProps> = ({
    isOpen,
    onClose,
    authorUsername,
    content,
    createdAt,
    hashtags = [],
    comments = [],
  }) => {
    const handleHashtagClick = (tag: string) => {
      console.log(`Clicked hashtag: ${tag}`);
      // Navigate to a hastag page or perform a search 
    };

    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        contentLabel="Post Modal"
        className="post-modal"
        overlayClassName="post-modal-overlay"
      >
        <button onClick={onClose} className="close-modal-button">
          <IoIosCloseCircleOutline size={24} />
        </button>
        <div className="post-modal-content"
             onClick={(e) => e.stopPropagation()}
        >
          
          {/* Post Content */}
          <div className="post-modal-details">
            <p><strong>{authorUsername}</strong></p>
            <p>{content}</p>
          </div>
  
          {/* Timestamp */}
          <div className="post-modal-timestamp">
            <small>Posted on: {format(createdAt, 'PPpp')}</small>
          </div>
  
          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="post-modal-hashtags">
              <p>Hashtags:</p>
              <ul>
                {hashtags.map((tag, index) => (
                  <li 
                  key={index} 
                  className="hashtag"
                  onClick={() => handleHashtagClick(tag)}
                  >
                    #{tag}
                  </li>
                ))}
              </ul>
            </div>
          )}
  
          {/* Comments Section */}
          <div className="post-modal-comments">
            <p>Comments:</p>
            {comments.length > 0 ? (
              <ul>
                {comments.map((comment) => (
                  <li key={comment.id} className="comment">
                    <strong>{comment.authorUsername}</strong>: {comment.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No comments yet. Be the first to comment!</p>
            )}
          </div>
        </div>
      </Modal>
    );
  };
  
  export default PostModal;