import React, { useState, useEffect } from 'react';
import { X, Star, User, Loader2, CheckCircle, CreditCard } from 'lucide-react';
import { supabase } from '../supabaseClient';
import EnrollAuthPrompt from './EnrollAuthPrompt';

const HobbyModal = ({ isOpen, onClose, hobby, onOpenProfile }) => {
  const [step, setStep] = useState('details'); // 'details' | 'payment' | 'success'
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('details');
      supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }
  }, [isOpen]);

  const handleEnrollment = async () => {
    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    setLoading(true);
    const platformFee = 0.10; // 10%
    const tutorEarnings = hobby.price * (1 - platformFee);

    try {
      // 1. Create Enrollment Record for Student
      const { error: enrollErr } = await supabase
        .from('enrollments')
        .insert([{ 
          user_id: user.id, 
          hobby_id: hobby.id, 
          status: 'active' 
        }]);
      if (enrollErr) throw enrollErr;

      // 2. Transaction for Student (Full Price - Minus)
      const { error: studentTransErr } = await supabase
        .from('transactions')
        .insert([{
          profile_id: user.id,
          hobby_id: hobby.id,
          amount: hobby.price,
          plan_name: `Enrollment: ${hobby.title}`,
          type: 'payment'
        }]);
      if (studentTransErr) throw studentTransErr;

      // 3. Transaction for Tutor (Price - 10% - Plus)
      const { error: tutorTransErr } = await supabase
        .from('transactions')
        .insert([{
          profile_id: hobby.created_by, // The Tutor's ID
          hobby_id: hobby.id,
          amount: tutorEarnings,
          plan_name: `Student Enrollment: ${hobby.title}`,
          type: 'earning'
        }]);
      if (tutorTransErr) throw tutorTransErr;

      setStep('success');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !hobby) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-neutral-900 border border-white/10 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl transition-all">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 z-20 p-2 bg-black/40 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-all">
          <X size={24} />
        </button>

        {/* Prompt shown when user tries to enroll but is not signed in */}
        <EnrollAuthPrompt isOpen={showAuthPrompt} onClose={() => { setShowAuthPrompt(false); onClose(); }} />
        {/* STEP 1: HOBBY DETAILS */}
        {step === 'details' && (
          <div className="flex flex-col md:flex-row h-full max-h-[90vh] overflow-y-auto">
            <div className="w-full md:w-1/2 h-64 md:h-auto relative">
              <img src={hobby.image_url} alt={hobby.title} className="w-full h-full object-cover" />
            </div>
            <div className="w-full md:w-1/2 p-8 flex flex-col">
              <span className="text-[10px] font-black text-orange-500 uppercase bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 w-fit mb-4">{hobby.category}</span>
              <h2 className="text-3xl font-bold text-white mb-4">{hobby.title}</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 flex-grow">{hobby.description}</p>
              
              <div onClick={() => onOpenProfile(hobby.created_by)} className="group flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/50 cursor-pointer mb-6 transition-all">
                <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-orange-500"><User size={20} /></div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Instructor</p>
                  <p className="text-white font-bold text-sm group-hover:text-orange-500">{hobby.profiles?.full_name}</p>
                </div>
              </div>

              <button 
                onClick={() => setStep('payment')}
                className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-orange-600 hover:text-white transition-all flex justify-between px-8 items-center"
              >
                <span>Enroll Now</span>
                <span className="font-black">₱{hobby.price?.toLocaleString()}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FAKE PAYMENT POPUP */}
        {step === 'payment' && (
          <div className="p-12 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500">
              <CreditCard size={40} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Checkout</h2>
            <p className="text-gray-400 mb-8">Confirm your enrollment for <span className="text-white font-bold">{hobby.title}</span></p>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Course Price</span><span className="text-white font-bold">₱{hobby.price}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Service Fee</span><span className="text-green-500 font-bold">FREE</span></div>
              <div className="pt-3 border-t border-white/10 flex justify-between items-center"><span className="text-white font-bold">Total Amount</span><span className="text-2xl font-black text-white">₱{hobby.price}</span></div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep('details')} className="flex-1 py-4 border border-white/10 text-white rounded-2xl font-bold hover:bg-white/5 transition-all">Cancel</button>
              <button 
                onClick={handleEnrollment}
                disabled={loading}
                className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-bold hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
              >
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
            <p className="text-gray-400 mb-10 max-w-xs mx-auto">Registration successful. You can now access your lessons in the Student Dashboard.</p>
            <button 
              onClick={onClose}
              className="px-12 py-4 bg-white text-black font-bold rounded-2xl hover:bg-orange-600 hover:text-white transition-all"
            >
              Start Learning
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default HobbyModal;