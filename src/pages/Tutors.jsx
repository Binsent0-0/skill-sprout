import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { FaStar, FaSpinner, FaUser, FaChalkboardTeacher } from 'react-icons/fa';
import ProfileModal from '../components/ProfileModal'; 

const Tutors = ({ onContactTutor }) => {
  const [featuredTutors, setFeaturedTutors] = useState([]);
  const [otherTutors, setOtherTutors] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MODAL STATE ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // 1. Fetch ALL tutors and their hobbies to check 'featured' status
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          hobbies (
            featured
          )
        `)
        .ilike('role', 'tutor'); // Get all tutors (case-insensitive)

      if (error) {
        console.error("Error fetching tutors:", error);
      } else {
        // 2. Separate them into two groups
        const featured = [];
        const others = [];

        data.forEach(tutor => {
          // Check if this tutor has AT LEAST one featured hobby
          const hasFeaturedHobby = tutor.hobbies && tutor.hobbies.some(h => h.featured === true);
          
          if (hasFeaturedHobby) {
            featured.push(tutor);
          } else {
            others.push(tutor);
          }
        });

        setFeaturedTutors(featured);
        setOtherTutors(others);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const openTutorProfile = (id) => {
    setSelectedProfileId(id);
    setIsProfileOpen(true);
  };

  const handleDirectMessage = (tutor) => {
    if (onContactTutor) onContactTutor(tutor);
  };

  // Reusable Card Component to keep code clean
  const TutorCard = ({ tutor, isFeatured }) => (
    <div className={`group relative bg-neutral-900 border rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 transition-all duration-300 overflow-hidden ${isFeatured ? 'border-orange-500/30 hover:bg-neutral-800/80 shadow-orange-900/20 shadow-lg' : 'border-white/5 hover:bg-neutral-800/50 hover:border-white/10'}`}>
      
      {/* Glow effect only for featured tutors */}
      {isFeatured && <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-600/10 blur-[50px] rounded-full pointer-events-none" />}

      {/* Tutor Image */}
      <div className="relative flex-shrink-0 cursor-pointer" onClick={() => openTutorProfile(tutor.id)}>
        {tutor.avatar_url ? (
          <img 
            src={tutor.avatar_url} 
            alt={tutor.full_name} 
            className={`w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 transition-colors ${isFeatured ? 'border-orange-500/50 group-hover:border-orange-500' : 'border-white/10 group-hover:border-white/30'}`}
          />
        ) : (
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-neutral-800 flex items-center justify-center text-gray-500 border-2 border-white/5">
            <FaUser size={50} />
          </div>
        )}
        
        {/* Featured Badge */}
        {isFeatured && (
          <div className="absolute -bottom-3 -right-3 bg-orange-600 text-white p-2 rounded-xl shadow-lg border border-orange-400">
            <FaStar size={14} />
          </div>
        )}
      </div>

      {/* Tutor Info */}
      <div className="flex-1 text-center md:text-left z-10">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
          <h2 onClick={() => openTutorProfile(tutor.id)} className={`text-2xl font-bold cursor-pointer transition-colors ${isFeatured ? 'text-white group-hover:text-orange-400' : 'text-gray-200 group-hover:text-white'}`}>
            {tutor.full_name || 'Anonymous Tutor'}
          </h2>
          {isFeatured && <span className="bg-orange-500/10 text-orange-500 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md border border-orange-500/20 w-fit mx-auto md:mx-0">Featured</span>}
        </div>
        
        <p className="text-gray-400 leading-relaxed mb-6 line-clamp-3 italic font-medium">
          "{tutor.bio || 'Expert mentor ready to help you grow.'}"
        </p>

        <div className="flex flex-wrap justify-center md:justify-start gap-3">
          <button onClick={() => openTutorProfile(tutor.id)} className={`px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 ${isFeatured ? 'bg-white text-black hover:bg-orange-500 hover:text-white' : 'bg-neutral-800 text-gray-300 hover:bg-white hover:text-black'}`}>
            View Profile
          </button>
          <button onClick={() => handleDirectMessage(tutor)} className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-all transform active:scale-95">
            Message
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-6 lg:px-8 font-sans">
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} profileId={selectedProfileId} onSendMessage={onContactTutor} />

      {/* HEADER */}
      <div className="max-w-5xl mx-auto mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
          Find Your <span className="text-orange-500">Mentor</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Connect with expert tutors ready to help you grow.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-orange-500 text-4xl" /></div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* SECTION 1: FEATURED TUTORS */}
          {featuredTutors.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-3 mb-6">
                <FaStar className="text-orange-500" />
                <h3 className="text-xl font-bold text-white uppercase tracking-widest">Featured Mentors</h3>
              </div>
              {featuredTutors.map(tutor => <TutorCard key={tutor.id} tutor={tutor} isFeatured={true} />)}
            </div>
          )}

          {/* SECTION 2: OTHER TUTORS */}
          {otherTutors.length > 0 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-1000">
               {/* Only show separator/header if we also have featured tutors above */}
               {featuredTutors.length > 0 && <div className="border-t border-white/10 my-10" />}
               
               <div className="flex items-center gap-3 mb-6">
                <FaChalkboardTeacher className="text-gray-500" />
                <h3 className="text-xl font-bold text-gray-400 uppercase tracking-widest">Other Tutors</h3>
              </div>
              {otherTutors.map(tutor => <TutorCard key={tutor.id} tutor={tutor} isFeatured={false} />)}
            </div>
          )}

          {featuredTutors.length === 0 && otherTutors.length === 0 && (
            <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-white/10">
              <h3 className="text-xl font-bold text-white">No tutors found</h3>
              <p className="text-gray-500 mt-2">Check back later!</p>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default Tutors;