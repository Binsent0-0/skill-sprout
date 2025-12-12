import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react'; 
import { supabase } from '../supabaseClient'; 

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); 

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(''); // This will store either "admin" or an email
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // --- MANUAL VALIDATION ---
    // If it's NOT the admin, check for @ and .com
    if (email.toLowerCase() !== 'admin') {
      const isEmailValid = email.includes('@') && email.includes('.com');
      
      if (!isEmailValid) {
        setLoading(false);
        setMessage({ 
          type: 'error', 
          text: 'Please enter a valid email address (must include @ and .com)' 
        });
        return; // Stop the function here
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email, // Supabase will accept "admin" because we created that user manually
          password,
        });
        if (error) throw error;
        onClose(); 
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Success! Check your email to confirm.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 w-full max-w-sm px-4">
        <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 shadow-lg blur-sm opacity-70 animate-pulse" />
        
        <div className="bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full relative border border-white/10">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>

          <h2 className="text-center text-3xl font-bold mb-8 text-white">
            {isLogin ? 'Welcome Back' : 'Join SkillSprout'}
          </h2>

          {message.text && (
            <div className={`mb-4 p-3 rounded text-sm text-center ${
              message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/50' : 'bg-green-500/10 text-green-500 border border-green-500/50'
            }`}>
              {message.text}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleAuth}>
            
            {!isLogin && (
              <input 
                className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all" 
                placeholder="Full Name" 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}

            {/* --- CHANGED TYPE TO TEXT --- */}
            <input 
              className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all" 
              placeholder="Email or Username" 
              type="text" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input 
              className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 transition-all" 
              placeholder="Password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button 
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-bold rounded-lg transition-all flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            <div className="flex flex-col items-center space-y-3 text-sm mt-4">
              <div className="text-gray-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMessage({ type: '', text: '' });
                  }} 
                  className="text-orange-500 font-bold hover:underline"
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AuthModal;