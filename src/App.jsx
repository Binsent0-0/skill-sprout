import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/home';
import About from './pages/About';
import Hobbies from './pages/Hobbies';

// Simple placeholder for pages we haven't built yet
const Placeholder = ({ title }) => (
  <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
    <h1 className="text-4xl font-bold text-orange-500">{title} Page Coming Soon</h1>
  </div>
);

function App() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      {/* The Routes container decides which component to render */}
      <div className="pt-20"> {/* Padding top to account for fixed Navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/hobbies" element={<Hobbies />} />
          <Route path="/tutors" element={<Placeholder title="Tutors" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;