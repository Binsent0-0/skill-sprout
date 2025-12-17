import React, { useState, useEffect } from 'react';
import { 
  X, Star, User, Loader2, CheckCircle, CreditCard, 
  Lock, PlayCircle, Video, BookOpen 
} from 'lucide-react';
import { supabase } from '../supabaseClient';
import EnrollAuthPrompt from './EnrollAuthPrompt';

const HobbyModal = ({ isOpen, onClose, hobby, onOpenProfile }) => {
  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'success'
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [reviews, setReviews] = useState([]); 
  
  const [bookingType, setBookingType] = useState('course'); // 'course' | '1on1'

  // --- PRICE CALCULATION LOGIC ---
  const basePrice = hobby ? hobby.price : 0;
  const total1on1Price = hobby ? (hobby.price + (hobby.price_1on1 || 0)) : 0;

  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setBookingType('course');
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
      fetchReviews(); 
    }
  }, [isOpen, hobby]);

  const fetchReviews = async () => {
    if (!hobby?.id) return;

    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        rating,
        comment,
        created_at,
        profiles!user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('hobby_id', hobby.id)
      .not('rating', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error.message);
    } else {
      console.log("Reviews fetched successfully:", data);
      setReviews(data || []);
    }
  };

  const handleEnrollment = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    setLoading(true);
    const amountToCharge = bookingType === 'course' ? basePrice : total1on1Price;
    const planName = bookingType === 'course' 
      ? `Enrollment: ${hobby.title}` 
      : `1-on-1 Coaching (Includes Course): ${hobby.title}`;

    const platformFee = 0.10; 
    const tutorEarnings = amountToCharge * (1 - platformFee);

    try {
      const { error: enrollErr } = await supabase
        .from('enrollments')
        .insert([{ 
          user_id: user.id, 
          hobby_id: hobby.id, 
          status: 'active',
          "1on1_enabled": bookingType === '1on1' 
        }]);
      
      if (enrollErr) throw enrollErr;

      const { error: studentTransErr } = await supabase
        .from('transactions')
        .insert([{
          profile_id: user.id,
          hobby_id: hobby.id,
          amount: amountToCharge,
          plan_name: planName,
          type: 'payment'
        }]);
      if (studentTransErr) throw studentTransErr;

      const { error: tutorTransErr } = await supabase
        .from('transactions')
        .insert([{
          profile_id: hobby.created_by,
          hobby_id: hobby.id,
          amount: tutorEarnings,
          plan_name: `Student Payment: ${planName}`,
          type: 'earning'
        }]);
      if (tutorTransErr) throw tutorTransErr;

      setStep('success');
    } catch (err) {
      console.error("Enrollment Error:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !hobby) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-neutral-900 border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl transition-all">
        
        <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 bg-black/40 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all">
          <X size={24} />
        </button>

        <EnrollAuthPrompt isOpen={showAuthPrompt} onClose={() => { setShowAuthPrompt(false); onClose(); }} />
        
        {step === 'details' && (
          <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
            
            {/* LEFT SIDE: Image */}
            <div className="w-full md:w-5/12 h-64 md:h-auto relative shrink-0">
              <img src={hobby.image_url} alt={hobby.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent md:bg-gradient-to-r" />
            </div>

            {/* RIGHT SIDE: Content */}
            <div className="w-full md:w-7/12 flex flex-col overflow-hidden">
              <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                
                <span className="text-[10px] font-black text-orange-500 uppercase bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 w-fit mb-4 inline-block">{hobby.category}</span>
                <h2 className="text-3xl font-bold text-white mb-4">{hobby.title}</h2>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">{hobby.description}</p>
                
                {/* INSTRUCTOR */}
                <div onClick={() => onOpenProfile(hobby.created_by)} className="group flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/50 cursor-pointer transition-all mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-orange-500"><User size={20} /></div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">Instructor</p>
                      <p className="text-white font-bold text-sm group-hover:text-orange-500">{hobby.profiles?.full_name}</p>
                    </div>
                  </div>
                  {/* Instructor Global Rating Badge */}
                  <div className="flex items-center gap-1 bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                    <Star size={14} className="text-orange-500 fill-orange-500" />
                    <span className="text-white font-bold text-sm">{hobby.profiles?.rating || '0.0'}</span>
                  </div>
                </div>

                {/* PLAN SELECTION */}
                <h3 className="text-white font-bold text-lg mb-4">Choose Learning Style</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    <div 
                        onClick={() => setBookingType('course')}
                        className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                            bookingType === 'course' ? 'bg-orange-500/10 border-orange-500' : 'bg-white/5 border-white/5 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <BookOpen size={20} className={bookingType === 'course' ? 'text-orange-500' : 'text-gray-500'} />
                            {bookingType === 'course' && <div className="bg-orange-500 rounded-full p-1"><CheckCircle size={12} className="text-white" /></div>}
                        </div>
                        <p className="text-white font-bold text-sm">Self-Paced Course</p>
                        <p className="text-white font-black mt-3">₱{basePrice}</p>
                    </div>

                    {hobby.allow_1on1 ? (
                        <div 
                            onClick={() => setBookingType('1on1')}
                            className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                                bookingType === '1on1' ? 'bg-orange-500/10 border-orange-500' : 'bg-white/5 border-white/5 hover:bg-white/10'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Video size={20} className={bookingType === '1on1' ? 'text-orange-500' : 'text-gray-500'} />
                                {bookingType === '1on1' && <div className="bg-orange-500 rounded-full p-1"><CheckCircle size={12} className="text-white" /></div>}
                            </div>
                            <p className="text-white font-bold text-sm">1-on-1 Coaching</p>
                            <p className="text-white font-black mt-3">₱{total1on1Price}</p>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl border border-white/5 bg-white/5 opacity-50 cursor-not-allowed">
                            <Video size={20} className="text-gray-600 mb-2" />
                            <p className="text-gray-400 font-bold text-sm">1-on-1 Coaching</p>
                            <p className="text-gray-600 text-[10px] mt-1">Not available</p>
                        </div>
                    )}
                </div>

                {/* LESSONS LIST */}
                <div className="mb-4">
                  <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      Course Syllabus <span className="text-xs font-normal text-gray-500">({hobby.lessons?.length || 0})</span>
                  </h3>
                   <div className="space-y-3">
                    {hobby.lessons && hobby.lessons.length > 0 ? (
                      hobby.lessons.map((lesson, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 opacity-75">
                          <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-neutral-800 flex items-center justify-center">
                             <Lock size={16} className="text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-sm truncate">{lesson.title}</h4>
                            <p className="text-[10px] text-orange-500/80 font-medium">Enroll to unlock</p>
                          </div>
                        </div>
                      ))
                    ) : <div className="text-gray-500 italic text-sm">No lessons yet.</div>}
                  </div>
                </div>

                {/* REVIEWS SECTION */}
                <div className="mt-12 pt-8 border-t border-white/5">
                  <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                    Student Reviews <span className="text-xs font-normal text-gray-500">({reviews.length})</span>
                  </h3>
                  <div className="space-y-4">
                    {reviews.length > 0 ? (
                      reviews.map((rev, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-[10px] text-orange-500 font-bold">
                                {rev.profiles?.full_name?.charAt(0) || 'U'}
                              </div>
                              <span className="text-sm font-medium text-white">{rev.profiles?.full_name || 'Anonymous Student'}</span>
                            </div>
                            <div className="flex items-center gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={10} className={i < rev.rating ? "text-orange-500 fill-orange-500" : "text-neutral-700"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-gray-400 text-sm leading-relaxed italic">"{rev.comment || 'No comment provided.'}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <p className="text-gray-500 text-sm italic">No reviews yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Bottom Enroll Button */}
              <div className="p-6 border-t border-white/5 bg-neutral-900 z-10">
                <button 
                  onClick={() => setStep('payment')}
                  className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-orange-600 hover:text-white transition-all flex justify-between px-8 items-center shadow-lg"
                >
                  <span>{bookingType === '1on1' ? 'Book Session' : 'Enroll Now'}</span>
                  <span className="font-black">₱{(bookingType === 'course' ? basePrice : total1on1Price)?.toLocaleString()}</span>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT */}
        {step === 'payment' && (
          <div className="p-12 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
              <CreditCard size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Checkout</h2>
            <p className="text-gray-400 mb-8">Confirm your {bookingType === '1on1' ? 'session booking' : 'enrollment'} for <span className="text-white font-bold">{hobby.title}</span></p>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-3 max-w-sm mx-auto">
              <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Item</span>
                  <span className="text-white font-bold">{bookingType === '1on1' ? '1-on-1 Session' : 'Course Access'}</span>
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                  <span className="text-white font-bold">Total Amount</span>
                  <span className="text-2xl font-black text-white">₱{bookingType === 'course' ? basePrice : total1on1Price}</span>
              </div>
            </div>
            <div className="flex gap-4 max-w-sm mx-auto">
              <button onClick={() => setStep('details')} className="flex-1 py-4 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Cancel</button>
              <button onClick={handleEnrollment} disabled={loading} className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin" /> : "Confirm & Pay"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'success' && (
          <div className="p-16 text-center animate-in fade-in duration-500">
            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500 border-4 border-green-500/20">
              <CheckCircle size={48} />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">You're In!</h2>
            <p className="text-gray-400 mb-10 max-w-xs mx-auto">
                {bookingType === '1on1' ? "Session booked successfully. The tutor will contact you shortly." : "Registration successful. You can now access your lessons."}
            </p>
            <button onClick={onClose} className="px-12 py-4 bg-white text-black font-bold rounded-2xl hover:bg-orange-600 hover:text-white transition-all">Go to Dashboard</button>
          </div>
        )}

      </div>
    </div>
  );
};

export default HobbyModal;