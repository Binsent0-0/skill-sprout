import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { User, BookOpen, CheckCircle, Star, Save, Loader2, Camera } from 'lucide-react';

const StudentDashboard = () => {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [loading, setLoading] = useState(true);

  // Data States
  const [profile, setProfile] = useState({ full_name: '', bio: '', avatar_url: '' });
  const [enrollments, setEnrollments] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Form States
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false); // New state for image loading
  const fileInputRef = useRef(null); // Reference to hidden file input

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);

    if (session) {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(profileData || {});

      // Fetch Enrollments & Reviews (omitted for brevity, keep your existing logic here)
      // ...
    }
    setLoading(false);
  };

  // --- NEW: HANDLE IMAGE UPLOAD ---
  const handleImageUpload = async (event) => {
    try {
      setUploadingImage(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      // 3. Update Local State (Show preview immediately)
      setProfile({ ...profile, avatar_url: data.publicUrl });
      
    } catch (error) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- UPDATE PROFILE ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Update Profile Data (Includes the new avatar_url)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url, // Save the URL to DB
      })
      .eq('id', session.user.id);

    if (password) {
      const { error: passError } = await supabase.auth.updateUser({ password: password });
      if (passError) alert('Error updating password: ' + passError.message);
    }

    if (profileError) alert('Error updating profile: ' + profileError.message);
    else alert('Profile updated successfully!');
    
    setSaving(false);
    setPassword('');
  };

  // --- RENDER ---
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Dashboard...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              
              {/* --- AVATAR UPLOAD SECTION --- */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  {/* Image Preview */}
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-orange-500"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-orange-500">
                      <User size={40} />
                    </div>
                  )}
                  
                  {/* Loading Spinner Overlay */}
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>

                <div>
                  {/* Hidden Input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                    className="hidden"
                  />
                  
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()} // Trigger hidden input
                    disabled={uploadingImage}
                    className="text-sm bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <Camera size={16} /> 
                    {uploadingImage ? 'Uploading...' : 'Change Photo'}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">Recommended: Square JPG or PNG, max 2MB</p>
                </div>
              </div>

              {/* Inputs */}
              <div className="grid gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Full Name</label>
                  <input 
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Bio</label>
                  <textarea 
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    rows="3"
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                    placeholder="Tell us a little about yourself..."
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">New Password (leave blank to keep current)</label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-neutral-900 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <button disabled={saving || uploadingImage} className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                {saving ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                Save Changes
              </button>
            </form>
          </div>
        );

      case 'current':
        // ... (Keep existing code for Current Lessons)
        return <div>Current Lessons Content</div>;

      case 'finished':
        // ... (Keep existing code for Finished Lessons)
        return <div>Finished Lessons Content</div>;

      case 'reviews':
        // ... (Keep existing code for Reviews)
        return <div>Reviews Content</div>;
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 flex">
      {/* Sidebar (Same as before) */}
      <aside className="w-64 border-r border-white/10 hidden md:block min-h-screen p-6">
        <div className="mb-8 px-4">
          <h1 className="text-xl font-bold text-orange-500">Student Hub</h1>
          <p className="text-xs text-gray-500">Manage your learning</p>
        </div>
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <User size={20} /> Profile
          </button>
          <button onClick={() => setActiveTab('current')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'current' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <BookOpen size={20} /> Current Lessons
          </button>
          <button onClick={() => setActiveTab('finished')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'finished' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <CheckCircle size={20} /> Finished Lessons
          </button>
          <button onClick={() => setActiveTab('reviews')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reviews' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Star size={20} /> Reviews
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default StudentDashboard;