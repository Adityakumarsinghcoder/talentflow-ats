import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../store/authSlice.js';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import { Send, User as UserIcon, MessageSquare, AlertCircle } from 'lucide-react';

export default function Messages() {
  const user = useSelector(selectCurrentUser);
  const [searchParams] = useSearchParams();
  const partnerIdParam = searchParams.get('partnerId');

  const [partners, setPartners] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  // Poll for messages of active thread
  useEffect(() => {
    if (!activePartner) return;
    fetchMessages(activePartner._id, false);

    const interval = setInterval(() => {
      fetchMessages(activePartner._id, false);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [activePartner?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPartners = async () => {
    try {
      setLoadingPartners(true);
      const res = await api.get('/messages/partners');
      setPartners(res.data);
      
      // Pre-select partner from search param if present
      if (partnerIdParam) {
        const found = res.data.find(p => p._id === partnerIdParam);
        if (found) {
          setActivePartner(found);
          fetchMessages(found._id, true);
          return;
        }
      }

      if (res.data.length > 0) {
        setActivePartner(res.data[0]);
        fetchMessages(res.data[0]._id, true);
      }
    } catch (err) {
      console.error('Error fetching chat partners:', err);
    } finally {
      setLoadingPartners(false);
    }
  };

  const fetchMessages = async (partnerId, showLoading = true) => {
    try {
      if (showLoading) setLoadingMessages(true);
      const res = await api.get(`/messages/${partnerId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePartner) return;

    const messageText = text;
    setText('');

    try {
      // Optimistic update
      const tempMsg = {
        _id: Date.now().toString(),
        senderId: user._id,
        receiverId: activePartner._id,
        text: messageText,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, tempMsg]);

      const res = await api.post('/messages', {
        receiverId: activePartner._id,
        text: messageText,
      });

      // Refetch actual thread details
      fetchMessages(activePartner._id, false);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-80px)] flex bg-dark-950 rounded-2xl overflow-hidden border border-slate-800 animate-fade-in">
      
      {/* Sidebar Panel */}
      <div className="w-1/3 border-r border-slate-800 bg-dark-900/50 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <h1 className="text-lg font-bold text-slate-200">Conversations</h1>
          <p className="text-[10px] text-slate-500 mt-0.5">Persistent direct chat history with job applicants / hiring managers</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {loadingPartners ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading conversations...</div>
          ) : partners.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
              <MessageSquare className="w-8 h-8 text-slate-600" />
              <span>No active conversations yet.<br />Apply to jobs to message recruiters.</span>
            </div>
          ) : (
            partners.map(p => (
              <button
                key={p._id}
                onClick={() => {
                  setActivePartner(p);
                  fetchMessages(p._id, true);
                }}
                className={`w-full p-4 text-left flex items-center gap-3 transition hover:bg-slate-800/30 ${activePartner?._id === p._id ? 'bg-primary-600/10 border-l-2 border-primary-500' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center font-bold text-white shrink-0">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline">
                    <h2 className="text-xs font-semibold text-slate-200 truncate">{p.name}</h2>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 capitalize">{p.role.toLowerCase().replace('_', ' ')}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Window Panel */}
      <div className="flex-1 flex flex-col bg-dark-900/10">
        {activePartner ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-slate-800 bg-dark-900/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary-600/25 to-indigo-500/25 text-primary-400 flex items-center justify-center font-semibold text-xs border border-primary-500/30">
                  {activePartner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xs font-semibold text-slate-200">{activePartner.name}</h2>
                  <p className="text-[10px] text-slate-400 capitalize">{activePartner.role.toLowerCase().replace('_', ' ')}</p>
                </div>
              </div>
              {user.role === 'CANDIDATE' && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/40 border border-indigo-500/20 text-[10px] text-indigo-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" /> Recruiter Automated Reply Active (Sandbox)
                </div>
              )}
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-500">Loading messages thread...</div>
              ) : (
                messages.map(m => {
                  const isMe = m.senderId === user._id || m.senderId._id === user._id;
                  return (
                    <div key={m._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-md ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700/40'}`}>
                        <p className="leading-relaxed">{m.text}</p>
                        <span className={`block text-[8px] text-right mt-1 ${isMe ? 'text-primary-200' : 'text-slate-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-dark-900/40 flex items-center gap-3">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-dark-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500 transition"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary-600 text-white hover:bg-primary-500 font-semibold text-xs transition shadow-lg shadow-primary-600/10 flex items-center gap-1.5 disabled:opacity-50"
              >
                Send <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-xs text-slate-500">
            <MessageSquare className="w-10 h-10 text-slate-700" />
            <span>Select a conversation to start chatting.</span>
          </div>
        )}
      </div>

    </div>
  );
}
