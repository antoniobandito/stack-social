import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import Modal from 'react-modal'
import './index.css'
import './styles/tailwind.css'
import './styles/global.css'
import { AuthProvider } from './context/AuthContext.tsx'
import { MessagingProvider } from './context/MessagingContext.tsx'


Modal.setAppElement('#root');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>  
    <AuthProvider>
    <App />
    </AuthProvider>
  </React.StrictMode>,
)
