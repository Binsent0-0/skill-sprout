// App.jsx - Updated with 404
import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import ChatWidget from './components/ChatWidget';

import Home from './pages/Home';
import About from './pages/About';
import Hobbies from './pages/Hobbies';
import Tutors from './pages/Tutors';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import Apply from './pages/Apply';
import CreateListing from './pages/CreateListing';
import NotFound from './components/NotFound'; // <--- 1. IMPORT THIS

function App() {
  const [session, setSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeChatUser, setActiveChatUser] = useState(null); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <Navbar
        session={session}
        onOpenModal={() => setIsModalOpen(true)}
        onLogout={async () => {
          await supabase.auth.signOut();
          setSession(null);
        }}
      />
      
      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {session?.user && (
        <ChatWidget 
          currentUserId={session.user.id} 
          externalUser={activeChatUser} 
          onChatStarted={() => setActiveChatUser(null)} 
        />
      )}

      <div className="pt-20"> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          
          <Route path="/hobbies" element={<Hobbies onContactTutor={setActiveChatUser} />} />
          <Route path="/tutors" element={<Tutors onContactTutor={setActiveChatUser} />} />
          <Route path="/apply" element={<Apply />} />
          
          <Route path="/admin" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/tutor-dashboard" element={<ProtectedRoute allowedRole="tutor"><TutorDashboard /></ProtectedRoute>} />
          <Route path="/create-listing" element={<ProtectedRoute allowedRole="tutor"><CreateListing /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute allowedRole="student"><StudentDashboard /></ProtectedRoute>} />

          {/* 2. ADD THIS CATCH-ALL ROUTE AT THE END */}
          <Route path="*" element={<NotFound />} />
          
        </Routes>
      </div>
    </div>
  );
}

export default App;