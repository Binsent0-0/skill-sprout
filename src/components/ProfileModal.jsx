// ProfileModal.jsx - Updated Version
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, User, Star, BookOpen, Loader2, MessageCircle, ChevronRight } from 'lucide-react';

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
          
          // Fetch hobbies created by this profile
          const { data: listings } = await supabase
            .from('hobbies')
            .select('*')
            .eq('created_by', profileId)
            .eq('status', 'approved'); // Only show approved courses
          
          setTutorListings(listings || []);
        } catch (err) { 
          console.error(err); 
        } finally { 
          setLoading(false); 
        }
      };
      fetchProfileData();
    }
  }, [isOpen, profileId]);

  // Helper function to render stars based on numeric rating
  const renderStars = (rating = 0) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={16} 
            className={i < Math.floor(rating) ? "text-orange-500 fill-orange-500" : "text-neutral-700"} 
          />
        ))}
        <span className="text-white font-bold ml-2 text-sm">{Number(rating).toFixed(1)}</span>
      </div>
    );
  };

  const handleMessageClick = () => {
    if (onSendMessage && targetProfile) {
      onSendMessage(targetProfile);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-neutral-900 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl p-8 overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white z-10"><X size={24} /></button>

        {loading ? (
          <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-orange-500" size={32} /></div>
        ) : (
          <div className="overflow-y-auto custom-scrollbar pr-2">
            {/* Profile Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-24 h-24 rounded-full bg-neutral-800 border-2 border-orange-500 flex items-center justify-center text-orange-500 mb-4 overflow-hidden">
                {targetProfile?.avatar_url ? <img src={targetProfile.avatar_url} className="w-full h-full object-cover" /> : <User size={40} />}
              </div>
              <h2 className="text-2xl font-bold text-white">{targetProfile?.full_name}</h2>
              <span className="text-[10px] uppercase font-black text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full mt-2 border border-orange-500/20">
                {targetProfile?.role}
              </span>
            </div>

            {/* About Section */}
            <div className="mb-6">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-2 tracking-widest">About</h3>
              <p className="text-gray-300 text-sm italic leading-relaxed">"{targetProfile?.bio || 'No bio provided.'}"</p>
            </div>

            {/* Rating Section */}
            <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-3 tracking-widest">Instructor Rating</h3>
              {renderStars(targetProfile?.rating)}
            </div>

            {/* Listings Section */}
            {tutorListings.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] font-bold text-gray-500 uppercase mb-4 tracking-widest">Active Listings ({tutorListings.length})</h3>
                <div className="space-y-3">
                  {tutorListings.map((listing) => (
                    <div key={listing.id} className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-orange-500/30 transition-all cursor-pointer">
                      <img src={listing.image_url} className="w-12 h-12 rounded-lg object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-bold text-sm truncate">{listing.title}</h4>
                        <p className="text-orange-500 font-black text-xs">₱{listing.price?.toLocaleString()}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-orange-500 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Button */}
            {currentUserId !== profileId && (
              <button 
                onClick={handleMessageClick}
                className="w-full py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-all transform active:scale-95 flex items-center justify-center gap-2 shadow-lg sticky bottom-0"
              >
                <MessageCircle size={20} /> Send Message
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;