import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error: any) {
      // More specific error handling 
      switch (error.code) {
        case 'auth/invalid-credential':
          setError('Invalid email or password');
          break;
        case 'auth/user-not-found':
          setError('Incorrect password');
          break;
        default:
          setError('Login failed. Please try again.');
      }
      console.error('Error logging in:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
    <div className="bg-white min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-8 rounded shadow-lg mx-auto">
        <div className="p-8 rounded-lg text-center">
        <h2 className="text-2xl font-bold mb-6 bg-">login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-left">
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
          <div className="text-left">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">password</label>
            <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-2 border rounded pr-10"
              required
            />
            <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:border-none"
            >
              {showPassword ? "hide" : "show"}
            </button>
          </div>
          </div>
          <button 
          type="submit" 
          disabled={isLoading}
          className={`
            w-full py-2 px-4 bg-black text-white rounded hover:bg-slate-500 hover:border-white
            ${isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-black text-white hover:bg-slate-500'
            }
          `}
          >
            {isLoading ? 'logging in...' : 'login'}
          </button>
        </form>
        <p className="mt-4 text-gray-600">
          don't have an account? <a href="/signup" className="text-black">sign up</a>
        </p>
      </div>
    </div>
  </div>
  );
};

export default Login;
