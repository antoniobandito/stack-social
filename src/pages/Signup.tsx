import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        username,
        email: user.email,
      });

      setEmail('');
      setPassword('');
      setUsername('');
      setError('');
    } catch (err) {
      console.log()
      setError('Failed to create an account');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full bg-white p-8 rounded shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">sign up</h2>
        {error && <p className="text-red-500 text-center">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor='username' className='block text-sm font-medium text-gray-700'>username</label>
            <input
            id='username'
            type='text'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className='mt-1 block w-full p-2 border rounded'
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
              className="mt-1 block w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border rounded"
              required
            />
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-black text-white rounded hover:bg-slate-400">
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600">
          Already have an account? <a href="/login" className="text-black">login</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
