import React from 'react';
import { FaGithub, FaLinkedin, FaInstagram, FaFacebook, FaLightbulb, FaHandshake, FaRocket } from 'react-icons/fa';

const About = () => {
  const creators = [
    { name: 'Kian Agulan', role: 'Developer' },
    { name: 'Keon Chan', role: 'Developer' },
    { name: 'Lester Mendoza', role: 'Developer' },
    { name: 'Rom Navarro', role: 'Developer' },
    { name: 'Vince Rufino', role: 'Developer' },
    { name: 'Nathaniel Santos', role: 'Developer' },
    { name: 'Andrew Victoria', role: 'Developer' },
  ];

  return (
    <div className="w-full bg-neutral-950 min-h-screen pt-20 pb-20">
      
      {/* --- HEADER SECTION --- */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 text-center">
        <div className="inline-block bg-orange-900/20 border border-orange-500/30 text-orange-400 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide mb-6 mt-12">
          🚀 The Team Behind the Code
        </div>
        <h1 className="text-5xl font-extrabold text-white mb-6">
          Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">Creators</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          We are a passionate team of developers building SkillSprout to help you grow your potential and master new hobbies.
        </p>
      </div>

      {/* --- CREATORS FLEXBOX --- */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-32">
        <div className="flex flex-wrap justify-center gap-8">
          
          {creators.map((creator, index) => (
            <div 
              key={index} 
              className="w-72 group bg-neutral-900 border border-white/5 rounded-2xl p-6 hover:border-orange-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-orange-900/20 flex flex-col items-center text-center"
            >
              {/* Image Placeholder */}
              <div className="w-32 h-32 bg-neutral-800 rounded-full mb-6 border-2 border-orange-500/20 group-hover:border-orange-500 transition-colors overflow-hidden flex items-center justify-center relative">
                <div className="text-4xl">🧑‍💻</div>
              </div>

              {/* Name & Role */}
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-orange-400 transition-colors">
                {creator.name}
              </h3>
              <p className="text-sm text-gray-500 font-medium mb-6 uppercase tracking-wider">
                {creator.role}
              </p>

              {/* Social Icons */}
              <div className="flex space-x-4 mt-auto">
                <a href="#" className="text-gray-400 hover:text-white hover:scale-110 transition-all"><FaGithub size={20} /></a>
                <a href="#" className="text-gray-400 hover:text-blue-400 hover:scale-110 transition-all"><FaLinkedin size={20} /></a>
                <a href="#" className="text-gray-400 hover:text-pink-500 hover:scale-110 transition-all"><FaInstagram size={20} /></a>
                <a href="#" className="text-gray-400 hover:text-blue-600 hover:scale-110 transition-all"><FaFacebook size={20} /></a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- WEBSITE DETAILS SECTION --- */}
      <div className="border-t border-white/10 bg-neutral-900/30 w-full py-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left: Text Content */}
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                About <span className="text-orange-500">SkillSprout.</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-6">
                SkillSprout was born from a simple idea: <strong>learning should be accessible, personal, and fun.</strong> 
                Whether you want to master a difficult academic subject, pick up a guitar for the first time, or refine your gaming strategy, we connect you with the right mentors.
              </p>
              <p className="text-gray-400 text-lg leading-relaxed">
                Our platform bridges the gap between passionate experts and eager learners. We believe that everyone has a skill worth sharing, and everyone has the potential to sprout something new.
              </p>
            </div>

            {/* Right: Feature Highlights */}
            <div className="space-y-6">
              {/* Feature 1 */}
              <div className="flex items-start space-x-4 bg-neutral-900 p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                <div className="bg-orange-500/10 p-3 rounded-lg text-orange-500">
                  <FaLightbulb size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Curated Knowledge</h3>
                  <p className="text-gray-400 text-sm mt-1">We don't just list tutors; we build pathways for you to discover hobbies you never knew you loved.</p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="flex items-start space-x-4 bg-neutral-900 p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                <div className="bg-orange-500/10 p-3 rounded-lg text-orange-500">
                  <FaHandshake size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Community Focused</h3>
                  <p className="text-gray-400 text-sm mt-1">Built by students, for students. We understand the value of peer-to-peer learning and mentorship.</p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="flex items-start space-x-4 bg-neutral-900 p-6 rounded-xl border border-white/5 hover:border-orange-500/30 transition-colors">
                <div className="bg-orange-500/10 p-3 rounded-lg text-orange-500">
                  <FaRocket size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Limitless Growth</h3>
                  <p className="text-gray-400 text-sm mt-1">From coding to cooking, our diverse range of categories ensures you never stop growing.</p>
                </div>
              </div>
            </div>

          </div>
          
          {/* Footer Copyright */}
          <div className="mt-20 pt-8 border-t border-white/5 text-center text-gray-600 text-sm">
            <p>&copy; {new Date().getFullYear()} SkillSprout. Made with ❤️ in the Philippines.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;