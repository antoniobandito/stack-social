import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        // Create the user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          username,
          email: user.email,
          createdAt: new Date(),
        });
      
      // Create subcollections for followers and following
      await setDoc(doc(db, `users/${user.uid}/followers/_init`), {}); // Empty doc to initialize the followers collection
      await setDoc(doc(db, `users/${user.uid}/following/_init`), {}); // Empty doc to initialize the following collection
      }
      

      // Reset the form
      setEmail('');
      setPassword('');
      setUsername('');
      setError('');
    } catch (err) {
      console.error('Error during signup:', err);
      setError('Failed to create an account');
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-#fafafa" 
      style={{ 
        margin: 0, 
        padding: '20px',
        display: 'flex !important',
        alignItems: 'center !important',
        justifyContent: 'center !important',
        minHeight: '100vh',
        width: '100vw',
        boxSizing: 'border-box'
      }}
    >
      <div className="w-full max-w-md" style={{ maxWidth: '400px', width: '100%' }}>

        <div className="bg-#fafafa rounded-lg shadow-lg p-8 w-full" style={{ width: '100%' }}>
          <h2 className="text-2xl font-bold mb-6 text-center">sign up</h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label htmlFor='username' className='block text-sm font-medium text-gray-700'>username</label>
              <input
              id='username'
              type='text'
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className='bg-inherit mt-1 block w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent'
              required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-inherit mt-1 block w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
            </div>
            <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">password</label>
              <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-inherit mt-1 block w-full p-3 border border-gray-300 rounded pr-10 focus:ring-2 focus:ring-black focus:border-transparent"
                required
              />
              <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800"
              >
                {showPassword ? "hide" : "show"}
              </button>
            </div>
            </div>
            <button type="submit" className="w-full py-3 px-4 bg-black text-white rounded hover:bg-gray-800 text-lg font-medium transition-colors">
              Sign Up
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600">
            Already have an account? <a href="/login" className="text-black font-medium hover:underline">login</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;