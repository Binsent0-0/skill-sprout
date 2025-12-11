import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import { FaStar, FaSearch, FaUser, FaSpinner } from 'react-icons/fa'; 

const Hobbies = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data States
  const [hobbiesData, setHobbiesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Update category if URL changes (e.g., coming from Home page)
  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // --- 1. FETCH REAL DATA FROM SUPABASE ---
  useEffect(() => {
    const fetchHobbies = async () => {
      setLoading(true);
      
      // Query to fetch approved hobbies and join with the profiles table
      const { data, error } = await supabase
        .from('hobbies')
        .select('*') // SELECT all hobby columns and the full_name from the linked profile
        .eq('status', 'approved'); // Only fetches approved posts

      if (error) {
        console.error("Error fetching hobbies:", error);
      } else {
        setHobbiesData(data || []);
      }
      setLoading(false);
    };

    fetchHobbies();
  }, []); 

  // List of all unique categories (You can fetch these dynamically too if you want)
  const categories = ['All', 'Gaming', 'Coding', 'Music', 'Cooking', 'Languages', 'Design', 'Business', 'Fitness'];

  // --- FILTER LOGIC ---
  const filteredHobbies = hobbiesData.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-6 lg:px-8">
      
      {/* --- PAGE HEADER --- */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4">
          Explore <span className="text-orange-500">Hobbies</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Find the perfect mentor to help you level up your skills. Browse through our curated list of expert tutors.
        </p>
      </div>

      {/* --- SEARCH & FILTERS --- */}
      <div className="max-w-7xl mx-auto mb-12 space-y-6">
        
        {/* Search Bar */}
        <div className="relative max-w-2xl">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search for 'Guitar', 'Valorant', 'Python'..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
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

      {/* --- LOADING STATE --- */}
      {loading ? (
        <div className="flex justify-center py-20">
          <FaSpinner className="animate-spin text-orange-500 text-4xl" />
        </div>
      ) : (
        /* --- LISTINGS GRID --- */
        <div className="max-w-7xl mx-auto">
          
          {filteredHobbies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHobbies.map((hobby) => (
                <div 
                  key={hobby.id} 
                  className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10 flex flex-col"
                >
                  
                  {/* Card Image Area */}
                  <div className="h-48 bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                    {hobby.image_url ? (
                      <img 
                        src={hobby.image_url} 
                        alt={hobby.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="text-gray-600 font-medium">No Image Available</div>
                    )}
                    
                    {/* Rating Badge (You can fetch real ratings later) */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center space-x-1 border border-white/10">
                      <FaStar className="text-yellow-400 text-xs" />
                      <span className="text-white text-xs font-bold">New</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider border border-orange-500/20 bg-orange-500/10 px-2 py-1 rounded">
                        {hobby.category}
                      </span>
                      {/* Price could be added to DB later, showing 'Varies' for now */}
                      <span className="text-white font-bold text-sm">Varies</span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                      {hobby.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {hobby.description}
                    </p>

                    {/* --- TUTOR NAME DISPLAY --- */}
                    <div className="flex items-center space-x-2 text-gray-500 text-sm mb-6 mt-auto">
                      <FaUser className="text-xs" />
                      {/* THIS IS WHERE THE NAME IS DISPLAYED */}
                      <span>By {hobby.profiles?.full_name || 'Unknown Tutor'}</span>
                    </div>

                    {/* Button */}
                    <div>
                      <button className="w-full py-3 rounded-lg font-semibold bg-white text-black hover:bg-orange-500 hover:text-white transition-all duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-white/5">
              <div className="text-6xl mb-4">
                <FaSearch className="mx-auto text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No hobbies found</h3>
              <p className="text-gray-400">Try selecting a different category or adjusting your search.</p>
              <button 
                onClick={() => {setActiveCategory('All'); setSearchTerm('')}}
                className="mt-6 text-orange-500 font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Hobbies;