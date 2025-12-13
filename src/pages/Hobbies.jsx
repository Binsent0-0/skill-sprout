import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import { FaStar, FaSearch, FaUser, FaSpinner } from 'react-icons/fa'; 
import HobbyModal from '../components/HobbyModal'; 
import ProfileModal from '../components/ProfileModal'; 

const Hobbies = ({ onContactTutor }) => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [hobbiesData, setHobbiesData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isHobbyOpen, setIsHobbyOpen] = useState(false);
  const [selectedHobby, setSelectedHobby] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);

  useEffect(() => {
    if (categoryFromUrl) setActiveCategory(categoryFromUrl);
  }, [categoryFromUrl]);

  useEffect(() => {
    const fetchHobbies = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('hobbies')
        .select(`*, profiles:created_by (id, full_name, avatar_url, bio, role)`) 
        .eq('status', 'approved')
        .order('featured', { ascending: false }) 
        .order('created_at', { ascending: false }); 

      setHobbiesData(data || []);
      setLoading(false);
    };
    fetchHobbies();
  }, []); 

  const categories = ['All', 'Gaming', 'Coding', 'Music', 'Cooking', 'Languages', 'Design', 'Business', 'Fitness'];

  // --- UPDATED SEARCH LOGIC ---
  const filteredHobbies = hobbiesData.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Check if word exists in Title
    const titleMatch = item.title.toLowerCase().includes(searchLower);
    
    // Check if word exists in Hobby Description
    const descriptionMatch = (item.description || "").toLowerCase().includes(searchLower);
    
    // Check if word exists in the Tutor's Bio (from the joined profiles table)
    const bioMatch = (item.profiles?.bio || "").toLowerCase().includes(searchLower);

    const matchesSearch = titleMatch || descriptionMatch || bioMatch;

    return matchesCategory && matchesSearch;
  });

  const openHobby = (hobby) => {
    setSelectedHobby(hobby);
    setIsHobbyOpen(true);
  };

  const openProfile = (id) => {
    setIsHobbyOpen(false); 
    setSelectedProfileId(id);
    setIsProfileOpen(true);
  };

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-6 lg:px-8">
      
      <HobbyModal 
        isOpen={isHobbyOpen} 
        onClose={() => setIsHobbyOpen(false)} 
        hobby={selectedHobby} 
        onOpenProfile={openProfile}
      />
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        profileId={selectedProfileId}
        onSendMessage={onContactTutor}
      />

      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4">Explore <span className="text-orange-500">Hobbies</span></h1>
        <p className="text-gray-400 max-w-2xl">Find mentors by searching for keywords in titles, descriptions, or tutor bios.</p>
      </div>

      <div className="max-w-7xl mx-auto mb-12 space-y-6">
        <div className="relative max-w-2xl">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search titles, descriptions, or bios..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:border-orange-500 transition-colors outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                activeCategory === cat 
                  ? 'bg-orange-600 border-orange-600 text-white shadow-lg shadow-orange-900/50' 
                  : 'bg-neutral-900 border-white/10 text-gray-400 hover:border-orange-500/50 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-orange-500 text-4xl" /></div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {filteredHobbies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHobbies.map((hobby) => (
                <div 
                  key={hobby.id} 
                  onClick={() => openHobby(hobby)} 
                  className={`group bg-neutral-900 border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col cursor-pointer ${hobby.featured ? 'border-yellow-500/30 shadow-lg' : 'border-white/5 hover:border-orange-500/50'}`}
                >
                  <div className="h-48 bg-neutral-800 relative overflow-hidden">
                    <img src={hobby.image_url} alt={hobby.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                      <FaStar className={hobby.featured ? "text-yellow-400 text-sm" : "text-gray-500/50 text-sm"} />
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest border border-orange-500/20 bg-orange-500/10 px-2 py-1 rounded">{hobby.category}</span>
                      <span className="text-white font-bold text-sm">₱{hobby.price?.toLocaleString()}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-1">{hobby.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{hobby.description}</p>
                    
                    <div 
                      onClick={(e) => { e.stopPropagation(); openProfile(hobby.created_by); }} 
                      className="flex items-center space-x-2 text-gray-500 text-sm mb-6 mt-auto hover:text-orange-500 transition-colors"
                    >
                      <FaUser className="text-xs" />
                      <span>By {hobby.profiles?.full_name || 'Tutor'}</span>
                    </div>
                    <button className="w-full py-3 rounded-lg font-semibold bg-white text-black hover:bg-orange-500 hover:text-white transition-all">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-dashed border-white/10">
              <FaSearch className="mx-auto text-gray-500 text-6xl mb-4" />
              <h3 className="text-xl font-bold text-white">No matches found</h3>
              <p className="text-gray-400 mt-2">Try searching for a different keyword or tutor bio detail.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Hobbies;