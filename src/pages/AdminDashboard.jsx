import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Lock, Users, FileText, LogOut, 
  Search, MoreVertical, Edit, Trash2, X, Save, AlertTriangle,
  CheckCircle, XCircle, Star, Clock
} from 'lucide-react';

const AdminDashboard = () => {
  // --- STATES ---
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  // Data States
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]); // All approved/rejected posts
  const [pendingPosts, setPendingPosts] = useState([]); // Queue
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'posts', 'pending'
  
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

    // 2. Fetch Hobbies (Posts)
    const { data: postData, error: postError } = await supabase
        .rpc('get_admin_hobbies', { pin_code: pin });

    if (postError) {
        console.error("Error fetching posts:", postError);
    } else if (postData) {
        setPendingPosts(postData.filter(p => p.status === 'pending'));
        setPosts(postData.filter(p => p.status !== 'pending'));
    }
    
    setLoading(false);
  };

  // --- ACTIONS ---

  // 1. User Actions
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

  // 2. Post Actions (Approve/Reject) using Secure RPC
const handlePostAction = async (postId, newStatus) => {
    // 1. Call the SECURE database function to update the status
    const { error } = await supabase.rpc('admin_update_post_status', { 
      target_post_id: postId, 
      new_status: newStatus,
      pin_code: pin // Must be '0000'
    });

    if (error) {
      console.error("Error updating post status:", error);
      alert("Failed to update post status: " + error.message);
    } else {
        // 2. SUCCESS: Update local state to show changes immediately
        
        // Find the post that was just approved/rejected
        const targetPost = pendingPosts.find(p => p.id === postId);
        
        if (targetPost) {
          // Remove from Pending list
          setPendingPosts(pendingPosts.filter(p => p.id !== postId));
          
          // Add to the main Posts list with the new status
          setPosts([{ ...targetPost, status: newStatus }, ...posts]);
        } else {
          // If it was already in the main list, just update it in place
          setPosts(posts.map(p => p.id === postId ? { ...p, status: newStatus } : p));
        }
    }
};

  // 3. Feature Actions (Placeholder)
  const handleFeatureToggle = (type, id) => {
      alert(`Feature ${type} functionality coming soon for ID: ${id}`);
  };

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);


  // --- RENDER HELPERS ---

  const getRoleBadge = (role) => {
    switch(role) {
      case 'admin': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'tutor': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const renderContent = () => {
    // --- TAB 1: USERS ---
    if (activeTab === 'users') {
      return (
        <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[500px]">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
            <h2 className="text-xl font-bold text-white">All Users</h2>
            <button onClick={fetchAllData} className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-lg text-sm hover:bg-orange-500/20 transition">Refresh</button>
          </div>
          <div className="overflow-x-visible pb-20">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/[0.02] text-neutral-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-5 font-medium">User Profile</th>
                  <th className="p-5 font-medium">Role</th>
                  <th className="p-5 font-medium">Joined</th>
                  <th className="p-5 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {users.map((user) => (
                  <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors relative">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs">
                            {user.full_name ? user.full_name[0].toUpperCase() : user.email[0].toUpperCase()}
                         </div>
                         <div>
                            <div className="text-white font-medium">{user.full_name || 'No Name'}</div>
                            <div className="text-neutral-500 text-xs">{user.email}</div>
                         </div>
                      </div>
                    </td>
                    <td className="p-5">
                       <span className={`px-2 py-1 rounded text-xs border capitalize ${getRoleBadge(user.role)}`}>{user.role || 'student'}</span>
                    </td>
                    <td className="p-5 text-neutral-500">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="p-5 text-right relative">
                      <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === user.id ? null : user.id); }} className="text-neutral-500 hover:text-white transition p-2 rounded hover:bg-white/10">
                         <MoreVertical size={16} />
                      </button>
                      {activeDropdown === user.id && (
                        <div className="absolute right-8 top-8 w-40 bg-neutral-800 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          {/* FEATURE TUTOR OPTION (Only for Tutors) */}
                          {user.role === 'tutor' && (
                            <button onClick={() => handleFeatureToggle('Tutor', user.id)} className="w-full text-left px-4 py-3 text-sm text-yellow-500 hover:bg-yellow-500/10 flex items-center gap-2">
                                <Star size={14} /> Feature Tutor
                            </button>
                          )}
                          <button onClick={() => { setEditingUser(user); setEditName(user.full_name); setEditRole(user.role); setActiveDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/5 flex items-center gap-2">
                            <Edit size={14} /> Edit
                          </button>
                          <button onClick={() => { setDeletingUser(user); setActiveDropdown(null); }} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5">
                            <Trash2 size={14} /> Delete
                          </button>
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

    // --- TAB 2: POSTS (Active) ---
    if (activeTab === 'posts') {
        return (
            <div className="bg-neutral-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[500px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <h2 className="text-xl font-bold text-white">All Posts</h2>
                    <span className="text-sm text-gray-500">{posts.length} entries</span>
                </div>
                <div className="overflow-x-visible pb-20">
                    <table className="w-full text-left border-collapse">
                    <thead className="bg-white/[0.02] text-neutral-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-5 font-medium">Listing</th>
                            <th className="p-5 font-medium">Tutor</th>
                            <th className="p-5 font-medium">Status</th>
                            <th className="p-5 text-right font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {posts.map((post) => (
                        <tr key={post.id} className="group hover:bg-white/[0.02] transition-colors relative">
                            <td className="p-5 text-white font-medium flex items-center gap-3">
                                {post.image_url && <img src={post.image_url} className="w-8 h-8 rounded object-cover" />}
                                {post.title}
                            </td>
                            <td className="p-5 text-gray-400">{post.profiles?.full_name || 'Unknown'}</td>
                            <td className="p-5">
                                <span className={`px-2 py-1 rounded text-xs border capitalize ${post.status === 'approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                    {post.status}
                                </span>
                            </td>
                            <td className="p-5 text-right relative">
                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === post.id ? null : post.id); }} className="text-neutral-500 hover:text-white transition p-2 rounded hover:bg-white/10">
                                    <MoreVertical size={16} />
                                </button>
                                {activeDropdown === post.id && (
                                    <div className="absolute right-8 top-8 w-40 bg-neutral-800 border border-white/10 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                        <button onClick={() => handleFeatureToggle('Post', post.id)} className="w-full text-left px-4 py-3 text-sm text-yellow-500 hover:bg-yellow-500/10 flex items-center gap-2">
                                            <Star size={14} /> Feature Post
                                        </button>
                                        <button onClick={() => handlePostAction(post.id, 'rejected')} className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2 border-t border-white/5">
                                            <XCircle size={14} /> Reject
                                        </button>
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

    // --- TAB 3: PENDING POSTS ---
    if (activeTab === 'pending') {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-4">Approval Queue ({pendingPosts.length})</h2>
                {pendingPosts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 bg-neutral-900 border border-white/5 rounded-2xl">
                        No pending posts. All caught up!
                    </div>
                ) : (
                    pendingPosts.map(post => (
                        <div key={post.id} className="bg-neutral-900 border border-white/10 rounded-2xl p-6 flex items-start gap-6">
                            {post.image_url ? (
                                <img src={post.image_url} alt="Cover" className="w-32 h-24 object-cover rounded-lg border border-white/10" />
                            ) : (
                                <div className="w-32 h-24 bg-neutral-800 rounded-lg flex items-center justify-center text-gray-600 border border-white/10">No Image</div>
                            )}
                            
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-white">{post.title}</h3>
                                    <span className="text-xs bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded border border-yellow-500/20">Pending</span>
                                </div>
                                <p className="text-sm text-orange-400 mb-2">By {post.profiles?.full_name || 'Unknown Tutor'}</p>
                                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{post.description}</p>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => handlePostAction(post.id, 'approved')}
                                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition"
                                    >
                                        <CheckCircle size={16} /> Accept
                                    </button>
                                    <button 
                                        onClick={() => handlePostAction(post.id, 'rejected')}
                                        className="px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-500 text-gray-300 text-sm font-bold rounded-lg flex items-center gap-2 transition border border-white/10"
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    }
  };


  // --- VIEW 1: LOCKED ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-neutral-900/50 backdrop-blur-md border border-white/5 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-orange-600/20 blur-[50px] rounded-full pointer-events-none" />
            <div className="relative mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 ring-1 ring-white/10">
                <Lock className="text-orange-500" size={24} />
            </div>
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-white mb-2 tracking-wide">Restricted Area</h2>
                <p className="text-sm text-neutral-500">Enter Admin PIN to proceed</p>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className={`relative transition-all duration-200 ${error ? 'animate-shake' : ''}`}>
                    <input type="password" maxLength="4" className={`w-full bg-neutral-950 border ${error ? 'border-orange-500 text-orange-500' : 'border-neutral-800 focus:border-neutral-600 text-white'} rounded-lg py-4 text-center text-2xl tracking-[1em] placeholder:tracking-normal outline-none transition-colors duration-200`} value={pin} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setPin(e.target.value); }} placeholder="••••" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg shadow-orange-900/20 active:scale-[0.98]">
                    Unlock Dashboard
                </button>
            </form>
        </div>
        <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } } .animate-shake { animation: shake 0.3s ease-in-out; }`}</style>
      </div>
    );
  }

  // --- VIEW 2: UNLOCKED ---
  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      <aside className="w-64 bg-black border-r border-white/10 flex flex-col pt-20 lg:pt-0 z-20 fixed lg:relative h-full">
        <div className="h-20 flex items-center px-8 border-b border-white/5 lg:border-none">
           <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500">Admin Panel</h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'users' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Users size={20} /> <span className="font-medium">Users</span>
          </button>
          <button onClick={() => setActiveTab('posts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'posts' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <FileText size={20} /> <span className="font-medium">All Posts</span>
          </button>
          <button onClick={() => setActiveTab('pending')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pending' ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Clock size={20} /> 
            <span className="font-medium">Pending Posts</span>
            {pendingPosts.length > 0 && <span className="ml-auto bg-white text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{pendingPosts.length}</span>}
          </button>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => setIsAuthenticated(false)} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
            <LogOut size={20} /> <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-black relative ml-64 lg:ml-0">
        <div className="p-8 lg:p-12 max-w-7xl mx-auto pt-28 lg:pt-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 capitalize">{activeTab.replace('_', ' ')} Management</h1>
            <p className="text-gray-400">Overview of system data.</p>
          </div>
          {renderContent()}
        </div>
      </main>

      {/* MODALS */}
      {editingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button>
            <h2 className="text-xl font-bold text-white mb-6">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none"/>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white focus:border-orange-500 outline-none">
                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button onClick={handleSaveEdit} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 mt-4"><Save size={18} /> Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-red-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
            <div className="mx-auto w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="text-red-500" size={24} /></div>
            <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
            <p className="text-gray-400 text-sm mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingUser(null)} className="flex-1 py-3 rounded-lg border border-white/10 text-white hover:bg-white/5">Cancel</button>
              <button onClick={handleDeleteUser} className="flex-1 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;