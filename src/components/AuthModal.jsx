import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react'; // Make sure you have: npm install lucide-react
import { supabase } from '../supabaseClient'; // Ensure path is correct

const AuthModal = ({ isOpen, onClose }) => {
  // 1. Logic State
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); // Store success/error messages

  // 2. Input State (This captures what the user types)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  // 3. The Function that talks to Supabase
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      if (isLogin) {
        // --- LOG IN ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        onClose(); // Close modal on success
      } else {
        // --- SIGN UP ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName, // This triggers the SQL we wrote earlier
            },
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
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* MODAL CONTENT */}
      <div className="relative z-10 w-full max-w-sm px-4">
        
        {/* Glowing Border */}
        <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 shadow-lg blur-sm opacity-70 animate-pulse" />
        
        {/* Main Card */}
        <div className="bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full relative border border-white/10">
          
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-center text-3xl font-bold mb-8 text-white">
            {isLogin ? 'Welcome Back' : 'Join SkillSprout'}
          </h2>

          {/* Error/Success Message Banner */}
          {message.text && (
            <div className={`mb-4 p-3 rounded text-sm text-center ${
              message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/50' : 'bg-green-500/10 text-green-500 border border-green-500/50'
            }`}>
              {message.text}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleAuth}>
            
            {/* Name Field (Register Only) */}
            {!isLogin && (
              <div className="space-y-1">
                <input 
                  className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
                  placeholder="Full Name" 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <input 
              className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
              placeholder="Email" 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {/* Password Field */}
            <input 
              className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all" 
              placeholder="Password" 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {/* Submit Button */}
            <button 
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-bold rounded-lg shadow-lg shadow-orange-900/20 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
            >
              {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
            </button>

            {/* Footer Links */}
            <div className="flex flex-col items-center space-y-3 text-sm mt-4">
              {isLogin && (
                <a className="text-gray-400 hover:text-orange-400 transition-colors" href="#">
                  Forgot Password?
                </a>
              )}
              
              <div className="text-gray-500">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button 
                  type="button" // Important so it doesn't submit the form
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