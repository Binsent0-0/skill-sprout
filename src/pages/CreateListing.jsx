import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Loader2, Image as ImageIcon, Star } from 'lucide-react';

const CreateListing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // UI & Tutor State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tutorRating, setTutorRating] = useState(null);

  // 1. Fetch Tutor Rating from Profiles
  useEffect(() => {
    const fetchTutorData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('rating')
          .eq('id', session.user.id)
          .single();
        
        if (data) {
          setTutorRating(data.rating);
        }
      }
    };
    fetchTutorData();
  }, []);

  // 2. Pricing Tier Logic based on Tutor Rating
  const getPriceLimit = (rating) => {
    if (rating === null || rating === undefined) return 200; // No ratings up to 200
    if (rating >= 5) return 1000;  // 5 stars up to 1,000
    if (rating >= 4) return 750;   // 4 stars up to 750
    if (rating >= 3) return 500;   // 3 stars up to 500
    if (rating >= 1) return 300;   // 1-2 stars up to 300
    return 200; 
  };

  const priceLimit = getPriceLimit(tutorRating);

  // 3. Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too big! Max 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // 4. Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in.");

      let finalImageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('hobbies')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('hobbies').getPublicUrl(fileName);
        finalImageUrl = data.publicUrl;
      }

      const { error: dbError } = await supabase
        .from('hobbies')
        .insert([{
          title,
          description,
          category: tags,
          image_url: finalImageUrl,
          created_by: session.user.id,
          price: parseFloat(price),
          status: 'pending'
        }]);

      if (dbError) throw dbError;
      navigate('/tutor-dashboard');

    } catch (err) {
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
            <span className="text-sm font-medium">
              Tutor Rating: {tutorRating ? `${tutorRating}/5` : 'New Tutor'}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Listing Image</label>
            <div 
              onClick={() => fileInputRef.current.click()}
              className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer transition-all relative overflow-hidden group ${
                imagePreview ? 'border-orange-500/50' : 'border-white/10 hover:border-orange-500/50 hover:bg-white/5'
              }`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white font-medium flex items-center gap-2">
                      <UploadCloud size={20} /> Change Image
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-white font-medium mb-1">Click to upload image</p>
                  <p className="text-sm text-gray-500">MAX. 5MB (JPG, PNG)</p>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
            </div>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Listing Name</label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Advanced Piano Lessons" 
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Category Tags</label>
                <input 
                  required
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Music, Theory, Piano" 
                  className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all"
                />
              </div>

              {/* Tutor-Based Price Input */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Price (Limit: ₱{priceLimit})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₱</span>
                  <input 
                    required
                    type="number"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (parseFloat(val) <= priceLimit)) {
                        setPrice(val);
                      }
                    }}
                    placeholder={`Max ₱${priceLimit}`}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 pl-10 text-white focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Pricing Tier: {tutorRating ? `${tutorRating} Star Tutor` : 'No Rating Tier'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Lesson Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                placeholder="Describe your teaching style and what the student needs..." 
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={() => navigate('/tutor-dashboard')}
              className="flex-1 py-4 rounded-xl border border-white/10 text-white font-bold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-bold shadow-lg shadow-orange-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;