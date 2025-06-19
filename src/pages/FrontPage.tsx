import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';
import googleLogo from '../assets/Google__G__logo.svg';
import appleLogo from '../assets/Apple_logo_black.svg';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/home');
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleAppleSignup = () => {
    alert('Apple sign-in not yet implemented');
  };

  return (
    <div className="landing-split">
      <div className="landing-left">
        <div className='landing-logo'>
       stack
       </div>
      </div>

      <div className="landing-right">
        <h1 className="landing-heading">that feeling...</h1>
        <h2 className="landing-subheading">Join today.</h2>

        <button className="auth-btn google" onClick={handleGoogleSignup}>
          <img src={googleLogo} alt="Google" className="auth-icon" />
          Sign up with Google
        </button>

        <button className="auth-btn apple" onClick={handleAppleSignup}>
          <img src={appleLogo} alt="Apple" className="auth-icon" />
          Sign up with Apple
        </button>

        <div className="or-divider">
          <span>OR</span>
        </div>

        <button
          className="auth-btn create-account"
          onClick={() => navigate('/signup')}
        >
          Create account
        </button>

        <p className="terms-text">
          By signing up, you agree to the <span>Terms of Service</span> and <span>Privacy Policy</span>,<br></br> including <span>Cookie Use</span>.
        </p>

        <p className="existing-user">Already have an account?</p>
        <button className="auth-btn sign-in" onClick={() => navigate('/login')}>
          Sign in
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
