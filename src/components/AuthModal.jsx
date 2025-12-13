import React, { useState, useEffect } from 'react';
import { X, Loader2, Mail, RefreshCw, AlertCircle } from 'lucide-react'; 
import { supabase } from '../supabaseClient'; 
import { useNavigate } from 'react-router-dom';

const AuthModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); 
  
  // New States for Confirmation & Timer
  const [isConfirming, setIsConfirming] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Timer logic for resending email
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const clearForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setMessage({ type: '', text: '' });
    setIsConfirming(false);
  };

  const handleToggleMode = () => {
    setIsLogin(!isLogin);
    clearForm();
  };

  const handleClose = () => {
    clearForm();
    onClose();
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (email.toLowerCase() !== 'admin') {
      const isEmailValid = email.includes('@') && email.includes('.com');
      if (!isEmailValid) {
        setLoading(false);
        setPassword('');
        setMessage({ type: 'error', text: 'Please enter a valid email address (@ and .com)' });
        return;
      }
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        handleClose();
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) throw error;
        
        // Switch to confirmation screen
        setIsConfirming(true);
        setResendTimer(60); 
        setPassword('');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendTimer > 0) return;
    
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Verification email resent!' });
      setResendTimer(60);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={handleClose} />

      <div className="relative z-10 w-full max-w-sm">
        <div className="absolute -top-1 -left-1 -right-1 -bottom-1 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-red-500 shadow-lg blur-sm opacity-70 animate-pulse" />
        
        <div className="bg-neutral-900 p-8 rounded-2xl shadow-2xl w-full relative border border-white/10">
          <button onClick={handleClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>

          {/* --- CONFIRMATION VIEW --- */}
          {isConfirming ? (
            <div className="text-center animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
                <Mail size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">Confirm your Email</h2>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                We've sent a link to <span className="text-white font-semibold">{email}</span>.
                Please check your <span className="text-orange-400">Inbox, Spam, and Junk</span> folders to verify your account.
              </p>

              {message.text && (
                <div className={`mb-4 p-2 rounded text-xs ${message.type === 'error' ? 'text-red-500 bg-red-500/10' : 'text-green-500 bg-green-500/10'}`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                <button 
                  onClick={handleResendEmail}
                  disabled={resendTimer > 0 || loading}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-white/5 hover:bg-white/10 p-3 rounded-lg border border-white/10 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                  {resendTimer > 0 ? `Resend email in ${resendTimer}s` : 'Resend verification email'}
                </button>
                
                <button 
                  onClick={handleToggleMode}
                  className="text-gray-500 hover:text-orange-500 text-xs font-semibold transition-colors"
                >
                  Entered the wrong email? Back to Sign up
                </button>
              </div>
            </div>
          ) : (
            /* --- LOGIN / SIGNUP FORM VIEW --- */
            <>
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
                    className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white focus:border-orange-500 outline-none transition-all" 
                    placeholder="Full Name" 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                )}

                <input 
                  className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white focus:border-orange-500 outline-none transition-all" 
                  placeholder="Email or Username" 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <input 
                  className="w-full h-12 bg-neutral-800 border border-white/10 px-4 rounded-lg text-white focus:border-orange-500 outline-none transition-all" 
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
                      onClick={handleToggleMode} 
                      className="text-orange-500 font-bold hover:underline"
                    >
                      {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;