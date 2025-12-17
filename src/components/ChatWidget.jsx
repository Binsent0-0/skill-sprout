import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  MessageSquare, X, Send, User, ChevronLeft, BookOpen, 
  Plus, File, Image, Calendar, Clock, CheckCircle, Loader2, Video 
} from 'lucide-react';

const ChatWidget = ({ 
  currentUserId, 
  externalUser, 
  onChatStarted, 
  enrollment, 
  activeLesson 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('list');
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // --- STATE ---
  const [showAttachMenu, setShowAttachMenu] = useState(false); 
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  
  // NEW: Track if booking is allowed based on DB check
  const [canBook, setCanBook] = useState(false);

  // Appointment Form
  const [apptDate, setApptDate] = useState('');
  const [apptTime, setApptTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);

  // Interaction State
  const [acceptingId, setAcceptingId] = useState(null); 

  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMessageIds, setNewMessageIds] = useState(new Set());
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  
  const scrollRef = useRef(null);
  const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // --- 1. PARSER ---
  const parseMessage = (content) => {
    // Context Card
    if (content && content.includes('[CONTEXT_CARD]')) {
      try {
        const parts = content.split('[/CONTEXT_CARD]');
        const jsonString = parts[0].replace('[CONTEXT_CARD]', '');
        const realMessage = parts[1] ? parts[1].trim() : '';
        const cardData = JSON.parse(jsonString);
        return { 
          text: realMessage, 
          context: { title: cardData.lesson, thumbnail: cardData.image, subtitle: cardData.course },
          type: 'context'
        };
      } catch (e) { console.error(e); }
    }
    
    // Appointment Request Card
    if (content && content.includes('[APPOINTMENT_REQUEST]')) {
        try {
            const parts = content.split('[/APPOINTMENT_REQUEST]');
            const jsonString = parts[0].replace('[APPOINTMENT_REQUEST]', '');
            const apptData = JSON.parse(jsonString);
            return {
                text: "",
                appointment: apptData, 
                type: 'appointment_request'
            };
        } catch(e) {}
    }

    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object' && parsed.text) return parsed;
    } catch (e) {}
    return { text: content, context: null, type: 'text' };
  };

  // --- 2. WATCHERS ---
  useEffect(() => {
    if (externalUser) {
      setSelectedContact(externalUser);
      setView('chat');
      setIsOpen(true);
      if(onChatStarted) onChatStarted(); 
    }
  }, [externalUser]);

  useEffect(() => {
    if (enrollment && enrollment.hobbies?.created_by) {
        const tutor = enrollment.hobbies.profiles || {};
        const tutorProfile = {
            id: enrollment.hobbies.created_by,
            full_name: tutor.full_name || 'Instructor',
            avatar_url: tutor.avatar_url || null
        };
        setSelectedContact(tutorProfile);
        setView('chat'); 
    }
  }, [enrollment]);

  useEffect(() => {
    if (currentUserId) fetchContacts();
  }, [currentUserId]);

  useEffect(() => {
    if (isOpen) {
      setUnreadCounts({});
      setNewMessageIds(new Set());
      setHasBeenOpened(true);
    }
  }, [isOpen]);

  // --- NEW: CHECK BOOKING PERMISSIONS ---
  useEffect(() => {
    const checkBookingPermission = async () => {
      // Reset permission whenever contact changes
      setCanBook(false);

      if (!currentUserId || !selectedContact) return;

      try {
        // Query enrollments to see if we have an active course with this user
        // where 1on1 is enabled.
        const { data } = await supabase
          .from('enrollments')
          .select(`
            id,
            status,
            1on1_enabled,
            hobbies!inner (
                created_by
            )
          `)
          .eq('user_id', currentUserId)
          .eq('status', 'active')
          .eq('1on1_enabled', true)
          .eq('hobbies.created_by', selectedContact.id) // Check if hobby owner is the chat contact
          .maybeSingle();

        if (data) {
          setCanBook(true);
        }
      } catch (error) {
        console.error("Error checking booking permission:", error);
      }
    };

    checkBookingPermission();
  }, [currentUserId, selectedContact]);

  // --- 3. DATA FETCHING ---
  const fetchContacts = async () => {
    const { data } = await supabase
      .from('messages')
      .select('sender_id, receiver_id')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

    if (data) {
      const contactIds = [...new Set(data.map(m => m.sender_id === currentUserId ? m.receiver_id : m.sender_id))];
      if(contactIds.length > 0) {
        const { data: profileData } = await supabase.from('profiles').select('id, full_name, avatar_url').in('id', contactIds);
        setContacts(profileData || []);

        if (!isOpen && !hasBeenOpened) {
          const counts = {};
          for (const contactId of contactIds) {
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('sender_id', contactId)
              .eq('receiver_id', currentUserId);
            counts[contactId] = count || 0;
          }
          setUnreadCounts(counts);
        }
      }
    }
  };

  useEffect(() => {
    if (view === 'chat' && selectedContact && isOpen) {
      fetchMessages();
      
      const msgSub = supabase
        .channel(`chat-${selectedContact.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new;
          if ((msg.sender_id === selectedContact.id && msg.receiver_id === currentUserId) ||
              (msg.sender_id === currentUserId && msg.receiver_id === selectedContact.id)) {
            setMessages((prev) => [...prev, msg]);
            if (msg.sender_id === selectedContact.id) {
              setUnreadCounts(prev => ({ ...prev, [selectedContact.id]: (prev[selectedContact.id] || 0) + 1 }));
              setNewMessageIds(prev => new Set([...prev, msg.id]));
            }
            scrollToBottom();
          }
        })
        .subscribe();

      const apptSub = supabase
        .channel(`appt-${selectedContact.id}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, () => {
           fetchMessages();
        })
        .subscribe();

      return () => { 
        supabase.removeChannel(msgSub);
        supabase.removeChannel(apptSub);
      };
    }
  }, [view, selectedContact, isOpen]);

  const fetchMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedContact.id}),and(sender_id.eq.${selectedContact.id},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  // --- 4. SEND MESSAGE LOGIC ---
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    
    setShowAttachMenu(false);

    let contentToSend = newMessage;

    if (activeLesson && enrollment) {
        const lessonTitle = activeLesson.title;
        const courseTitle = enrollment.hobbies.title;
        const imageUrl = enrollment.hobbies.image_url || '';
        const contextBlock = `[CONTEXT_CARD]{"lesson": "${lessonTitle}", "course": "${courseTitle}", "image": "${imageUrl}"}[/CONTEXT_CARD]`;
        contentToSend = `${contextBlock}\n${newMessage}`;
    }

    setNewMessage('');
    
    await supabase.from('messages').insert([{ 
        sender_id: currentUserId, 
        receiver_id: selectedContact.id, 
        content: contentToSend 
    }]);
  };

  // --- 5. APPOINTMENT LOGIC ---
  const handleAttachmentOption = (option) => {
    if (option === 'appointment') {
        setShowAppointmentModal(true);
    }
    setShowAttachMenu(false);
  };

  const confirmAppointment = async () => {
    if(!apptDate || !apptTime) return alert("Please select date and time");
    
    setBookingLoading(true);
    try {
        const scheduledAt = new Date(`${apptDate}T${apptTime}`).toISOString();
        const prettyDate = new Date(`${apptDate}T${apptTime}`).toLocaleString('en-US', { 
            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
        });

        const { data: apptData, error } = await supabase
            .from('appointments')
            .insert([{
                student_id: currentUserId,
                tutor_id: selectedContact.id,
                scheduled_at: scheduledAt,
                status: 'pending',
                meeting_link: null 
            }])
            .select()
            .single();

        if(error) throw error;

        const apptBlock = `[APPOINTMENT_REQUEST]{"id": ${apptData.id}, "date": "${prettyDate}", "status": "pending", "link": null}[/APPOINTMENT_REQUEST]`;
        
        await supabase.from('messages').insert([{ 
            sender_id: currentUserId, 
            receiver_id: selectedContact.id, 
            content: apptBlock 
        }]);

        setShowAppointmentModal(false);
        setApptDate('');
        setApptTime('');

    } catch (err) {
        alert("Error booking: " + err.message);
    } finally {
        setBookingLoading(false);
    }
  };

  const handleAcceptAppointment = async (apptId, dateForLink) => {
    setAcceptingId(apptId);
    try {
        const uniqueCode = Math.random().toString(36).substring(7);
        const meetingLink = `https://meet.google.com/lookup/${uniqueCode}`; 

        const { error } = await supabase
            .from('appointments')
            .update({ 
                status: 'accepted',
                meeting_link: meetingLink
            })
            .eq('id', apptId);

        if(error) throw error;

        const successMsg = `[APPOINTMENT_REQUEST]{"id": ${apptId}, "date": "${dateForLink}", "status": "accepted", "link": "${meetingLink}"}[/APPOINTMENT_REQUEST]`;
        
        await supabase.from('messages').insert([{ 
            sender_id: currentUserId, 
            receiver_id: selectedContact.id, 
            content: successMsg 
        }]);

        fetchMessages();

    } catch (err) {
        console.error(err);
        alert("Failed to accept");
    } finally {
        setAcceptingId(null);
    }
  };

  if (!currentUserId) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] font-sans">
      {!isOpen && (
        <button onClick={() => { setIsOpen(true); setUnreadCounts({}); }} className={`w-16 h-16 bg-orange-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-orange-500 transition-all hover:scale-110 border-4 border-black ${totalUnread > 0 ? 'bg-orange-500/20 border-orange-500 animate-pulse' : ''}`}>
          <MessageSquare size={28} />
        </button>
      )}

      {isOpen && (
        <div className="w-80 md:w-96 h-[500px] bg-neutral-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 relative">
          
          {/* Header */}
          <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {view === 'chat' && !enrollment && (
                <button onClick={() => setView('list')} className="text-gray-400 hover:text-white"><ChevronLeft size={20} /></button>
              )}
              
              <div className="flex items-center gap-2">
                {view === 'chat' && selectedContact?.avatar_url && (
                    <img src={selectedContact.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />
                )}
                <div>
                    <h3 className="text-white font-bold text-sm">
                        {view === 'list' ? 'Conversations' : selectedContact?.full_name}
                    </h3>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white"><X size={20} /></button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-neutral-900/50">
            {view === 'list' ? (
              // CONTACT LIST
              contacts.length === 0 ? <p className="text-center text-gray-500 text-xs mt-20 italic">No messages yet.</p> :
              contacts.map(c => (
                <div key={c.id} onClick={() => { setSelectedContact(c); setView('chat'); setUnreadCounts(prev => ({ ...prev, [c.id]: 0 })); }} className={`flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 cursor-pointer transition-all ${unreadCounts[c.id] > 0 ? 'bg-orange-500/10 border-l-4 border-orange-500' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden">
                    {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" alt="" /> : <User size={20} className="text-orange-500" />}
                  </div>
                  <p className="text-white text-sm font-medium flex-1">{c.full_name}</p>
                  {unreadCounts[c.id] > 0 && <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 font-bold">{unreadCounts[c.id]}</span>}
                </div>
              ))
            ) : (
              // CHAT MESSAGES
              <>
                {messages.map((msg, i) => {
                  const { text, context, appointment, type } = parseMessage(msg.content);
                  const isMe = msg.sender_id === currentUserId;

                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm ${isMe ? 'bg-orange-600 text-white rounded-tr-none' : 'bg-neutral-800 text-gray-200 rounded-tl-none'}`}>
                        
                        {/* TYPE 1: Context Card */}
                        {type === 'context' && context && (
                            <div className={`mb-2 p-2 rounded-xl flex items-center gap-3 border ${isMe ? 'bg-black/20 border-black/10' : 'bg-black/40 border-white/5'}`}>
                                {context.thumbnail ? <img src={context.thumbnail} className="w-10 h-10 rounded-lg object-cover" alt="" /> : <BookOpen size={16}/>}
                                <div className="min-w-0 text-left">
                                    <p className={`text-[9px] font-bold uppercase ${isMe ? 'text-white/70' : 'text-orange-500'}`}>Ref: {context.title}</p>
                                </div>
                            </div>
                        )}

                        {/* TYPE 2: Appointment Request Card */}
                        {type === 'appointment_request' && appointment && (
                            <div className="mb-1 p-3 bg-black/20 rounded-xl border border-white/10 min-w-[200px]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-orange-300 font-bold uppercase text-[10px]">
                                        <Calendar size={12} />
                                        <span>Appointment</span>
                                    </div>
                                    {/* Status Badge */}
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                        appointment.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                    }`}>
                                        {appointment.status}
                                    </span>
                                </div>
                                
                                <p className="text-lg font-bold text-white mb-3">{appointment.date}</p>
                                
                                {appointment.status === 'accepted' ? (
                                    <div className="mt-2 pt-2 border-t border-white/10">
                                        <a href={appointment.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-green-400 hover:text-green-300 text-xs font-bold bg-green-500/10 p-2 rounded-lg transition-colors">
                                            <Video size={14} /> Join Meeting
                                        </a>
                                    </div>
                                ) : (
                                    !isMe && (
                                        <div className="flex gap-2 mt-2">
                                            <button 
                                                onClick={() => handleAcceptAppointment(appointment.id, appointment.date)}
                                                disabled={acceptingId === appointment.id}
                                                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-1.5 rounded-lg text-xs font-bold transition-colors flex justify-center items-center"
                                            >
                                                {acceptingId === appointment.id ? <Loader2 size={12} className="animate-spin"/> : "Accept"}
                                            </button>
                                            <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-1.5 rounded-lg text-xs font-bold transition-colors">
                                                Decline
                                            </button>
                                        </div>
                                    )
                                )}
                                {isMe && appointment.status === 'pending' && (
                                    <p className="text-[10px] italic opacity-60 mt-1">Waiting for tutor to accept...</p>
                                )}
                            </div>
                        )}

                        {text && <p className="leading-relaxed whitespace-pre-wrap">{text}</p>}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </>
            )}
          </div>

          {/* --- APPOINTMENT MODAL --- */}
          {showAppointmentModal && (
            <div className="absolute inset-0 bg-neutral-900 z-[70] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-white/5 flex justify-between items-center">
                    <h3 className="text-white font-bold">Book 1-on-1 Session</h3>
                    <button onClick={() => setShowAppointmentModal(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="flex-1 p-6 flex flex-col gap-6">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-bold">Select Date</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-3 text-orange-500" size={18} />
                            <input type="date" value={apptDate} onChange={(e) => setApptDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-orange-500" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs text-gray-500 uppercase font-bold">Select Time</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-3 text-orange-500" size={18} />
                            <input type="time" value={apptTime} onChange={(e) => setApptTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-orange-500" />
                        </div>
                    </div>
                    <div className="mt-auto">
                        <button onClick={confirmAppointment} disabled={bookingLoading} className="w-full bg-orange-600 text-white font-bold py-4 rounded-xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2">
                            {bookingLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={20} /> Request Booking</>}
                        </button>
                    </div>
                </div>
            </div>
          )}

          {/* Input Area */}
          {view === 'chat' && !showAppointmentModal && (
            <div className="bg-neutral-950 border-t border-white/5 relative z-50">
                
                {/* ATTACHMENT MENU */}
                {showAttachMenu && (
                  <div className="absolute bottom-full left-4 mb-2 w-48 bg-neutral-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-[60]">
                    <div className="flex flex-col p-1">
                      <button className="flex items-center gap-3 px-3 py-2 hover:bg-white/10 rounded-xl text-left text-xs text-gray-200 transition-colors">
                        <File size={16} className="text-blue-400" /> Add File
                      </button>
                      
                      {/* FIXED CONDITION HERE: Uses canBook state from DB check */}
                      {canBook && (
                          <>
                            <div className="h-px bg-white/10 my-1"></div>
                            <button onClick={() => handleAttachmentOption('appointment')} className="flex items-center gap-3 px-3 py-2 hover:bg-orange-500/10 hover:text-orange-400 rounded-xl text-left text-xs text-gray-200 transition-colors">
                                <Calendar size={16} className="text-orange-500" /> Set Appointment
                            </button>
                          </>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={sendMessage} className="p-3 flex gap-2 items-end">
                  <button type="button" onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-xl transition-colors shrink-0 ${showAttachMenu ? 'bg-orange-500 text-white rotate-45 transform' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}>
                    <Plus size={20} />
                  </button>
                  <input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-orange-500 text-sm transition-colors min-h-[42px]" />
                  <button className="p-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors shrink-0 h-[42px] w-[42px] flex items-center justify-center">
                    <Send size={18} />
                  </button>
                </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;