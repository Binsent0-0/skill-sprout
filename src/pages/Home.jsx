import React, { useState, useEffect } from 'react';
import { 
  FaGamepad, FaLaptopCode, FaMusic, FaUtensils, FaLanguage, 
  FaPaintBrush, FaBriefcase, FaDumbbell, FaPencilAlt, FaCameraRetro, 
  FaRocket, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';

// --- DATA: CAROUSEL ITEMS ---
const featuredProducts = [
  {
    id: 1,
    title: "Master Python Programming",
    category: "Coding",
    image: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    link: "/course/python-masterclass",
    price: "$29.99"
  },
  {
    id: 2,
    title: "Pro Photography Basics",
    category: "Photography",
    image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    link: "/course/photography-101",
    price: "$45.00"
  },
  {
    id: 3,
    title: "Guitar for Beginners",
    category: "Music",
    image: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    link: "/course/guitar-start",
    price: "$19.50"
  }
];

// --- COMPONENT: CAROUSEL (Sliding Version) ---
const Carousel = ({ items }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-play Logic
  useEffect(() => {
    // If hovered, pause
    if (isHovered) return;

    // Use setTimeout to move to next slide after 3 seconds
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === items.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000); 

    // Clear timer to prevent erratic behavior
    return () => clearTimeout(timer);
  }, [currentIndex, isHovered, items.length]);

  const prevSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    setCurrentIndex(isFirstSlide ? items.length - 1 : currentIndex - 1);
  };

  const nextSlide = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isLastSlide = currentIndex === items.length - 1;
    setCurrentIndex(isLastSlide ? 0 : currentIndex + 1);
  };

  return (
    <div 
      className="w-full h-[500px] bg-neutral-900 rounded-3xl shadow-2xl border border-gray-800 relative group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 
         THE SLIDING TRACK: 
         - 'flex': Puts images side-by-side
         - 'transform': Moves the track left/right
      */}
      <div 
        className="w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item) => (
          <a 
            key={item.id} 
            href={item.link} 
            // 'min-w-full' ensures each slide takes up 100% of the view width
            className="min-w-full h-full relative cursor-pointer block"
          >
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2000ms]" 
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/40 to-transparent" />
            
            {/* Text Content */}
            <div className="absolute bottom-0 left-0 w-full p-8 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <span className="inline-block px-3 py-1 mb-3 text-xs font-bold tracking-wider text-orange-400 uppercase bg-orange-900/30 border border-orange-500/20 rounded-full">
                {item.category}
              </span>
              <h2 className="text-3xl font-bold text-white mb-2 leading-tight">{item.title}</h2>
              <div className="flex justify-between items-center mt-4">
                 <span className="text-gray-300 group-hover:text-white transition-colors">View Course Details</span>
                 <span className="text-xl font-bold text-white">{item.price}</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Navigation Controls */}
      <button 
        onClick={prevSlide} 
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-3 rounded-full hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
      >
        <FaChevronLeft size={20} />
      </button>
      
      <button 
        onClick={nextSlide} 
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-3 rounded-full hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
      >
        <FaChevronRight size={20} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 right-8 z-20 flex space-x-2">
        {items.map((_, index) => (
          <div 
            key={index} 
            className={`h-1 rounded-full transition-all duration-300 ${
              currentIndex === index ? "bg-orange-500 w-8" : "bg-gray-600 w-2"
            }`} 
          />
        ))}
      </div>
    </div>
  );
};

// --- MAIN HOME COMPONENT ---
const Home = () => {
  const categories = [
    { name: 'Gaming', icon: FaGamepad }, { name: 'Coding', icon: FaLaptopCode },
    { name: 'Music', icon: FaMusic }, { name: 'Cooking', icon: FaUtensils },
    { name: 'Languages', icon: FaLanguage }, { name: 'Design', icon: FaPaintBrush },
    { name: 'Business', icon: FaBriefcase }, { name: 'Fitness', icon: FaDumbbell },
    { name: 'Writing', icon: FaPencilAlt }, { name: 'Photography', icon: FaCameraRetro },
  ];
  
  // Triplicate the array to ensure smoother scrolling on wide screens
  const scrollingCategories = [...categories, ...categories, ...categories];

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
              <button 
                onClick={() => console.log("Navigate to search...")}
                className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-orange-900/30 hover:shadow-orange-600/50 transform hover:-translate-y-1 transition-all text-lg"
              >
                Find a Tutor
              </button>
            </div>
          </div>

          {/* Right Visual (Interactive Infinite Carousel) */}
          <div className="relative h-full flex justify-center items-center">
             <Carousel items={featuredProducts} />
          </div>

        </div>
      </div>

      {/* --- ROLLING CATEGORIES WINDOW --- */}
      <div className="w-full py-12 bg-neutral-900/50 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-6">
          <p className="text-gray-400 font-medium uppercase tracking-wider text-sm">Explore Popular Categories</p>
        </div>
        
        {/* Infinite Scroll Marquee */}
        <div className="flex animate-infinite-scroll hover:[animation-play-state:paused] w-max">
          {scrollingCategories.map((cat, index) => (
            <a key={index} href={`/hobbies?category=${cat.name}`} className="mx-4 group">
              <div className="w-48 h-32 bg-neutral-900 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transform transition-all duration-300 hover:scale-110 hover:border-orange-500/50 hover:bg-neutral-800 hover:shadow-xl hover:shadow-orange-900/20">
                <cat.icon className="text-4xl text-orange-400 group-hover:animate-bounce" /> 
                <span className="text-gray-300 font-bold group-hover:text-white transition-colors">{cat.name}</span>
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