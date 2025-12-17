import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, Image as ImageIcon, Star, Plus, Trash2, Video, Film, UserPlus, Check } from 'lucide-react';

const CreateListing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // --- FORM STATE ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  
  // NEW: 1-on-1 State
  const [offer1on1, setOffer1on1] = useState(false);
  
  // Main Listing Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Lessons State
  const [lessons, setLessons] = useState([
    { id: 1, title: '', file: null, preview: null }
  ]);
  
  // UI & Tutor State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tutorRating, setTutorRating] = useState(0); // Default to 0

  // 1. Fetch Tutor Rating
  useEffect(() => {
    const fetchTutorData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('rating').eq('id', session.user.id).single();
        if (data) setTutorRating(data.rating || 0);
      }
    };
    fetchTutorData();
  }, []);

  // 2. Pricing Logic (Standard Course)
  const getPriceLimit = (rating) => {
    if (rating == null) return 200; 
    if (rating >= 5) return 1000;  
    if (rating >= 4) return 750;   
    if (rating >= 3) return 500;   
    if (rating >= 1) return 300;   
    return 200; 
  };
  const priceLimit = getPriceLimit(tutorRating);

  // 3. Pricing Logic (1-on-1 Automatic Calculation)
  const get1on1Price = (rating) => {
    if (rating >= 5) return 100;
    if (rating >= 3) return 50;
    return 25; // 0-2 Stars
  };
  const oneOnOnePrice = get1on1Price(tutorRating);

  // 4. Image Handling
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert("Image too big! Max 5MB.");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 5. Lesson Handling
  const addLesson = () => {
    setLessons([...lessons, { id: Date.now(), title: '', file: null, preview: null }]);
  };

  const removeLesson = (id) => {
    if (lessons.length === 1) return; 
    setLessons(lessons.filter(l => l.id !== id));
  };

  const handleLessonChange = (id, field, value) => {
    setLessons(lessons.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleLessonFile = (id, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) return alert("Video too big! Max 50MB.");
      const preview = URL.createObjectURL(file);
      setLessons(lessons.map(l => l.id === id ? { ...l, file: file, preview: preview } : l));
    }
  };

  // 6. Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in.");

      // A. Upload Main Image
      let finalImageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `covers/${session.user.id}-${Date.now()}.${fileExt}`;
        const { error: imgErr } = await supabase.storage.from('hobbies').upload(fileName, imageFile);
        if (imgErr) throw imgErr;
        const { data } = supabase.storage.from('hobbies').getPublicUrl(fileName);
        finalImageUrl = data.publicUrl;
      }

      // B. Upload Lesson Videos
      const uploadedLessons = await Promise.all(lessons.map(async (lesson, index) => {
        let videoUrl = null;
        if (lesson.file) {
          const fileExt = lesson.file.name.split('.').pop();
          const fileName = `lessons/${session.user.id}-${Date.now()}-${index}.${fileExt}`;
          const { error: vidErr } = await supabase.storage.from('hobbies').upload(fileName, lesson.file);
          if (vidErr) throw vidErr;
          const { data } = supabase.storage.from('hobbies').getPublicUrl(fileName);
          videoUrl = data.publicUrl;
        }
        return {
          title: lesson.title || `Lesson ${index + 1}`,
          url: videoUrl,
          duration: "Pending"
        };
      }));

      // C. Insert into Database
      const { error: dbError } = await supabase
        .from('hobbies')
        .insert([{
          title,
          description,
          category: tags,
          image_url: finalImageUrl,
          created_by: session.user.id,
          price: parseFloat(price),
          status: 'pending',
          lessons: uploadedLessons,
          // NEW FIELDS
          allow_1on1: offer1on1,
          price_1on1: offer1on1 ? oneOnOnePrice : null
        }]);

      if (dbError) throw dbError;
      navigate('/tutor-dashboard');

    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-12 px-4">
      <div className="max-w-3xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create Tutor Listing</h1>
          <div className="flex items-center gap-2 text-orange-500 bg-orange-500/10 w-fit px-3 py-1 rounded-full border border-orange-500/20">
            <Star size={14} fill="currentColor" />
            <span className="text-sm font-medium">Tutor Rating: {tutorRating ? `${tutorRating}/5` : 'New Tutor'}</span>
          </div>
        </div>

        {error && <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* --- Image Upload --- */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Listing Cover Image</label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${imagePreview ? 'border-orange-500/50' : 'border-white/10 hover:border-orange-500/50 hover:bg-white/5'}`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium flex items-center gap-2"><UploadCloud size={20} /> Change Image</p>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400"><ImageIcon size={32} /></div>
                  <p className="text-white font-medium mb-1">Click to upload cover</p>
                  <p className="text-sm text-gray-500">MAX. 5MB</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>
          </div>

          {/* --- Basic Info --- */}
          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Listing Name</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Advanced Piano Lessons" className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Category</label>
                <select required value={tags} onChange={(e) => setTags(e.target.value)} className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all">
                  <option value="" disabled>Select a category</option>
                  {['Gaming', 'Coding', 'Music', 'Cooking', 'Languages', 'Design', 'Business', 'Fitness'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Standard Course Price (Limit: ₱{priceLimit})</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                  <input required type="number" value={price} onChange={(e) => { const val = e.target.value; if (val === '' || (parseFloat(val) <= priceLimit)) setPrice(val); }} placeholder={`Max ₱${priceLimit}`} className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 pl-10 text-white focus:border-orange-500 outline-none transition-all"/>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Description</label>
              <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows="4" placeholder="Describe your teaching style..." className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all resize-none"/>
            </div>
          </div>

          {/* --- NEW SECTION: 1-ON-1 OFFERING --- */}
          <div className="p-6 bg-gradient-to-br from-neutral-900 to-black border border-white/10 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Offer 1-on-1 Coaching?</h3>
                  <p className="text-sm text-gray-400">Earn extra by offering personal video calls.</p>
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={() => setOffer1on1(!offer1on1)}
                className={`relative w-14 h-8 rounded-full transition-colors ${offer1on1 ? 'bg-orange-500' : 'bg-neutral-700'}`}
              >
                <div className={`absolute top-1 left-1 bg-white w-6 h-6 rounded-full transition-transform ${offer1on1 ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            {offer1on1 && (
              <div className="animate-in slide-in-from-top-2 fade-in mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
                  <div>
                    <p className="text-orange-500 font-bold text-sm">Automated Pricing Applied</p>
                    <p className="text-xs text-gray-400 mt-1">Based on your {tutorRating} Star rating</p>
                  </div>
                  <div className="text-right">
                     <span className="text-2xl font-black text-white">₱{oneOnOnePrice}</span>
                     <span className="text-xs text-gray-500 block">per session</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* --- COURSE CONTENT --- */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Course Content</h3>
                <button type="button" onClick={addLesson} className="text-orange-500 text-sm font-bold flex items-center gap-1 hover:text-orange-400"><Plus size={16} /> Add Lesson</button>
            </div>

            <div className="space-y-4">
                {lessons.map((lesson, index) => (
                    <div key={lesson.id} className="bg-neutral-900 border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="flex-1 space-y-1">
                                <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Lesson Title</label>
                                <input 
                                    type="text" 
                                    value={lesson.title} 
                                    onChange={(e) => handleLessonChange(lesson.id, 'title', e.target.value)}
                                    placeholder={`Lesson ${index + 1}: Introduction`} 
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-orange-500 outline-none"
                                />
                            </div>
                            {lessons.length > 1 && (
                                <button type="button" onClick={() => removeLesson(lesson.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition mt-5">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                        
                        {/* Video Input */}
                        <div className="relative">
                            {!lesson.file ? (
                                <div className="w-full h-24 border border-dashed border-white/10 rounded-lg bg-black/30 hover:bg-black/50 transition flex flex-col items-center justify-center cursor-pointer group">
                                    <input type="file" accept="video/*" onChange={(e) => handleLessonFile(lesson.id, e)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <Video className="text-gray-500 group-hover:text-orange-500 mb-1" size={20} />
                                    <p className="text-xs text-gray-500 group-hover:text-gray-300">Upload Video Lesson</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                                    <Film className="text-green-500" size={20} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-white truncate">{lesson.file.name}</p>
                                        <p className="text-[10px] text-green-400">Ready for upload</p>
                                    </div>
                                    <button type="button" onClick={() => setLessons(lessons.map(l => l.id === lesson.id ? { ...l, file: null, preview: null } : l))} className="text-gray-400 hover:text-white"><Trash2 size={16} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-white/10">
            <button type="button" onClick={() => navigate('/tutor-dashboard')} className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-bold shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="animate-spin" /> Uploading...</> : 'Publish Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateListing;