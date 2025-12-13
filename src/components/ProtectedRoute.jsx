import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldAlert, Loader2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [session, setSession] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);

      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        setUserRole(data?.role || 'student');
      }
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
        <p className="text-gray-400 animate-pulse">Verifying credentials...</p>
      </div>
    );
  }

  // If not logged in at all
  if (!session) {
    return <AccessDenied message="Please login to access this area." />;
  }

  // If logged in but the role doesn't match
  if (userRole !== allowedRole) {
    return <AccessDenied message={`This area is restricted to ${allowedRole}s only.`} />;
  }

  return children;
};

// UI for the Restricted Access Screen
const AccessDenied = ({ message }) => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
      <ShieldAlert className="text-red-500" size={40} />
    </div>
    <h1 className="text-3xl font-bold text-white mb-2">Restricted Access</h1>
    <p className="text-gray-400 mb-8 max-w-sm">{message}</p>
    <Link 
      to="/" 
      className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all"
    >
      <Home size={18} /> Return Home
    </Link>
  </div>

  
);



export default ProtectedRoute;