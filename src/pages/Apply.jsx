import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Send, CheckCircle, Loader2, BookOpen, Star, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Apply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [existingApp, setExistingApp] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    category: 'Gaming',
    bio: '',
    experience: ''
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/'); // Redirect if not logged in
      return;
    }

    const userId = session.user.id;
    setUser(session.user);

    // 1. Get Profile Name
    const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', userId).single();
    if (profile?.role === 'tutor') navigate('/tutor-dashboard');
    
    setFormData(prev => ({ ...prev, full_name: profile?.full_name || '' }));

    // 2. Check for existing application
    const { data: app } = await supabase.from('tutor_applications').select('*').eq('user_id', userId).single();
    setExistingApp(app);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase.from('tutor_applications').insert([{
        user_id: user.id,
        ...formData
      }]);

      if (error) throw error;
      await checkStatus(); // Refresh to show pending screen
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;

  // --- VIEW: PENDING APPLICATION ---
  if (existingApp && existingApp.status === 'pending') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-neutral-900 border border-white/5 p-10 rounded-3xl text-center shadow-2xl">
          <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 animate-pulse">
            <Loader2 size={40} className="animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Application Received</h2>
          <p className="text-gray-400 text-sm mb-8">Our team is currently reviewing your application for the <span className="text-orange-500 font-bold">{existingApp.category}</span> category. We'll update your status soon!</p>
          <button onClick={() => navigate('/')} className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all">Back to Home</button>
        </div>
      </div>
    );
  }

  // --- VIEW: THE FORM ---
  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        
        <div>
          <h1 className="text-5xl font-black text-white mb-6">Teach what <br/><span className="text-orange-500">you love.</span></h1>
          <p className="text-gray-400 text-lg mb-8 leading-relaxed">Join SkillSprout as a mentor. Share your expertise, grow your community, and earn while doing what you're best at.</p>
          
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 mt-1"><CheckCircle size={18}/></div>
              <div><p className="text-white font-bold">10% Low Platform Fee</p><p className="text-gray-500 text-sm">Keep 90% of everything you earn.</p></div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 mt-1"><Star size={18}/></div>
              <div><p className="text-white font-bold">Boost your Listings</p><p className="text-gray-500 text-sm">Promote your classes to the front page.</p></div>
            </div>
          </div>
        </div>

        <div className="bg-neutral-900 border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl pointer-events-none" />
          <h2 className="text-2xl font-bold text-white mb-6">Tutor Application</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Full Name</label>
              <input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all" placeholder="Enter your name" />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Primary Category</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none">
                {['Gaming', 'Coding', 'Music', 'Cooking', 'Languages', 'Design', 'Business', 'Fitness'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Short Bio</label>
              <textarea required rows="2" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none" placeholder="Briefly describe yourself" />
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">Experience / Why you?</label>
              <textarea required rows="3" value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none" placeholder="Tell us about your teaching experience..." />
            </div>

            <button disabled={submitting} className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-900/20 active:scale-[0.98]">
              {submitting ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Submit Application</>}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Apply;