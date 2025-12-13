import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  User, BookOpen, CheckCircle, Star, Save, Loader2, Camera, 
  History, TrendingDown, ArrowRight 
} from 'lucide-react';

const StudentDashboard = () => {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [loading, setLoading] = useState(true);

  // Data States
  const [profile, setProfile] = useState({ full_name: '', bio: '', avatar_url: '' });
  const [enrollments, setEnrollments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Form States
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = async () => {
    setLoading(true);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);

    if (currentSession) {
      const userId = currentSession.user.id;

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      setProfile(profileData || {});

      // 2. Fetch Enrollments (Currently Enrolled)
      const { data: enrollData } = await supabase
        .from('enrollments')
        .select(`
          *,
          hobbies (
            title,
            image_url,
            category,
            profiles:created_by (full_name)
          )
        `)
        .eq('user_id', userId);
      setEnrollments(enrollData || []);

      // 3. Fetch Transactions (Payment History)
      const { data: transData } = await supabase
        .from('transactions')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });
      setTransactions(transData || []);

      // 4. Fetch Reviews
      const { data: reviewData } = await supabase
        .from('reviews')
        .select('*, hobbies(title)')
        .eq('user_id', userId);
      setReviews(reviewData || []);
    }
    setLoading(false);
  };

  const handleImageUpload = async (event) => {
    try {
      setUploadingImage(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Select an image.');

      const file = event.target.files[0];
      const fileName = `${session.user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile({ ...profile, avatar_url: data.publicUrl });
      
    } catch (error) {
      alert(error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, bio: profile.bio, avatar_url: profile.avatar_url })
      .eq('id', session.user.id);

    if (password) await supabase.auth.updateUser({ password });
    if (!error) alert('Profile updated!');
    setSaving(false);
    setPassword('');
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white"><Loader2 className="animate-spin text-orange-500" size={40} /></div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  {profile.avatar_url ? <img src={profile.avatar_url} className="w-24 h-24 rounded-full object-cover border-2 border-orange-500" /> : <div className="w-24 h-24 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-orange-500"><User size={32} /></div>}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={18} className="text-white" /></div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <div>
                   <h3 className="text-white font-bold">{profile.full_name || 'My Profile'}</h3>
                   <p className="text-gray-500 text-sm">Update your bio and avatar</p>
                </div>
              </div>
              <div className="grid gap-4">
                <input value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none" placeholder="Display Name" />
                <textarea value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} rows="4" className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none" placeholder="Tell us about yourself..." />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none" placeholder="New Password (optional)" />
              </div>
              <button disabled={saving || uploadingImage} className="bg-orange-600 px-8 py-3 rounded-xl font-bold flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Changes
              </button>
            </form>
          </div>
        );

      case 'current':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Current Enrollments</h2>
            {enrollments.length === 0 ? (
              <div className="p-12 text-center bg-neutral-900 rounded-3xl border border-dashed border-white/10 text-gray-500">You aren't enrolled in any classes yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {enrollments.map(e => (
                  <div key={e.id} className="bg-neutral-900 border border-white/5 p-5 rounded-2xl flex items-center gap-4 group hover:border-orange-500/30 transition-all">
                    <img src={e.hobbies?.image_url} className="w-20 h-20 rounded-xl object-cover" alt="" />
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg group-hover:text-orange-500 transition-colors">{e.hobbies?.title}</h3>
                      <p className="text-gray-500 text-sm">Instructor: {e.hobbies?.profiles?.full_name}</p>
                      <button className="mt-3 text-xs font-bold text-orange-500 flex items-center gap-1 uppercase tracking-widest">Enter Classroom <ArrowRight size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'transactions':
        return (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">Payment History</h2>
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-gray-400 text-[10px] uppercase tracking-widest font-bold">
                  <tr><th className="p-5">Course / Detail</th><th className="p-5">Date</th><th className="p-5 text-right">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors text-sm">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 rounded-lg text-red-500"><TrendingDown size={16} /></div>
                          <div>
                            <p className="text-white font-bold">{t.plan_name}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Payment Successful</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-gray-400">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="p-5 text-right font-black text-white">- ₱{t.amount?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <div className="p-20 text-center text-gray-500 italic">No transaction history found.</div>}
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-4 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold text-white mb-6">My Reviews</h2>
            {reviews.length === 0 ? <p className="text-gray-500 italic">You haven't left any reviews yet.</p> : reviews.map(r => (
              <div key={r.id} className="bg-neutral-900 border border-white/5 p-5 rounded-2xl">
                <div className="flex justify-between mb-2">
                  <h4 className="text-white font-bold">{r.hobbies?.title}</h4>
                  <div className="flex text-yellow-500">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />)}</div>
                </div>
                <p className="text-gray-400 text-sm">"{r.comment}"</p>
              </div>
            ))}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 flex font-sans">
      <aside className="w-72 border-r border-white/10 hidden md:block min-h-screen p-6 fixed left-0 top-20 bg-black z-40">
        <div className="mb-8 px-4"><h1 className="text-xl font-bold text-orange-500">Student Hub</h1><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Learning Management</p></div>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><User size={20} /> Profile</button>
          <button onClick={() => setActiveTab('current')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'current' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><BookOpen size={20} /> Enrollments</button>
          <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'transactions' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><History size={20} /> Transactions</button>
          <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reviews' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><Star size={20} /> My Reviews</button>
        </nav>
      </aside>

      <main className="flex-1 p-8 md:ml-72 bg-neutral-950/20">{renderContent()}</main>
    </div>
  );
};

export default StudentDashboard;