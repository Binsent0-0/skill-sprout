import React from 'react';
import { FaGamepad, FaLaptopCode, FaMusic, FaUtensils, FaLanguage, FaPaintBrush, FaBriefcase, FaDumbbell, FaPencilAlt, FaCameraRetro, FaRocket } from 'react-icons/fa';

const Home = () => {
  const categories = [
    // Replaced emoji strings with imported React Icon components
    { name: 'Gaming', icon: FaGamepad },
    { name: 'Coding', icon: FaLaptopCode },
    { name: 'Music', icon: FaMusic }, 
    { name: 'Cooking', icon: FaUtensils },
    { name: 'Languages', icon: FaLanguage },
    { name: 'Design', icon: FaPaintBrush },
    { name: 'Business', icon: FaBriefcase },
    { name: 'Fitness', icon: FaDumbbell },
    { name: 'Writing', icon: FaPencilAlt },
    { name: 'Photography', icon: FaCameraRetro },
  ];

  // Duplicate the array to create the seamless infinite scroll effect
  const scrollingCategories = [...categories, ...categories];

  return (
    <div className="w-full bg-neutral-950 min-h-screen relative overflow-x-hidden">
      
      {/* --- HERO SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-[calc(100vh-200px)] flex items-center relative z-10">
        <div className="grid grid-cols-2 gap-16 items-center w-full">
          
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-block bg-orange-900/20 border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
              ⚡ Spark your curiosity
            </div>
            
            <h1 className="text-6xl font-extrabold text-white leading-tight">
              Master new skills, <br />
              Ignite your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Potential.</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-lg leading-relaxed">
              Connect with expert mentors to master gaming, hobbies, and professional skills. Your journey starts now.
            </p>

            <div className="flex items-center space-x-4">
              <button className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-orange-900/30 hover:shadow-orange-600/50 transform hover:-translate-y-1 transition-all text-lg">
                Find a Tutor
              </button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-full flex justify-center items-center">
            <div className="w-full h-[500px] bg-neutral-900 rounded-3xl shadow-2xl border border-gray-800 flex items-center justify-center overflow-hidden relative group">
              <div className="text-center">
                <div className="w-20 h-20 bg-neutral-800 rounded-full mx-auto mb-4 flex items-center justify-center">
                   {/* Using FaRocket icon component */}
                   <FaRocket className="text-4xl text-white" /> 
                </div>
                <p className="text-gray-500 font-bold text-xl">Hero Image Area</p>
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/0 to-orange-500/0 group-hover:to-orange-500/10 transition-all duration-500"></div>
            </div>
          </div>

        </div>
      </div>

      {/* --- ROLLING CATEGORIES WINDOW --- */}
      <div className="w-full py-12 bg-neutral-900/50 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">Explore Popular Categories</p>
        </div>

        {/* The Scrolling Wrapper */}
        <div className="flex animate-infinite-scroll pause-on-hover w-max">
          {scrollingCategories.map((cat, index) => (
            <a 
              key={index}
              href={`/hobbies?category=${cat.name}`} 
              className="mx-4 group"
            >
              <div className="w-48 h-32 bg-neutral-900 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transform transition-all duration-300 hover:scale-110 hover:border-orange-500/50 hover:bg-neutral-800 hover:shadow-xl hover:shadow-orange-900/20">
                
                {/* Rendering the React Icon component */}
                <cat.icon className="text-4xl text-orange-400 group-hover:animate-bounce" /> 
                
                <span className="text-gray-300 font-bold group-hover:text-white transition-colors">
                  {cat.name}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none z-0" />
      
    </div>
  );
};

export default Home;