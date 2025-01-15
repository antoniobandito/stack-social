import React, { useState } from 'react';
import { FaBars, FaBraille, FaCircleNotch, FaComment, FaCommentDollar } from 'react-icons/fa';
import CreatePostModal from './CreatePostModal';
import { IoMdAddCircle } from 'react-icons/io';

const FloatingActionButton: React.FC = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleOpenModal = () => setModalOpen(true);
  const handleCloseModal = () => setModalOpen(false);

  return (
    <>
      <div className='fixed bottom-20 right-7'>
        <button
        onClick={handleOpenModal}
        className='w-9 h-9 text-black flex items-center shadow-lg justify-center'
        >
          <IoMdAddCircle size={30} />
        </button>
        </div> 

        {isModalOpen && <CreatePostModal onClose={handleCloseModal} currentUser={null} />}
    </>
  )
}

export default FloatingActionButton