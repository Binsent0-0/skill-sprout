import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaStar, FaSpinner, FaUser } from 'react-icons/fa';
import ProfileModal from '../components/ProfileModal'; 

// Receive onContactTutor from App.jsx to bridge with the global ChatWidget
const Tutors = ({ onContactTutor }) => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MODAL STATE ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  useEffect(() => {
    const fetchFeaturedTutors = async () => {
      setLoading(true);
      
      // Fetch tutors who have at least one featured hobby
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          bio,
          avatar_url,
          role,
          hobbies!inner(featured)
        `)
        .eq('hobbies.featured', true)
        .eq('role', 'tutor');

      if (error) {
        console.error("Error fetching tutors:", error);
      } else {
        // Filter unique tutors
        const uniqueTutors = Array.from(new Map(data.map(item => [item.id, item])).values());
        setTutors(uniqueTutors);
      }
      setLoading(false);
    };

    fetchFeaturedTutors();
  }, []);

  // Helper to open profile modal
  const openTutorProfile = (id) => {
    setSelectedProfileId(id);
    setIsProfileOpen(true);
  };

  // Triggered when clicking the "Message" button on a card
  const handleDirectMessage = (tutor) => {
    if (onContactTutor) {
      onContactTutor(tutor); // Opens ChatWidget via App.jsx state
    }
  };

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-6 lg:px-8 font-sans">
      
      {/* 1. THE PROFILE MODAL 
          We pass onContactTutor to its onSendMessage prop 
      */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profileId={selectedProfileId} 
        onSendMessage={onContactTutor} 
      />

      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Featured <span className="text-orange-500">Mentors</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Connect with top-rated experts who are currently promoting their specialized skills.
        </p>
      </div>

      {/* TUTORS LIST */}
      <div className="max-w-5xl mx-auto space-y-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <FaSpinner className="animate-spin text-orange-500 text-4xl" />
          </div>
        ) : tutors.length > 0 ? (
          tutors.map((tutor) => (
            <div 
              key={tutor.id} 
              className="group bg-neutral-900 border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 hover:border-orange-500/30 transition-all duration-300 hover:bg-neutral-800/50 relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-600/10 blur-[50px] rounded-full pointer-events-none" />

              {/* Tutor Image */}
              <div className="relative flex-shrink-0 cursor-pointer" onClick={() => openTutorProfile(tutor.id)}>
                {tutor.avatar_url ? (
                  <img 
                    src={tutor.avatar_url} 
                    alt={tutor.full_name} 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-orange-500/20 group-hover:border-orange-500 transition-colors"
                  />
                ) : (
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-neutral-800 flex items-center justify-center text-orange-500 border-2 border-white/5">
                    <FaUser size={60} />
                  </div>
                )}
                <div className="absolute -bottom-3 -right-3 bg-orange-600 text-white p-2 rounded-xl shadow-lg">
                  <FaStar size={16} />
                </div>
              </div>

              {/* Tutor Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                  <h2 
                    onClick={() => openTutorProfile(tutor.id)}
                    className="text-2xl md:text-3xl font-bold text-white group-hover:text-orange-400 transition-colors cursor-pointer"
                  >
                    {tutor.full_name || 'Anonymous Tutor'}
                  </h2>
                  <span className="bg-orange-500/10 text-orange-500 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md border border-orange-500/20 w-fit mx-auto md:mx-0">
                    Verified Pro
                  </span>
                </div>
                
                <p className="text-gray-400 leading-relaxed mb-6 line-clamp-3 md:line-clamp-none italic font-medium">
                  "{tutor.bio || 'Expert mentor ready to help you grow.'}"
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <button 
                    onClick={() => openTutorProfile(tutor.id)}
                    className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all transform active:scale-95 shadow-lg"
                  >
                    View Profile
                  </button>

                  <button 
                    onClick={() => handleDirectMessage(tutor)}
                    className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all transform active:scale-95 flex items-center gap-2"
                  >
                    Message
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-white/10">
            <h3 className="text-xl font-bold text-white">No featured tutors found</h3>
            <p className="text-gray-500 mt-2">Check back later or browse all hobbies!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tutors;