import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaHeart } from 'react-icons/fa';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black border-t border-white/10 pt-8 pb-4">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        
        {/* TOP SECTION: Changed to Grid for perfect centering */}
        <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-6 mb-6">
          
          {/* Left Column: Logo & Text */}
          <div className="text-center md:text-left justify-self-start">
            <Link to="/" className="text-xl font-bold text-white tracking-tight block mb-2">
              Skill<span className="text-orange-500">Sprout.</span>
            </Link>
            <p className="text-gray-400 text-[10px] leading-relaxed max-w-xs mx-auto md:mx-0">
              Connect with expert mentors, master new hobbies, and grow your passion.
            </p>
          </div>

          {/* Middle Column: Social Icons (Perfectly Centered) */}
          <div className="flex justify-center gap-4 justify-self-center">
            <SocialIcon icon={<FaFacebookF size={12} />} href="#" />
            <SocialIcon icon={<FaTwitter size={12} />} href="#" />
            <SocialIcon icon={<FaInstagram size={12} />} href="#" />
            <SocialIcon icon={<FaLinkedinIn size={12} />} href="#" />
          </div>

          {/* Right Column: About Us (Pushed to the end) */}
          <div className="text-center md:text-right justify-self-end">
            <Link to="/about" className="text-xs font-bold text-gray-400 hover:text-orange-500 transition-colors">
              About Us
            </Link>
          </div>
        </div>

        {/* BOTTOM SECTION: Copyright */}
        <div className="border-t border-white/10 pt-4 flex flex-col md:flex-row justify-between items-center gap-2">
          <p className="text-gray-500 text-[10px]">
            &copy; {currentYear} SkillSprout Inc. All rights reserved.
          </p>
          
    

          <div className="flex gap-4 text-[10px] text-gray-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Helper Components ---

const SocialIcon = ({ icon, href }) => (
  <a 
    href={href} 
    className="w-7 h-7 rounded-full bg-neutral-900 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all duration-300"
  >
    {icon}
  </a>
);

export default Footer;