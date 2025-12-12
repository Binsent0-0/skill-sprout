import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 

const Navbar = ({ session, onOpenModal, onLogout }) => {
  const [userRole, setUserRole] = useState(null); // 'student', 'tutor', or 'admin'

  // 2. Fetch the "Role" whenever the session changes (Login/Logout)
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (data) setUserRole(data.role);
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [session]);

  // Helper to get display name
  const getUserName = () => {
    if (!session || !session.user) return 'User';
    return session.user.user_metadata?.full_name || session.user.email.split('@')[0];
  };

  // Helper to determine where the user should go when clicking their name
  const getDashboardPath = () => {
    if (userRole === 'admin') return "/admin";
    if (userRole === 'tutor') return "/tutor-dashboard";
    return "/dashboard";
  };

  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-white/10 w-full z-50 fixed top-0 left-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer group">
            <span className="text-2xl font-bold text-white tracking-tight transition">
              Skill<span className="text-orange-500">Sprout.</span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex space-x-8 items-center">
            <Link to="/" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">Home</Link>
            <Link to="/about" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">About Us</Link>
            <Link to="/hobbies" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">Hobbies</Link>
            <Link to="/tutors" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">Tutors</Link>
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-6">
            
            {/* --- GUEST (NOT LOGGED IN) --- */}
            {!session ? (
              <>
                <button onClick={onOpenModal} className="text-gray-300 hover:text-white font-medium transition duration-200">
                  Login
                </button>
                <button onClick={onOpenModal} className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-md shadow-orange-900/20 hover:shadow-orange-600/40 transform hover:-translate-y-0.5 transition-all duration-200">
                  Become a Tutor
                </button>
              </>
            ) : (
              /* --- LOGGED IN USER --- */
              <>
                {/* Dynamically route to Admin, Tutor, or Student dashboard */}
                <Link to={getDashboardPath()} 
                  className="text-gray-300 hover:text-orange-500 font-medium transition duration-200 hidden lg:block"
                >
                  Hello, <span className="text-white font-semibold">{getUserName()}!</span>
                </Link>

                <button onClick={onLogout} className="text-gray-300 hover:text-red-500 font-medium transition duration-200">
                  Sign Out
                </button>

                {/* 3. DYNAMIC BUTTON BASED ON ROLE */}
                {userRole === 'admin' ? (
                  // IF ADMIN: Show Admin Panel Button
                  <Link to="/admin" 
                    className="bg-purple-600 border border-purple-400 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-purple-500 transition-all duration-200"
                  >
                    Admin Panel
                  </Link>
                ) : userRole === 'tutor' ? (
                  // IF TUTOR: Show "Create Listing"
                  <Link to="/create-listing" 
                    className="bg-neutral-800 border border-orange-500/50 text-orange-500 px-6 py-2.5 rounded-full font-semibold hover:bg-orange-500 hover:text-white transition-all duration-200"
                  >
                    + Create Listing
                  </Link>
                ) : (
                  // IF STUDENT: Show "Become a Tutor"
                  <Link to="/apply" 
                    className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-6 py-2.5 rounded-full font-semibold shadow-md shadow-orange-900/20 hover:shadow-orange-600/40 transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Become a Tutor
                  </Link>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;