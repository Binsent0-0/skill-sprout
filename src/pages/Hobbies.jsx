import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaStar, FaSearch, FaUser } from 'react-icons/fa'; // Keeping utility icons

const Hobbies = () => {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category');
  
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Update category if URL changes (e.g., coming from Home page)
  useEffect(() => {
    if (categoryFromUrl) {
      setActiveCategory(categoryFromUrl);
    }
  }, [categoryFromUrl]);

  // --- MOCK DATA (Using 'placeholder' string instead of icons) ---
  const hobbiesData = [
    // GAMING
    { id: 1, title: 'Valorant Rank Up Coaching', tutor: 'JettMain99', category: 'Gaming', rating: 4.9, reviews: 120, price: '₱300/hr', image: 'placeholder' },
    { id: 2, title: 'Chess Strategy for Beginners', tutor: 'Grandmaster K', category: 'Gaming', rating: 5.0, reviews: 45, price: '₱500/hr', image: 'placeholder' },
    { id: 3, title: 'League of Legends Macro Guide', tutor: 'FakerFan', category: 'Gaming', rating: 4.7, reviews: 89, price: '₱250/hr', image: 'placeholder' },

    // MUSIC
    { id: 4, title: 'Acoustic Guitar Basics', tutor: 'Acoustic Andy', category: 'Music', rating: 4.8, reviews: 200, price: '₱400/hr', image: 'placeholder' },
    { id: 5, title: 'Piano Masterclass', tutor: 'Melody Jane', category: 'Music', rating: 4.9, reviews: 150, price: '₱600/hr', image: 'placeholder' },
    { id: 6, title: 'Music Theory 101', tutor: 'Prof. Beat', category: 'Music', rating: 4.6, reviews: 30, price: '₱350/hr', image: 'placeholder' },

    // CODING
    { id: 7, title: 'Web Dev: HTML & CSS', tutor: 'Dev Sarah', category: 'Coding', rating: 4.9, reviews: 320, price: '₱500/hr', image: 'placeholder' },
    { id: 8, title: 'Python for Data Science', tutor: 'Data Dave', category: 'Coding', rating: 4.8, reviews: 90, price: '₱700/hr', image: 'placeholder' },

    // COOKING
    { id: 9, title: 'Italian Pasta from Scratch', tutor: 'Chef Luigi', category: 'Cooking', rating: 5.0, reviews: 50, price: '₱800/session', image: 'placeholder' },
    { id: 10, title: 'Healthy Meal Prep', tutor: 'Coach Fit', category: 'Cooking', rating: 4.7, reviews: 110, price: '₱400/session', image: 'placeholder' },

    // LANGUAGES
    { id: 11, title: 'Conversational Japanese', tutor: 'Sakura Sensei', category: 'Languages', rating: 4.9, reviews: 210, price: '₱600/hr', image: 'placeholder' },
  ];

  // List of all unique categories for the filter bar
  const categories = ['All', 'Gaming', 'Coding', 'Music', 'Cooking', 'Languages', 'Design', 'Business', 'Fitness'];

  // FILTER LOGIC
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

      {/* --- LISTINGS GRID --- */}
      <div className="max-w-7xl mx-auto">
        
        {filteredHobbies.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHobbies.map((hobby) => (
              <div 
                key={hobby.id} 
                className="group bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-900/10 flex flex-col"
              >
                
                {/* Card Image Area (Now a simple placeholder div) */}
                <div className="h-48 bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                  <div className="text-center text-gray-500 font-medium p-4 border border-gray-700/50 rounded-lg">
                    [Image Placeholder: {hobby.category}]
                  </div>
                  
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center space-x-1 border border-white/10">
                    <FaStar className="text-yellow-400 text-xs" />
                    <span className="text-white text-xs font-bold">{hobby.rating}</span>
                    <span className="text-gray-400 text-xs">({hobby.reviews})</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-orange-500 uppercase tracking-wider border border-orange-500/20 bg-orange-500/10 px-2 py-1 rounded">
                      {hobby.category}
                    </span>
                    <span className="text-white font-bold">{hobby.price}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">
                    {hobby.title}
                  </h3>
                  
                  <div className="flex items-center space-x-2 text-gray-500 text-sm mb-6">
                    <FaUser className="text-xs" />
                    <span>By {hobby.tutor}</span>
                  </div>

                  {/* Button */}
                  <div className="mt-auto">
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

    </div>
  );
};

export default Hobbies;