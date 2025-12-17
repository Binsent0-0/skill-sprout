import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import { supabase } from '../supabaseClient'; 

const Navbar = ({ session, onOpenModal, onLogout }) => {
  const [userRole, setUserRole] = useState(null);
  const [dbName, setDbName] = useState(null); // 1. Add state for the database name
  const navigate = useNavigate(); 

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (session?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, full_name') // 2. Select 'full_name' alongside 'role'
          .eq('id', session.user.id)
          .single();

        if (data) {
            setUserRole(data.role);
            setDbName(data.full_name); // 3. Set the name from the database
        }
      } else {
        setUserRole(null);
        setDbName(null);
      }
    };
    fetchUserProfile();
  }, [session]);

  // 4. Update logic to prioritize the database name
  const getDisplayName = () => {
    if (dbName) return dbName; // Priority: Live database name
    if (!session || !session.user) return 'User';
    // Fallback: Session metadata or email
    return session.user.user_metadata?.full_name || session.user.email.split('@')[0];
  };

  const getDashboardPath = () => {
    if (userRole === 'admin') return "/admin";
    if (userRole === 'tutor') return "/tutor-dashboard";
    return "/dashboard";
  };

  const handleLogoutClick = async () => {
    await onLogout(); 
    navigate('/');    
  };

  return (
    <nav className="bg-black/90 backdrop-blur-md border-b border-white/10 w-full z-50 fixed top-0 left-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex-shrink-0 flex items-center cursor-pointer group">
            <span className="text-2xl font-bold text-white tracking-tight transition">
              Skill<span className="text-orange-500">Sprout.</span>
            </span>
          </Link>

          <div className="absolute left-1/2 transform -translate-x-1/2 hidden lg:flex space-x-8 items-center">
            <Link to="/" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">Home</Link>
            <Link to="/about" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">About Us</Link>
            <Link to="/hobbies" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">Hobbies</Link>
            <Link to="/tutors" className="text-gray-300 hover:text-orange-500 font-medium transition duration-200">Tutors</Link>
          </div>

          <div className="flex items-center space-x-6">
            {!session ? (
              <>
                <button onClick={onOpenModal} className="text-gray-300 hover:text-white font-medium transition duration-200">Login</button>
                <button onClick={onOpenModal} className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all">Become a Tutor</button>
              </>
            ) : (
              <>
                <Link to={getDashboardPath()} className="text-gray-300 hover:text-orange-500 font-medium transition duration-200 hidden lg:block">
                  {/* 5. Use the new helper function */}
                  Hello, <span className="text-white font-semibold">{getDisplayName()}!</span>
                </Link>
                <button onClick={handleLogoutClick} className="text-gray-300 hover:text-red-500 font-medium transition duration-200">Sign Out</button>
                
                {userRole === 'admin' ? (
                  <Link to="/admin" className="bg-purple-600 text-white px-6 py-2.5 rounded-full font-semibold hover:bg-purple-500 transition-all">Admin Panel</Link>
                ) : userRole === 'tutor' ? (
                  <Link to="/create-listing" className="bg-neutral-800 border border-orange-500/50 text-orange-500 px-6 py-2.5 rounded-full font-semibold transition-all">+ Create Listing</Link>
                ) : (
                  <Link to="/apply" className="bg-gradient-to-r from-orange-500 to-orange-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all">Become a Tutor</Link>
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