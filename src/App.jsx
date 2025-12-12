import { useState, useEffect } from 'react'; // 1. Import Hooks
import { Routes, Route } from 'react-router-dom';
import { supabase } from './supabaseClient'; // 2. Import Supabase
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal'; // 3. Import your Modal
import Home from './pages/home';
import About from './pages/About';
import Hobbies from './pages/Hobbies';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import CreateListing from './pages/CreateListing';

// Simple placeholder for pages we haven't built yet
const Placeholder = ({ title }) => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
    <h1 className="text-4xl font-bold text-orange-500">{title} Page Coming Soon</h1>
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // A. Check active session when App loads
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // B. Listen for login/logout events automatically
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* We pass props to Navbar so it knows:
         1. Is the user logged in? (session)
         2. How to open the modal (onOpenModal)
         3. How to logout (onLogout)
      */}
      <Navbar 
        session={session} 
        onOpenModal={() => setIsModalOpen(true)}
        onLogout={() => supabase.auth.signOut()}
      />
      
      {/* Render the Modal (Hidden unless isModalOpen is true) */}
      <AuthModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      {/* The Routes container decides which component to render */}
      <div className="pt-20"> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/hobbies" element={<Hobbies />} />
          <Route path="/tutors" element={<Placeholder title="Tutors" />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard" element={<StudentDashboard />} />
          <Route path="/tutor-dashboard" element={<TutorDashboard />} />
          <Route path="/create-listing" element={<CreateListing />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;