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
          <h2 className="text-2xl font-bold mb-6 text-center">login</h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
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
            <button 
            type="submit" 
            disabled={isLoading}
            className={`
              w-full py-3 px-4 rounded text-lg font-medium transition-colors
              ${isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800'
              }
            `}
            >
              {isLoading ? 'logging in...' : 'login'}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-600">
            don't have an account? <a href="/signup" className="text-black font-medium hover:underline">sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;