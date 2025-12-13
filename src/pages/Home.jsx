import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  FaGamepad, FaLaptopCode, FaMusic, FaUtensils, FaLanguage, 
  FaPaintBrush, FaBriefcase, FaDumbbell, FaPencilAlt, FaCameraRetro, 
  FaChevronLeft, FaChevronRight, FaUser 
} from 'react-icons/fa';

// --- CAROUSEL COMPONENT ---
const Carousel = ({ items, loading }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered || items.length === 0) return;
    const timer = setTimeout(() => {
      setCurrentIndex((prevIndex) => prevIndex === items.length - 1 ? 0 : prevIndex + 1);
    }, 4000); 
    return () => clearTimeout(timer);
  }, [currentIndex, isHovered, items.length]);

  const prevSlide = (e) => {
    e.preventDefault();
    setCurrentIndex(currentIndex === 0 ? items.length - 1 : currentIndex - 1);
  };

  const nextSlide = (e) => {
    e.preventDefault();
    setCurrentIndex(currentIndex === items.length - 1 ? 0 : currentIndex + 1);
  };

  if (loading) return (
    <div className="w-full h-[500px] bg-neutral-900 rounded-3xl animate-pulse flex items-center justify-center border border-white/5">
      <p className="text-gray-500 font-bold tracking-widest uppercase text-xs">Loading Featured...</p>
    </div>
  );

  if (items.length === 0) return null;

  return (
    <div 
      className="w-full h-[500px] bg-neutral-900 rounded-3xl shadow-2xl border border-white/5 relative group overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div 
        className="w-full h-full flex transition-transform duration-1000 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item) => (
          <div key={item.id} className="min-w-full h-full relative overflow-hidden">
            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-[5000ms]" />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-900/40 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 text-[10px] font-black tracking-widest text-orange-400 uppercase bg-orange-500/10 border border-orange-500/20 rounded-lg">Featured</span>
                <span className="px-3 py-1 text-[10px] font-black tracking-widest text-white uppercase bg-white/5 border border-white/10 rounded-lg">{item.category}</span>
              </div>
              <div className="flex justify-between items-end gap-4 mb-4">
                <h2 className="text-4xl font-black text-white leading-tight max-w-md">{item.title}</h2>
                <div className="text-right flex flex-col items-end">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Starting at</p>
                  <p className="text-3xl font-black text-orange-500">₱{item.price?.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white"><FaUser size={12} /></div>
                  <p className="text-gray-300 font-bold text-sm">{item.profiles?.full_name || 'Anonymous Tutor'}</p>
                </div>
                <button className="text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full transition-all">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={prevSlide} className="absolute left-6 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-4 rounded-full hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"><FaChevronLeft size={20} /></button>
      <button onClick={nextSlide} className="absolute right-6 top-1/2 -translate-y-1/2 z-20 bg-black/50 text-white p-4 rounded-full hover:bg-orange-600 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-md"><FaChevronRight size={20} /></button>
    </div>
  );
};

// --- MAIN HOME COMPONENT ---
const Home = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
    { name: 'Gaming', icon: FaGamepad }, { name: 'Coding', icon: FaLaptopCode },
    { name: 'Music', icon: FaMusic }, { name: 'Cooking', icon: FaUtensils },
    { name: 'Languages', icon: FaLanguage }, { name: 'Design', icon: FaPaintBrush },
    { name: 'Business', icon: FaBriefcase }, { name: 'Fitness', icon: FaDumbbell },
    { name: 'Writing', icon: FaPencilAlt }, { name: 'Photography', icon: FaCameraRetro },
  ];
  
  useEffect(() => {
    fetchFeatured();
  }, []);

  const fetchFeatured = async () => {
    setLoading(true);
    const { data } = await supabase.from('hobbies').select(`*, profiles:created_by (full_name)`).eq('featured', true).eq('status', 'approved').limit(5);
    setFeaturedItems(data || []);
    setLoading(false);
  };

  const scrollingCategories = [...categories, ...categories, ...categories];

  return (
    <div className="w-full bg-neutral-950 min-h-screen relative overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 flex items-center relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center w-full">
          <div className="space-y-8">
            <div className="inline-block bg-orange-900/20 border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">⚡ Spark your curiosity</div>
            <h1 className="text-7xl font-black text-white leading-[1.1] tracking-tight">Master skills, <br />Grow your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Passion.</span></h1>
            <p className="text-xl text-gray-400 max-w-lg leading-relaxed">Connect with expert mentors to master gaming, hobbies, and professional skills. Your journey starts now.</p>
            <a href="/hobbies" className="inline-block bg-gradient-to-r from-orange-500 to-orange-700 text-white px-10 py-5 rounded-full font-black shadow-lg hover:shadow-orange-600/50 transform hover:-translate-y-1 transition-all text-lg">Find a Tutor</a>
          </div>
          <div className="relative h-full"><Carousel items={featuredItems} loading={loading} /></div>
        </div>
      </div>

      {/* --- RESTORED BOX-STYLE INFINITE SCROLL --- */}
      <div className="w-full py-16 bg-neutral-900/50 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Explore Popular Categories</p>
        </div>
        <div className="flex animate-infinite-scroll hover:[animation-play-state:paused] w-max">
          {scrollingCategories.map((cat, index) => (
            <a key={index} href={`/hobbies?category=${cat.name}`} className="mx-4 group">
              <div className="w-48 h-32 bg-neutral-900 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transform transition-all duration-300 group-hover:scale-110 group-hover:border-orange-500/50 group-hover:bg-neutral-800 group-hover:shadow-2xl group-hover:shadow-orange-900/20">
                <cat.icon className="text-4xl text-orange-400 group-hover:animate-bounce" /> 
                <span className="text-gray-300 font-bold group-hover:text-white transition-colors">{cat.name}</span>
              </div>
            </a>
          ))}
        </div>
      </div>

      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none z-0" />
    </div>
  );
};

export default Home;