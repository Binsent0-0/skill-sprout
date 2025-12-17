import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Home, Search } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      
      {/* Animated Graphic Container */}
      <div className="relative mb-8 group">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-orange-500 blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity duration-500 rounded-full"></div>

        {/* Main Icon */}
        <div className="relative z-10 bg-neutral-900 p-8 rounded-full border border-white/5 shadow-2xl">
          <Sprout size={80} className="text-orange-500 animate-pulse" />
        </div>

        {/* Floating element */}
        <div className="absolute -top-4 -right-4 bg-neutral-800 p-3 rounded-full border border-white/10 animate-bounce">
          <Search size={24} className="text-gray-400" />
        </div>
      </div>

      {/* Typography */}
      <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 mb-2 tracking-tighter">
        404
      </h1>

      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
        This seed hasn't sprouted yet.
      </h2>

      <p className="text-gray-400 max-w-md mb-10 text-lg leading-relaxed">
        We looked everywhere in the garden, but the page you are looking for doesn't exist or has been moved.
      </p>

      {/* Action Button */}
      <Link
        to="/"
        className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-full font-semibold transition-all duration-300 transform hover:-translate-y-1 shadow-lg shadow-orange-600/50 hover:shadow-orange-500/40"
      >
        <Home size={20} />
        Return Home
      </Link>

    </div>
  );
};

export default NotFound;