import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Lock, Users, FileText, LogOut, 
  MoreVertical, Edit, Trash2, X, Save, AlertTriangle,
  CheckCircle, XCircle, Star, Clock, Loader2, History, TrendingUp, TrendingDown
} from 'lucide-react';

const AdminDashboard = () => {
  // --- STATES ---
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Data States
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]); 
  const [pendingPosts, setPendingPosts] = useState([]); 
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); 
  
  // Modal & Action States
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [editingUser, setEditingUser] = useState(null); 
  const [deletingUser, setDeletingUser] = useState(null); 
  
  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('student');

  // --- LOGIC ---

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (pin === '0000') {
      setIsAuthenticated(true);
      setError(false);
      fetchAllData(); 
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 1000);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    
    // 1. Fetch Users
    const { data: userData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(userData || []);

    // 2. Fetch Hobbies (Posts) via RPC
    const { data: postData, error: postError } = await supabase
        .rpc('get_admin_hobbies', { pin_code: pin });

    if (postError) {
        console.error("Error fetching posts:", postError);
    } else if (postData) {
        setPendingPosts(postData.filter(p => p.status === 'pending'));
        setPosts(postData.filter(p => p.status !== 'pending'));
    }

    // 3. Fetch Global Transactions with Profile Names
    const { data: transData } = await supabase
        .from('transactions')
        .select(`
            *,
            profiles:profile_id (full_name)
        `)
        .order('created_at', { ascending: false });
    setTransactions(transData || []);
    
    setLoading(false);
  };

  // --- HELPERS ---

  const getTimeLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    if (diff <= 0) return "Expired";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    return `${days}d ${hours}h`;
  };

  // --- ACTIONS ---

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const { error } = await supabase.from('profiles').update({ full_name: editName, role: editRole }).eq('id', editingUser.id);
    if (!error) {
        setUsers(users.map(u => u.id === editingUser.id ? { ...u, full_name: editName, role: editRole } : u));
        setEditingUser(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: deletingUser.id, pin_code: pin });
    if (!error) {
      setUsers(users.filter(u => u.id !== deletingUser.id));
      setDeletingUser(null);
    }
  };

  const handlePostAction = async (postId, newStatus) => {
    const { error } = await supabase.rpc('admin_update_post_status', { 
      target_post_id: postId, 
      new_status: newStatus,
      pin_code: pin 
    });

    if (error) {
      alert("Failed: " + error.message);
    } else {
        const targetPost = pendingPosts.find(p => p.id === postId);
        if (targetPost) {
          setPendingPosts(pendingPosts.filter(p => p.id !== postId));
          setPosts([{ ...targetPost, status: newStatus }, ...posts]);
        } else {
          setPosts(posts.map(p => p.id === postId ? { ...p, status: newStatus } : p));
        }
    }
  };

  const handleFeatureToggle = async (type, id) => {
    if (type === 'Post') {
      const { error } = await supabase.rpc('admin_toggle_featured_post', { 
        target_post_id: id, 
        pin_code: pin 
      });

      if (error) {
        alert("Feature error: " + error.message);
      } else {
        const update = (list) => list.map(p => p.id === id ? { ...p, featured: !p.featured } : p);
        setPosts(update(posts));
        setPendingPosts(update(pendingPosts));
        setActiveDropdown(null);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  const renderContent = () => {
    if (activeTab === 'users') {
      return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white">User Management</h2>
            <button onClick={fetchAllData} className="px-4 py-2 bg-white/5 text-white rounded-lg text-sm hover:bg-white/10 transition">Refresh</button>
          </div>
          <div className="overflow-x-auto pb-20">
            <table className="w-full text-left">
              <thead className="bg-white/[0.02] text-neutral-400 text-xs uppercase tracking-wider">
                <tr><th className="p-5">User</th><th className="p-5">Role</th><th className="p-5">Joined</th><th className="p-5 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.01]">
                    <td className="p-5 text-white font-medium">{user.full_name || user.email}</td>
                    <td className="p-5">
                       <span className={`px-2 py-1 rounded text-xs border capitalize ${
                         user.role === 'admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                         user.role === 'tutor' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                         'bg-blue-500/10 text-blue-400 border-blue-500/20'
                       }`}>
                         {user.role || 'student'}
                       </span>
                    </td>
                    <td className="p-5 text-neutral-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-5 text-right relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(user.id); }} className="text-neutral-500 hover:text-white p-2"><MoreVertical size={16} /></button>
                      {activeDropdown === user.id && (
                        <div className="absolute right-8 top-8 w-40 bg-neutral-800 border border-white/10 rounded-lg shadow-2xl z-50">
                          <button onClick={() => { setEditingUser(user); setEditName(user.full_name); setEditRole(user.role); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-2"><Edit size={14} /> Edit</button>
                          <button onClick={() => setDeletingUser(user)} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5"><Trash2 size={14} /> Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }

    if (activeTab === 'posts') {
        return (
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-6 border-b border-white/5 bg-white/[0.02]"><h2 className="text-xl font-bold text-white">Platform Listings</h2></div>
                <div className="overflow-x-auto pb-20">
                    <table className="w-full text-left">
                    <thead className="bg-white/[0.02] text-neutral-400 text-xs uppercase tracking-wider">
                        <tr><th className="p-5">Listing</th><th className="p-5 text-center">Featured</th><th className="p-5">Time Left</th><th className="p-5">Tutor</th><th className="p-5">Status</th><th className="p-5 text-right">Action</th></tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {posts.map((post) => (
                        <tr key={post.id} className="hover:bg-white/[0.01]">
                            <td className="p-5 text-white font-medium flex items-center gap-3">{post.image_url && <img src={post.image_url} className="w-8 h-8 rounded object-cover border border-white/10" />}{post.title}</td>
                            <td className="p-5 text-center">{post.featured && <Star size={16} className="text-yellow-500 fill-yellow-500 mx-auto" />}</td>
                            <td className="p-5">{post.featured && post.featured_until ? (<div className="flex items-center gap-2 text-yellow-500 font-mono text-[10px]"><Clock size={12} /> {getTimeLeft(post.featured_until)}</div>) : <span className="text-neutral-600">—</span>}</td>
                            <td className="p-5 text-gray-400">{post.profiles?.full_name || 'Unknown'}</td>
                            <td className="p-5"><span className={`px-2 py-1 rounded text-xs border capitalize ${post.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>{post.status}</span></td>
                            <td className="p-5 text-right relative">
                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(post.id); }} className="text-neutral-500 hover:text-white p-2"><MoreVertical size={16} /></button>
                                {activeDropdown === post.id && (
                                    <div className="absolute right-8 top-8 w-44 bg-neutral-800 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden">
                                        <button onClick={() => handleFeatureToggle('Post', post.id)} className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 ${post.featured ? 'text-yellow-500' : 'text-gray-300'}`}><Star size={14} fill={post.featured ? "currentColor" : "none"} /> {post.featured ? 'Unfeature' : 'Feature'}</button>
                                        <button onClick={() => handlePostAction(post.id, 'rejected')} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 border-t border-white/5"><XCircle size={14} /> Reject</button>
                                        <button onClick={() => handlePostAction(post.id, 'approved')} className="w-full text-left px-4 py-3 text-sm text-green-500 hover:bg-green-500/10 border-t border-white/5"><CheckCircle size={14} /> Approve</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (activeTab === 'transactions') {
        // --- ADDED: Revenue Calculation ---
        const totalRevenue = transactions.reduce((acc, t) => t.type === 'payment' ? acc + parseFloat(t.amount) : acc, 0);

        return (
          <div className="animate-in fade-in duration-500 space-y-6">
            {/* --- ADDED: Revenue Card --- */}
            <div className="bg-neutral-900 border border-orange-500/20 p-6 rounded-2xl flex items-center justify-between shadow-xl">
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest font-bold mb-1">Total Platform Revenue</p>
                <h3 className="text-4xl font-black text-white">₱{totalRevenue.toLocaleString()}</h3>
              </div>
              <div className="p-4 bg-orange-500/10 rounded-2xl text-orange-500"><TrendingUp size={32} /></div>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white/5 text-gray-500 text-[10px] uppercase tracking-widest">
                  <tr><th className="p-5">Activity</th><th className="p-5">User</th><th className="p-5">Details</th><th className="p-5">Date</th><th className="p-5 text-right">Amount</th></tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors text-sm">
                      <td className="p-5">
                        <div className="flex items-center gap-2">
                          {t.type === 'earning' ? <TrendingUp size={16} className="text-green-500" /> : <TrendingDown size={16} className="text-red-500" />}
                          <span className={`text-white font-medium capitalize ${t.type === 'payment' ? 'text-red-400' : 'text-green-400'}`}>{t.type}</span>
                        </div>
                      </td>
                      <td className="p-5 text-white font-medium">{t.profiles?.full_name || 'System'}</td>
                      <td className="p-5 text-gray-400">{t.plan_name}</td>
                      <td className="p-5 text-gray-500 text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className={`p-5 text-right font-black ${t.type === 'earning' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'earning' ? '+' : '-'} ₱{Number(t.amount).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && <div className="p-20 text-center text-gray-500 italic font-mono">No financial data available yet.</div>}
            </div>
          </div>
        );
    }

    if (activeTab === 'pending') {
        return (
            <div className="space-y-4 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-white mb-4">Approval Queue ({pendingPosts.length})</h2>
                {pendingPosts.length === 0 ? <div className="p-12 text-center text-gray-500 bg-neutral-900 border border-white/5 rounded-2xl">All caught up!</div> : (
                    pendingPosts.map(post => (
                        <div key={post.id} className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex items-start gap-6 shadow-lg">
                            {post.image_url ? <img src={post.image_url} className="w-32 h-24 object-cover rounded-lg border border-white/5" /> : <div className="w-32 h-24 bg-neutral-800 rounded-lg flex items-center justify-center text-xs text-gray-600">No Image</div>}
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-white">{post.title}</h3>
                                <p className="text-sm text-orange-400 mb-2">By {post.profiles?.full_name || 'Unknown'}</p>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.description}</p>
                                <div className="flex gap-3">
                                    <button onClick={() => handlePostAction(post.id, 'approved')} className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition shadow-lg shadow-green-900/20"><CheckCircle size={16} /> Accept</button>
                                    <button onClick={() => handlePostAction(post.id, 'rejected')} className="px-5 py-2 bg-white/5 hover:bg-red-500/20 text-gray-300 text-sm font-bold rounded-lg border border-white/10 transition"><XCircle size={16} /> Reject</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-600/10 blur-[50px] pointer-events-none" />
            <div className="relative mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 text-orange-500"><Lock size={24} /></div>
            <div className="text-center mb-8"><h2 className="text-xl font-bold text-white mb-2 tracking-wide">Admin Access</h2><p className="text-sm text-neutral-500">Enter PIN to manage listings</p></div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
                <input type="password" maxLength="4" className={`w-full bg-neutral-950 border ${error ? 'border-red-500 text-red-500' : 'border-neutral-800 text-white'} rounded-lg py-4 text-center text-2xl tracking-[1em] outline-none transition-all`} value={pin} onChange={(e) => setPin(e.target.value)} placeholder="••••" />
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3.5 rounded-lg transition-all active:scale-[0.98]">Unlock Dashboard</button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      <aside className="w-64 border-r border-white/10 flex flex-col z-20 h-full bg-black">
        <div className="h-20 flex items-center px-8 border-b border-white/5"><h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">Admin Panel</h1></div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><Users size={20} /> Users</button>
          <button onClick={() => setActiveTab('posts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'posts' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><FileText size={20} /> Listings</button>
          <button onClick={() => setActiveTab('pending')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pending' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><Clock size={20} /> Pending {pendingPosts.length > 0 && <span className="ml-auto bg-white text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{pendingPosts.length}</span>}</button>
          <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'transactions' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' : 'text-gray-400 hover:bg-white/5'}`}><History size={20} /> Transactions</button>
        </nav>
        <div className="p-4 border-t border-white/5"><button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors font-bold"><LogOut size={20} /> Logout</button></div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-black p-8 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-end">
            <div><h1 className="text-3xl font-bold text-white capitalize">{activeTab} Overview</h1><p className="text-gray-400 text-sm">Real-time platform metrics</p></div>
            {loading && <Loader2 className="animate-spin text-orange-500 mb-2" />}
          </div>
          {renderContent()}
        </div>
      </main>

      {/* EDIT MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-6">Edit User</h2>
            <div className="space-y-4">
              <div><label className="text-xs text-gray-500">Name</label><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"/></div>
              <div><label className="text-xs text-gray-500">Role</label><select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"><option value="student">Student</option><option value="tutor">Tutor</option><option value="admin">Admin</option></select></div>
              <div className="flex gap-2 mt-4"><button onClick={() => setEditingUser(null)} className="flex-1 py-3 text-white border border-white/10 rounded-lg">Cancel</button><button onClick={handleSaveEdit} className="flex-1 bg-orange-600 py-3 text-white font-bold rounded-lg hover:bg-orange-700">Save Changes</button></div>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500"><AlertTriangle size={24} /></div>
            <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
            <p className="text-gray-400 text-sm mb-6">This action cannot be undone. All data will be removed.</p>
            <div className="flex gap-3"><button onClick={() => setDeletingUser(null)} className="flex-1 py-3 border border-white/10 text-white rounded-lg">Cancel</button><button onClick={handleDeleteUser} className="flex-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700">Delete Forever</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;