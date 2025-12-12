import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  User, List, FileText, Camera, Save, Loader2, Plus, 
  BookOpen, CheckCircle, MessageCircle, Star, MoreVertical, Trash2, X, Clock, 
  TrendingUp, TrendingDown, History
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TutorDashboard = () => {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState('profile'); 
  const [loading, setLoading] = useState(true);

  // --- DATA STATES ---
  const [profile, setProfile] = useState({ full_name: '', bio: '', avatar_url: '' });
  const [enrollments, setEnrollments] = useState([]); 
  const [writtenReviews, setWrittenReviews] = useState([]); 
  const [approvedListings, setApprovedListings] = useState([]); 
  const [pendingListings, setPendingListings] = useState([]); 
  const [receivedReviews, setReceivedReviews] = useState([]); 
  const [transactions, setTransactions] = useState([]); 

  // --- UI STATES ---
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const fileInputRef = useRef(null);

  const plans = [
    { id: '3days', name: '3 Days Boost', price: 50, days: 3 },
    { id: '1week', name: '1 Week Boost', price: 100, days: 7 },
    { id: '1month', name: '1 Month Professional', price: 300, days: 30 },
  ];

  useEffect(() => {
    getInitialData();
  }, []);

  const getInitialData = async () => {
    setLoading(true);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);

    if (currentSession) {
      const userId = currentSession.user.id;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(profileData || {});

      const { data: enrollmentData } = await supabase.from('enrollments').select('*, hobbies(*)').eq('user_id', userId);
      setEnrollments(enrollmentData || []);

      const { data: myWrittenReviews } = await supabase.from('reviews').select('*, hobbies(title)').eq('user_id', userId);
      setWrittenReviews(myWrittenReviews || []);

      const { data: hobbies } = await supabase.from('hobbies').select('*').eq('created_by', userId);
      if (hobbies) {
        setApprovedListings(hobbies.filter(h => h.status === 'approved'));
        setPendingListings(hobbies.filter(h => h.status !== 'approved'));
      }

      const { data: reviewsOnMe } = await supabase.from('reviews').select('*, hobbies!inner(title, created_by)').eq('hobbies.created_by', userId);
      setReceivedReviews(reviewsOnMe || []);

      const { data: transData, error: transError } = await supabase.from('transactions').select('*').eq('profile_id', userId).order('created_at', { ascending: false });
      if (transError) {
        console.error('Error fetching transactions:', transError);
      } else {
        console.log('Fetched transactions for userId:', userId, transData);
        setTransactions(transData || []);
      }
    }
    setLoading(false);
  };

  const getTimeLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate) - new Date();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d ${hours}h left`;
  };

  const handleFakePayment = async (plan) => {
    setProcessingPayment(true);
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + plan.days);

    try {
      // 1. Insert Transaction RECORD (Including Price and Type)
      const { error: transError } = await supabase.from('transactions').insert([{
        profile_id: session.user.id,
        hobby_id: showFeatureModal.id,
        amount: plan.price, // This adds the price to your transaction record
        plan_name: plan.name,
        type: 'payment' // Minus money
      }]);

      if (transError) throw transError;

      // 2. Update the Listing to be Featured
      const { error: hobbyError } = await supabase.from('hobbies').update({ 
        featured: true, 
        featured_until: expiryDate.toISOString() 
      }).eq('id', showFeatureModal.id);

      if (hobbyError) throw hobbyError;

      setShowFeatureModal(null);
      getInitialData();
      setActiveTab('transactions');
      alert(`Success! ₱${plan.price} paid. Listing featured until ${expiryDate.toLocaleDateString()}`);
    } catch (err) { 
      alert(err.message); 
    } finally { 
      setProcessingPayment(false); 
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  {profile.avatar_url ? <img src={profile.avatar_url} className="w-24 h-24 rounded-full object-cover border-2 border-orange-500" /> : <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-orange-500"><User size={32} /></div>}
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={18} className="text-white" /></div>
                </div>
                <div>
                   <h3 className="text-white font-bold text-lg">{profile.full_name || 'Vince Rufino'}</h3>
                   <p className="text-gray-500 text-sm">Tutor ID: {session?.user.id.slice(0,8)}</p>
                </div>
              </div>
              <input value={profile.full_name} onChange={(e) => setProfile({...profile, full_name: e.target.value})} className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none" placeholder="Full Name" />
              <textarea value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} rows="4" className="w-full bg-neutral-900 border border-white/10 rounded-xl p-4 text-white focus:border-orange-500 outline-none" placeholder="Tell students about your skills..." />
              <button className="bg-orange-600 px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition-all">Save Changes</button>
            </div>
          </div>
        );

      case 'current_lessons':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6">Learning Dashboard</h2>
            {enrollments.length === 0 ? <p className="text-gray-500 italic">You aren't enrolled in any classes yet.</p> : enrollments.map(e => (
              <div key={e.id} className="bg-neutral-900 p-5 rounded-2xl border border-white/5 flex gap-4 items-center">
                <img src={e.hobbies?.image_url} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1">
                  <h3 className="text-white font-bold">{e.hobbies?.title}</h3>
                  <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded border border-blue-500/20 uppercase font-bold tracking-tighter">Student</span>
                </div>
                <button className="text-sm bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors">Enter Classroom</button>
              </div>
            ))}
          </div>
        );

      case 'listings':
        return (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">My Teaching Listings</h2>
              <Link to="/create-listing" className="bg-orange-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-bold shadow-lg shadow-orange-900/20 hover:scale-105 transition-transform"><Plus size={16}/> New Listing</Link>
            </div>
            <div className="grid gap-4">
              {approvedListings.map(h => (
                <div key={h.id} className={`bg-neutral-900 border p-5 rounded-2xl flex items-center gap-6 transition-all ${h.featured ? 'border-yellow-500/40 bg-yellow-500/[0.02]' : 'border-white/5'}`}>
                  <img src={h.image_url} className="w-20 h-20 rounded-xl object-cover" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-lg">{h.title}</h3>
                      {h.featured && <Star size={16} className="text-yellow-500 fill-yellow-500" />}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20 uppercase font-bold tracking-wider">Active</span>
                      {h.featured && <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 flex items-center gap-1 font-bold"><Clock size={12} /> {getTimeLeft(h.featured_until)}</span>}
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors"><MoreVertical size={24} /></button>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-800 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible z-50 transition-all transform origin-top-right scale-95 group-hover:scale-100">
                      <button onClick={() => setShowFeatureModal(h)} className="w-full text-left px-4 py-3 text-sm text-yellow-500 hover:bg-yellow-500/10 flex items-center gap-2"><Star size={14} /> {h.featured ? 'Extend Boost' : 'Promote Listing'}</button>
                      <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5 transition-colors"><Trash2 size={14} /> Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {approvedListings.length === 0 && <p className="text-gray-500 italic p-10 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">You haven't created any approved listings yet.</p>}
            </div>
          </div>
        );

      case 'reviews_received':
        return (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Teaching Feedback</h2>
            {receivedReviews.length === 0 ? <p className="text-gray-500 italic">No students have left reviews yet.</p> : (
              receivedReviews.map(r => (
                <div key={r.id} className="bg-neutral-900 border border-orange-500/10 p-5 rounded-2xl">
                  <div className="flex justify-between mb-2">
                    <div>
                      <span className="text-[10px] text-orange-500 font-bold uppercase tracking-widest block mb-1">Lesson</span>
                      <h4 className="text-white font-bold">{r.hobbies?.title}</h4>
                    </div>
                    <div className="flex text-yellow-500">{[...Array(5)].map((_, i) => <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />)}</div>
                  </div>
                  <p className="text-gray-300 italic text-sm border-l-2 border-white/10 pl-4 py-1">"{r.comment}"</p>
                </div>
              ))
            )}
          </div>
        );

      case 'transactions':
        return (
          <div className="animate-in fade-in">
            <h2 className="text-2xl font-bold text-white mb-6">Wallet & History</h2>
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest">
                  <tr>
                    <th className="p-4">Activity</th>
                    <th className="p-4">Details</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {t.type === 'earning' ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-500" />}
                          <span className={`text-white font-medium capitalize ${t.type === 'payment' ? 'text-red-400' : 'text-green-400'}`}>{t.type}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-400 text-sm">{t.plan_name}</td>
                      <td className="p-4 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className={`p-4 text-right font-black ${t.type === 'earning' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'earning' ? '+' : '-'} ₱{t.amount}
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && <tr><td colSpan="4" className="p-20 text-center text-gray-500 italic">Your transaction history is empty.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 flex">
      {/* Sidebar Navigation */}
      <aside className="w-72 border-r border-white/10 hidden md:block min-h-screen p-6 fixed left-0 top-20 bg-black z-40">
        <div className="mb-8 px-4"><h1 className="text-xl font-bold text-orange-500 tracking-tighter">SkillSprout Hub</h1><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tutor Management</p></div>
        <nav className="space-y-6">
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><User size={18}/> Profile</button>
          
          <div>
            <h3 className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Student View</h3>
            <div className="space-y-1">
              <button onClick={() => setActiveTab('current_lessons')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'current_lessons' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><BookOpen size={18}/> My Lessons</button>
            </div>
          </div>

          <div>
            <h3 className="px-4 text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-2">Teaching View</h3>
            <div className="space-y-1">
              <button onClick={() => setActiveTab('listings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'listings' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><List size={18}/> My Listings</button>
              <button onClick={() => setActiveTab('reviews_received')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reviews_received' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><MessageCircle size={18}/> My Reviews</button>
              <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'transactions' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><History size={18}/> Transactions</button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 md:ml-72 bg-neutral-950/20">{renderContent()}</main>

      {/* Promotion/Featured Modal */}
      {showFeatureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl w-full max-w-md p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-orange-500/10 blur-[60px] pointer-events-none" />
            <button onClick={() => setShowFeatureModal(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500"><Star size={20} fill="currentColor" /></div>
               <h2 className="text-2xl font-bold text-white">Promote Course</h2>
            </div>
            <p className="text-sm text-gray-400 mb-8">Move your listing to the top of the explore page.</p>
            <div className="space-y-4">
              {plans.map(plan => (
                <button 
                  key={plan.id} 
                  disabled={processingPayment}
                  onClick={() => handleFakePayment(plan)} 
                  className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center hover:border-orange-500 group transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="text-left">
                    <p className="font-bold text-white group-hover:text-orange-500 transition-colors text-lg">{plan.name}</p>
                    <p className="text-xs text-gray-500">{plan.days} days visibility</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">₱{plan.price}</p>
                    <p className="text-[10px] text-orange-500 font-bold uppercase tracking-tighter">Pay Now</p>
                  </div>
                </button>
              ))}
            </div>
            {processingPayment && <div className="mt-6 flex items-center justify-center gap-3 text-orange-500"><Loader2 className="animate-spin" size={20} /> <span className="font-bold text-sm">Processing...</span></div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorDashboard;