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

  // Update category if URL changes
  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchHobbies = async () => {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('hobbies')
        .select(`
          *,
          profiles:created_by (
            full_name
          )
        `) 
        .eq('status', 'approved')
        // --- UPDATED ORDERING ---
        // 1. Featured items first (true comes before false in descending sort)
        .order('featured', { ascending: false, nullsFirst: false }) 
        // 2. Then newest items first within those groups
        .order('created_at', { ascending: false }); 

      if (error) {
        console.error("Error fetching hobbies:", error);
      } else {
        setHobbiesData(data || []);
      }
      setLoading(false);
    };

    fetchHobbies();
  }, []); 

  const categories = ['All', 'Gaming', 'Coding', 'Music', 'Cooking', 'Languages', 'Design', 'Business', 'Fitness'];

  // --- FILTER LOGIC ---
  // Note: The filter respects the initial load order, so featured items stay first unless filtered out.
  const filteredHobbies = hobbiesData.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-neutral-950 pt-24 pb-12 px-6 lg:px-8">
      
      {/* PAGE HEADER */}
      <div className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-extrabold text-white mb-4">
          Explore <span className="text-orange-500">Hobbies</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Find the perfect mentor to help you level up your skills. Browse through our curated list of expert tutors.
        </p>
      </div>

      {/* SEARCH & FILTERS */}
      <div className="max-w-7xl mx-auto mb-12 space-y-6">
        <div className="relative max-w-2xl">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search for 'Guitar', 'Valorant'..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-white/10 text-white pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
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

      {/* LISTINGS GRID */}
      {loading ? (
        <div className="flex justify-center py-20">
          <FaSpinner className="animate-spin text-orange-500 text-4xl" />
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          {filteredHobbies.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredHobbies.map((hobby) => (
                <div key={hobby.id} className={`group bg-neutral-900 border rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 flex flex-col ${hobby.featured ? 'border-yellow-500/30 shadow-lg shadow-yellow-900/10' : 'border-white/5 hover:border-orange-500/50'}`}>
                  
                  {/* Card Image */}
                  <div className="h-48 bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                    {hobby.image_url ? (
                      <img src={hobby.image_url} alt={hobby.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"/>
                    ) : (
                      <div className="text-gray-600 font-medium">No Image Available</div>
                    )}
                    
                    {/* --- UPDATED FEATURED BADGE --- */}
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-full flex items-center justify-center border border-white/10" title={hobby.featured ? "Featured Hobby" : ""}>
                       <FaStar className={hobby.featured ? "text-yellow-400 text-sm" : "text-gray-500/50 text-sm"} />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-orange-500 uppercase tracking-wider border border-orange-500/20 bg-orange-500/10 px-2 py-1 rounded">
                        {hobby.category}
                      </span>
                      <span className="text-white font-bold text-sm">
                        {hobby.price > 0 ? `₱${hobby.price.toLocaleString()}` : 'Free'}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors line-clamp-2">
                      {hobby.title}
                    </h3>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {hobby.description}
                    </p>

                    <div className="flex items-center space-x-2 text-gray-500 text-sm mb-6 mt-auto">
                      <FaUser className="text-xs" />
                      <span>By {hobby.profiles?.full_name || 'Unknown Tutor'}</span>
                    </div>

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
            <div className="text-center py-20 bg-neutral-900/30 rounded-3xl border border-white/5">
              <FaSearch className="mx-auto text-gray-500 text-6xl mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No hobbies found</h3>
              <p className="text-gray-400">Try selecting a different category or search term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Hobbies;