import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, PlayCircle, Lock, MessageCircle, BookOpen, Loader2, Send, Image as ImageIcon } from 'lucide-react';

const ViewClassroom = () => {
  const { id } = useParams(); // Enrollment ID
  const navigate = useNavigate();

  // Data States
  const [loading, setLoading] = useState(true);
  const [hobby, setHobby] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [session, setSession] = useState(null);

  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [sendingChat, setSendingChat] = useState(false);

  useEffect(() => {
    fetchClassroomData();
  }, [id]);

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      // Fetch Enrollment, Hobby Details, and the Lessons JSON Column
      const { data: enrollment, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          hobbies (
            id,
            title,
            description,
            image_url,
            lessons,  
            created_by,
            profiles:created_by (full_name)
          )
        `)
        .eq('id', id)
        .eq('user_id', currentSession.user.id)
        .single();

      if (error) throw error;
      if (!enrollment) throw new Error("Enrollment not found");

      const hobbyData = enrollment.hobbies;
      setHobby(hobbyData);

      // Extract lessons from the JSONB column
      const lessonsArray = hobbyData.lessons || [];
      setLessons(lessonsArray);

      // Default to the first lesson
      if (lessonsArray.length > 0) {
        setActiveLesson(lessonsArray[0]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLE SENDING MESSAGE ---
  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !session || !hobby) return;
    
    setSendingChat(true);
    try {
      // 1. Gather Context Data
      const lessonTitle = activeLesson?.title || 'General Inquiry';
      const courseTitle = hobby.title;
      const imageUrl = hobby.image_url || '';

      // 2. Create the Hidden Context Block
      // This text block allows the receiver to parse and display a nice card
      const contextBlock = `[CONTEXT_CARD]
{"lesson": "${lessonTitle}", "course": "${courseTitle}", "image": "${imageUrl}"}
[/CONTEXT_CARD]`;

      // 3. Combine with user's actual message
      const finalContent = `${contextBlock}\n\n${chatMessage}`;

      // 4. Insert into Supabase
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: session.user.id,
          receiver_id: hobby.created_by, // The Tutor
          content: finalContent
        });

      if (error) throw error;

      setChatMessage('');
      alert("Message sent to instructor!");

    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message.');
    } finally {
      setSendingChat(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 border-b border-white/10 flex items-center px-6 bg-neutral-900/50 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-400" />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{hobby?.title}</h1>
            <p className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">Classroom Mode</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Content Area (Video/Text) */}
        <div className="flex-1 bg-neutral-950 flex flex-col relative overflow-y-auto">
          {activeLesson ? (
            <div className="p-8 max-w-5xl mx-auto w-full">
              <div className="aspect-video bg-neutral-900 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden mb-6 shadow-2xl">
                {activeLesson.video_url ? (
                  <iframe 
                    src={activeLesson.video_url} 
                    className="w-full h-full" 
                    frameBorder="0" 
                    allowFullScreen 
                    title={activeLesson.title}
                  />
                ) : (
                   <div className="text-center p-10">
                     <BookOpen size={48} className="mx-auto text-neutral-700 mb-4"/>
                     <p className="text-gray-500">Text-based Lesson</p>
                   </div>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-4">{activeLesson.title}</h2>
              <div className="prose prose-invert max-w-none text-gray-400">
                <p>{activeLesson.content || activeLesson.description || "No content provided."}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
              <Lock size={48} className="mb-4 opacity-20" />
              <p>Select a lesson to begin</p>
            </div>
          )}
        </div>

        {/* Right Sidebar: Curriculum & Chat */}
        <aside className="w-96 border-l border-white/10 bg-neutral-900 flex flex-col shrink-0">
          
          {/* Top Half: Lesson List */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-white/10 shrink-0">
              <h3 className="font-bold flex items-center gap-2 text-sm text-gray-300">
                <BookOpen size={16} className="text-orange-500" /> Course Content
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {lessons.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-600 italic">No lessons uploaded yet.</div>
              ) : (
                lessons.map((lesson, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-3 rounded-xl flex items-start gap-3 transition-all ${
                      activeLesson === lesson 
                        ? 'bg-orange-600/10 border border-orange-600/20' 
                        : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 ${activeLesson === lesson ? 'text-orange-500' : 'text-gray-500'}`}>
                      <PlayCircle size={16} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-medium ${activeLesson === lesson ? 'text-orange-500' : 'text-gray-300'}`}>
                        {index + 1}. {lesson.title}
                      </h4>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Bottom Half: Chat Interface */}
          <div className="h-1/3 border-t border-white/10 flex flex-col bg-neutral-800/30">
            <div className="p-3 border-b border-white/10 flex justify-between items-center bg-neutral-900">
              <h3 className="font-bold flex items-center gap-2 text-xs text-gray-300">
                <MessageCircle size={14} className="text-orange-500" /> Ask Instructor
              </h3>
            </div>
            
            <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto">
              
              {/* Context Card Preview (UI Only) */}
              {/* This shows the student what reference is being attached */}
              {activeLesson && (
                <div className="bg-neutral-900 p-2 rounded-lg border border-white/10 flex items-center gap-3 select-none opacity-80">
                  <div className="w-10 h-10 rounded bg-neutral-800 flex items-center justify-center shrink-0 overflow-hidden border border-white/5">
                    {hobby?.image_url ? (
                        <img src={hobby.image_url} className="w-full h-full object-cover" alt="" />
                    ) : <ImageIcon size={16} className="text-gray-600" />}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[9px] text-orange-500 uppercase font-bold tracking-wider">Ref: {activeLesson.title}</p>
                    <p className="text-[10px] text-gray-400 truncate">Course: {hobby?.title}</p>
                  </div>
                </div>
              )}

              <textarea 
                className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white focus:border-orange-500 outline-none resize-none flex-1 transition-colors placeholder:text-gray-600"
                placeholder="Type your question for the tutor here..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
              />
              
              <button 
                onClick={handleSendMessage}
                disabled={sendingChat || !chatMessage.trim()}
                className="bg-orange-600 text-white text-xs font-bold py-3 rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-900/20"
              >
                {sendingChat ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Send Message
              </button>
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
};

export default ViewClassroom;