// ProfileModal.jsx - Final Version
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, User, Star, BookOpen, Loader2, MessageCircle } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, profileId, onSendMessage }) => {
  const [loading, setLoading] = useState(true);
  const [targetProfile, setTargetProfile] = useState(null);
  const [tutorListings, setTutorListings] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id));

    if (isOpen && profileId) {
      const fetchProfileData = async () => {
        setLoading(true);
        try {
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single();
          setTargetProfile(profile);
          if (profile?.role === 'tutor') {
            const { data: listings } = await supabase.from('hobbies').select('*').eq('created_by', profileId).eq('status', 'approved');
            setTutorListings(listings || []);
          }
        } catch (err) { console.error(err); } finally { setLoading(false); }
      };
      fetchProfileData();
    }
  }, [isOpen, profileId]);

  const handleMessageClick = () => {
    if (onSendMessage && targetProfile) {
      onSendMessage(targetProfile); // Pushes data to App.jsx -> ChatWidget
      onClose(); // Closes modal so you can see the chat
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-neutral-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>

        {loading ? (
          <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
        ) : (
          <>
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-orange-500 flex items-center justify-center text-orange-500 mb-4 overflow-hidden">
                {targetProfile?.avatar_url ? <img src={targetProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={40} />}
              </div>
              <h2 className="text-2xl font-bold text-white">{targetProfile?.full_name}</h2>
              <span className="text-[10px] uppercase font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full mt-2">{targetProfile?.role}</span>
            </div>

            <div className="mb-8">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2">About</h3>
              <p className="text-gray-300 text-sm italic">"{targetProfile?.bio || 'No bio provided.'}"</p>
            </div>

            {currentUserId !== profileId && (
              <button 
                onClick={handleMessageClick}
                className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageCircle size={20} /> Send Message
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;