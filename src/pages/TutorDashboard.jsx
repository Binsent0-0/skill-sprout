import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  User, List, FileText, Camera, Save, Loader2, Plus, 
  BookOpen, CheckCircle, MessageCircle, Star 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TutorDashboard = () => {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [loading, setLoading] = useState(true);

  // --- DATA STATES ---
  const [profile, setProfile] = useState({ full_name: '', bio: '', avatar_url: '' });
  
  // Student Data (Learning)
  const [enrollments, setEnrollments] = useState([]);
  const [writtenReviews, setWrittenReviews] = useState([]); // Reviews I wrote

  // Tutor Data (Teaching)
  const [approvedListings, setApprovedListings] = useState([]);
  const [pendingListings, setPendingListings] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]); // Reviews on my classes

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
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    if (session) {
      const userId = session.user.id;

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', userId).single();
      setProfile(profileData || {});

      // 2. Fetch My Enrollments (As a Student)
      const { data: enrollmentData } = await supabase
        .from('enrollments')
        .select('*, hobbies(title, category, image_url)')
        .eq('user_id', userId);
      setEnrollments(enrollmentData || []);

      // 3. Fetch Reviews I Wrote (As a Student)
      const { data: myWrittenReviews } = await supabase
        .from('reviews')
        .select('*, hobbies(title)')
        .eq('user_id', userId);
      setWrittenReviews(myWrittenReviews || []);

      // 4. Fetch My Listings (As a Tutor)
      const { data: hobbies } = await supabase
        .from('hobbies')
        .select('*')
        .eq('created_by', userId);
      
      if (hobbies) {
        setApprovedListings(hobbies.filter(h => h.status === 'approved'));
        setPendingListings(hobbies.filter(h => h.status !== 'approved'));
      }

      // 5. Fetch Reviews Received on My Classes (As a Tutor)
      // We join hobbies to filter only reviews where the hobby creator is ME
      const { data: reviewsOnMe } = await supabase
        .from('reviews')
        .select('*, hobbies!inner(title, created_by)')
        .eq('hobbies.created_by', userId);
      setReceivedReviews(reviewsOnMe || []);
    }
    setLoading(false);
  };

  // --- ACTIONS (Upload/Update) ---
  const handleImageUpload = async (event) => {
    try {
      setUploadingImage(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Select an image.');
      const file = event.target.files[0];
      const fileName = `${session.user.id}-${Date.now()}.${file.name.split('.').pop()}`;
      
      const { error } = await supabase.storage.from('avatars').upload(fileName, file);
      if (error) throw error;
      
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile({ ...profile, avatar_url: data.publicUrl });
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: profile.full_name, bio: profile.bio, avatar_url: profile.avatar_url
    }).eq('id', session.user.id);
    if (password) await supabase.auth.updateUser({ password });
    setSaving(false);
    alert('Profile updated!');
    setPassword('');
  };

  // --- RENDER CONTENT ---
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Dashboard...</div>;

  const renderContent = () => {
    switch (activeTab) {
      // --- PROFILE ---
      case 'profile':
        return (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-orange-500"/>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-orange-500"><User size={40} /></div>
                  )}
                  {uploadingImage && <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"><Loader2 className="animate-spin text-white" /></div>}
                </div>
                <div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current.click()} disabled={uploadingImage} className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
                    <Camera size={16} /> {uploadingImage ? 'Uploading...' : 'Change Photo'}
                  </button>
                </div>
              </div>
              <div className="grid gap-4">
                <input value={profile.full_name || ''} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none" placeholder="Full Name" />
                <textarea value={profile.bio || ''} onChange={(e) => setProfile({...profile, bio: e.target.value})} rows="3" className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none" placeholder="Bio..." />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New Password (optional)" className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none" />
              </div>
              <button disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Changes
              </button>
            </form>
          </div>
        );

      // --- LEARNING: CURRENT LESSONS ---
      case 'current_lessons':
        const active = enrollments.filter(e => e.status === 'active');
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Current Lessons</h2>
            {active.length === 0 ? <p className="text-gray-500">No active enrollments.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(e => (
                  <div key={e.id} className="bg-neutral-900 border border-white/10 p-4 rounded-xl flex gap-4">
                    {e.hobbies?.image_url ? <img src={e.hobbies.image_url} className="w-16 h-16 rounded object-cover" /> : <div className="w-16 h-16 bg-neutral-800 rounded" />}
                    <div>
                      <h3 className="text-white font-bold">{e.hobbies?.title}</h3>
                      <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded mt-1 inline-block">In Progress</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // --- LEARNING: FINISHED LESSONS ---
      case 'finished_lessons':
        const finished = enrollments.filter(e => e.status === 'completed');
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Finished Lessons</h2>
            {finished.length === 0 ? <p className="text-gray-500">No completed lessons yet.</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {finished.map(e => (
                  <div key={e.id} className="bg-neutral-900 border border-white/10 p-4 rounded-xl flex gap-4 opacity-75">
                     {e.hobbies?.image_url ? <img src={e.hobbies.image_url} className="w-16 h-16 rounded object-cover" /> : <div className="w-16 h-16 bg-neutral-800 rounded" />}
                    <div>
                      <h3 className="text-white font-bold">{e.hobbies?.title}</h3>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // --- LEARNING: REVIEWS (Written by Me) ---
      case 'reviews_written':
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Reviews I Wrote</h2>
            {writtenReviews.length === 0 ? <p className="text-gray-500">You haven't reviewed any classes yet.</p> : (
              <div className="space-y-4">
                {writtenReviews.map(r => (
                  <div key={r.id} className="bg-neutral-900 border border-white/10 p-4 rounded-xl">
                    <div className="flex justify-between mb-1">
                      <h3 className="font-bold text-white">{r.hobbies?.title}</h3>
                      <div className="flex text-orange-500">{[...Array(5)].map((_,i) => <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"}/>)}</div>
                    </div>
                    <p className="text-gray-400 text-sm">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // --- TEACHING: CURRENT LISTINGS ---
      case 'listings':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Current Listings</h2>
              <Link to="/create-listing" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                <Plus size={16}/> New Listing
              </Link>
            </div>
            {approvedListings.length === 0 ? <p className="text-gray-500">No active listings.</p> : (
              <div className="grid gap-4">
                {approvedListings.map(h => (
                  <div key={h.id} className="bg-neutral-900 border border-green-500/30 p-4 rounded-xl flex gap-4">
                     {h.image_url && <img src={h.image_url} alt={h.title} className="w-20 h-20 rounded-lg object-cover" />}
                    <div>
                      <h3 className="text-white font-bold text-lg">{h.title}</h3>
                      <span className="inline-block mt-2 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded border border-green-500/20">Live</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // --- TEACHING: APPLICATIONS ---
      case 'applications':
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Listing Applications</h2>
            {pendingListings.length === 0 ? <p className="text-gray-500">No pending applications.</p> : (
              <div className="grid gap-4">
                {pendingListings.map(h => (
                  <div key={h.id} className="bg-neutral-900 border border-white/10 p-4 rounded-xl flex gap-4 opacity-80">
                     {h.image_url && <img src={h.image_url} alt={h.title} className="w-20 h-20 rounded-lg object-cover grayscale" />}
                    <div>
                      <h3 className="text-white font-bold text-lg">{h.title}</h3>
                      <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded border ${h.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {h.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      // --- TEACHING: MY REVIEWS (Received) ---
      case 'reviews_received':
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Student Reviews</h2>
            {receivedReviews.length === 0 ? <p className="text-gray-500">No reviews on your classes yet.</p> : (
              <div className="space-y-4">
                {receivedReviews.map(r => (
                  <div key={r.id} className="bg-neutral-900 border border-orange-500/20 p-4 rounded-xl">
                    <div className="flex justify-between mb-1">
                      <div>
                        <span className="text-xs text-orange-500 uppercase tracking-wide">Class:</span>
                        <h3 className="font-bold text-white inline ml-2">{r.hobbies?.title}</h3>
                      </div>
                      <div className="flex text-orange-500">{[...Array(5)].map((_,i) => <Star key={i} size={12} fill={i < r.rating ? "currentColor" : "none"}/>)}</div>
                    </div>
                    <p className="text-gray-300 italic text-sm">"{r.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
        
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 flex font-sans">
      <aside className="w-72 border-r border-white/10 hidden md:block min-h-screen p-6 overflow-y-auto max-h-[calc(100vh-80px)] fixed left-0 top-20 bg-black z-40">
        <div className="mb-8 px-4">
          <h1 className="text-xl font-bold text-orange-500">Tutor Portal</h1>
          <p className="text-xs text-gray-500">Learning & Teaching Hub</p>
        </div>
        
        <nav className="space-y-6">
          {/* Section 1: Personal */}
          <div className="space-y-1">
             <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
               <User size={18} /> Profile
             </button>
          </div>

          {/* Section 2: Learning */}
          <div>
             <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Learning</h3>
             <div className="space-y-1">
                <button onClick={() => setActiveTab('current_lessons')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'current_lessons' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <BookOpen size={18} /> Current Lessons
                </button>
                <button onClick={() => setActiveTab('finished_lessons')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'finished_lessons' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <CheckCircle size={18} /> Finished Lessons
                </button>
                <button onClick={() => setActiveTab('reviews_written')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reviews_written' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <MessageCircle size={18} /> Reviews
                </button>
             </div>
          </div>

          {/* Section 3: Teaching */}
          <div>
             <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">My Teaching</h3>
             <div className="space-y-1">
                <button onClick={() => setActiveTab('listings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'listings' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <List size={18} /> Current Listings
                </button>
                <button onClick={() => setActiveTab('applications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'applications' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <FileText size={18} /> Applications
                </button>
                <button onClick={() => setActiveTab('reviews_received')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reviews_received' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                  <Star size={18} /> My Reviews
                </button>
             </div>
          </div>
        </nav>
      </aside>
      
      {/* Content Area - offset by sidebar width */}
      <main className="flex-1 p-8 md:ml-72">
        {renderContent()}
      </main>
    </div>
  );
};

export default TutorDashboard;