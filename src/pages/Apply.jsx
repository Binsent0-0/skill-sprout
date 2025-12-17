import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Send, CheckCircle, Loader2, Star, 
  UploadCloud, FileText, X, Film, Image as ImageIcon 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Apply = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [existingApp, setExistingApp] = useState(null);
  
  // New state for the file
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [formData, setFormData] = useState({
    full_name: '',
    category: 'Gaming',
    bio: '',
    experience: ''
  });

  useEffect(() => {
    checkStatus();
    // Cleanup preview URL on unmount
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/'); 
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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Optional: Check file size (e.g., limit to 50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      alert("File is too large. Please upload a file smaller than 50MB.");
      return;
    }

    setFile(selectedFile);
    
    // Create local preview
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const removeFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let uploadedFileUrl = null;

      // 1. Upload File if selected
      if (file) {
        const fileExt = file.name.split('.').pop();
        // Create a unique file path: user_id/timestamp.ext
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        // UPLOAD TO 'credentials' BUCKET
        const { error: uploadError } = await supabase.storage
          .from('credentials') // Make sure this bucket exists in Supabase
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
          .from('credentials')
          .getPublicUrl(filePath);
          
        uploadedFileUrl = publicUrl;
      }

      // 2. Insert Application Data
      const { error } = await supabase.from('tutor_applications').insert([{
        user_id: user.id,
        ...formData,
        // Assuming your table has a column for this, e.g., 'credentials_url' or 'attachment_url'
        credentials_url: uploadedFileUrl 
      }]);

      if (error) throw error;
      await checkStatus(); 
    } catch (err) {
      alert("Error: " + err.message);
      console.error(err);
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
      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-start">
        
        <div className="sticky top-32">
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

            {/* --- NEW FILE UPLOAD SECTION --- */}
            <div>
              <label className="text-[10px] uppercase font-bold text-gray-500 mb-2 block tracking-widest">
                Credentials / Introduction (Image or Video)
              </label>
              
              {!file ? (
                <div className="relative w-full h-32 border-2 border-dashed border-white/10 rounded-xl bg-black/30 hover:bg-black/50 transition flex flex-col items-center justify-center text-gray-500 hover:text-orange-500 group cursor-pointer">
                   <input 
                      type="file" 
                      accept="image/*,video/*"
                      onChange={handleFileChange} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                   <UploadCloud className="mb-2 group-hover:scale-110 transition-transform" />
                   <p className="text-xs font-medium">Click or Drag to upload credentials</p>
                   <p className="text-[10px] text-gray-600 mt-1">Supports Images & Videos (Max 50MB)</p>
                </div>
              ) : (
                <div className="w-full bg-black/50 border border-white/10 rounded-xl p-3 flex items-center gap-4 relative">
                    <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {file.type.startsWith('image') ? (
                         <img src={previewUrl} className="w-full h-full object-cover" alt="preview" />
                      ) : file.type.startsWith('video') ? (
                         <Film className="text-orange-500" size={20} />
                      ) : (
                         <FileText className="text-orange-500" size={20} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button type="button" onClick={removeFile} className="p-2 hover:bg-white/10 rounded-full text-gray-500 hover:text-red-500 transition">
                        <X size={18} />
                    </button>
                </div>
              )}
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