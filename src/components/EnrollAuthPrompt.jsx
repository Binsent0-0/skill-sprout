import React from 'react';
import { X, LogIn } from 'lucide-react';

const EnrollAuthPrompt = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const openAuth = () => {
    // Notify the app to open the global AuthModal
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
    onClose();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-30">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-neutral-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={18} />
        </button>

        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
            <LogIn size={28} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Create an account to enroll</h3>
          <p className="text-gray-400 mb-6">You need to sign in or create an account to complete enrollment and access your lessons.</p>

          <div className="flex gap-3">
            <button onClick={openAuth} className="flex-1 py-3 bg-orange-600 text-white rounded-2xl font-bold">Sign in / Sign up</button>
            <button onClick={onClose} className="flex-1 py-3 bg-white/5 text-white rounded-2xl font-bold">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnrollAuthPrompt;
