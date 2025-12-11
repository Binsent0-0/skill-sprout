import React from 'react';
import { Link } from 'react-router-dom'; // <--- Import Link

const Navbar = () => {
  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-white/10 w-full z-50 fixed top-0 left-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo - Links to Home */}
          <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer group">
            <span className="text-2xl font-bold text-white tracking-tight transition">
              Skill<span className="text-orange-500">Sprout.</span>
            </span>
          </Link>

          {/* Navigation Links - Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex space-x-8 items-center">
            <Link to="/" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">
              Home
            </Link>
            <Link to="/about" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">
              About Us
            </Link>
            <Link to="/hobbies" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">
              Hobbies
            </Link>
            <Link to="/tutors" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">
              Tutors
            </Link>
          </div>

          {/* Right Side - Login & CTA */}
          <div className="flex items-center space-x-6">
            <Link to="#" className="text-gray-300 hover:text-white font-medium transition duration-200">
              Login
            </Link>
            <button className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-md shadow-orange-900/20 hover:shadow-orange-600/40 transform hover:-translate-y-0.5 transition-all duration-200">
              Become a Tutor
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;