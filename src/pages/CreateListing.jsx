import React, { useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';

const CreateListing = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState(''); // Mapping this to 'category' in DB
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Handle Image Selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size too big! Max 5MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file)); // Show preview immediately
    }
  };

  // 2. Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in.");

      let finalImageUrl = null;

      // A. Upload Image (if selected)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('hobbies')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Get the Public URL
        const { data } = supabase.storage.from('hobbies').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }

      // B. Insert Data into Database
      const { error: dbError } = await supabase
        .from('hobbies')
        .insert([
          {
            title: title,
            description: description,
            category: tags, // Saving tags as the category
            image_url: finalImageUrl,
            created_by: session.user.id,
            status: 'pending' // Default status
          }
        ]);

      if (dbError) throw dbError;

      // C. Success! Redirect to dashboard
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
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Create a New Listing</h1>
          <p className="text-gray-400">Share your skill with the world. Your listing will be reviewed before going live.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. Image Upload Area */}
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
                  <p className="text-sm text-gray-500">SVG, PNG, JPG or GIF (MAX. 5MB)</p>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageSelect}
              />
            </div>
          </div>

          {/* 2. Basic Info */}
          <div className="grid gap-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Name of Listing</label>
              <input 
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Guitar for Beginners" 
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600"
              />
            </div>

            {/* Tags / Category */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Tags / Category</label>
              <input 
                required
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Music, Instrument, Acoustic" 
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600"
              />
              <p className="text-xs text-gray-500">Separate tags with commas</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Short Description</label>
              <textarea 
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="5"
                placeholder="Describe what students will learn..." 
                className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all placeholder:text-gray-600 resize-none"
              />
            </div>

          </div>

          {/* 3. Actions */}
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
              className="flex-[2] py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-bold shadow-lg shadow-orange-900/20 transform active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Submit Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreateListing;