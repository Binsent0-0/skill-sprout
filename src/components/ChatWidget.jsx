// ChatWidget.jsx - Final Version
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { MessageSquare, X, Send, User, ChevronLeft, Loader2 } from 'lucide-react';

const ChatWidget = ({ currentUserId, externalUser, onChatStarted }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef(null);

  // WATCHER: Opens the chat window when a profile clicks "Send Message"
  useEffect(() => {
    if (externalUser) {
      setSelectedContact(externalUser);
      setView('chat');
      setIsOpen(true); // Force window open
      onChatStarted(); 
    }
  }, [externalUser]);

  useEffect(() => {
    if (isOpen && currentUserId) fetchContacts();
  }, [isOpen, currentUserId]);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (data) {
      const contactIds = [...new Set(data.map(m => m.sender_id === currentUserId ? m.receiver_id : m.sender_id))];
      const { data: profileData } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', contactIds);
      setContacts(profileData || []);
    }
  };

  useEffect(() => {
    if (view === 'chat' && selectedContact) {
      fetchMessages();
      const subscription = supabase
        .channel(`chat-${selectedContact.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new;
          if ((msg.sender_id === selectedContact.id && msg.receiver_id === currentUserId) ||
              (msg.sender_id === currentUserId && msg.receiver_id === selectedContact.id)) {
            setMessages((prev) => [...prev, msg]);
          }
        })
        .subscribe();
      return () => { supabase.removeChannel(subscription); };
    }
  }, [view, selectedContact]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const content = newMessage;
    setNewMessage('');
    await supabase.from('messages').insert([{ sender_id: currentUserId, receiver_id: selectedContact.id, content }]);
  };

  if (!currentUserId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="w-16 h-16 bg-orange-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-orange-500 transition-all hover:scale-110 border-4 border-black">
          <MessageSquare size={28} />
        </button>
      )}

      {isOpen && (
        <div className="w-80 md:w-96 h-[500px] bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {view === 'chat' && <button onClick={() => setView('list')} className="text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>}
              <h3 className="text-white font-bold text-sm">{view === 'list' ? 'Conversations' : selectedContact?.full_name}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {view === 'list' ? (
              contacts.length === 0 ? <p className="text-center text-gray-500 text-xs mt-20 italic">No messages yet.</p> :
              contacts.map(c => (
                <div key={c.id} onClick={() => { setSelectedContact(c); setView('chat'); }} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : <User size={20} className="text-orange-500" />}
                  </div>
                  <p className="text-white text-sm font-medium">{c.full_name}</p>
                </div>
              ))
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${msg.sender_id === currentUserId ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-neutral-800 text-gray-200 rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                <div ref={scrollRef} />
              </>
            )}
          </div>

          {view === 'chat' && (
            <form onSubmit={sendMessage} className="p-4 bg-neutral-950 flex gap-2 border-t border-white/5">
              <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 text-sm" />
              <button className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors"><Send size={18} /></button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;