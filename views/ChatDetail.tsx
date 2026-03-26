
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  Smile, 
  Paperclip, 
  Camera, 
  Send, 
  Mic, 
  CheckCheck, 
  Info,
  MoreVertical
} from 'lucide-react';
import { User, Chat, Message } from '../types';
import { firestoreService } from '../services/firestoreService';
import { cn } from '../lib/utils';

interface Props {
  user: User;
}

const ChatDetail: React.FC<Props> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!id) return;

    const fetchChat = async () => {
      const chatData = await firestoreService.getChatById(id);
      setChat(chatData);
    };

    fetchChat();

    const unsubscribe = firestoreService.getMessages(id, (fetchedMessages) => {
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!msg.trim() || !id || !user.uid) return;
    
    const text = msg.trim();
    setMsg('');

    try {
      await firestoreService.sendMessage(id, {
        senderId: user.uid,
        text: text,
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const otherParticipantUid = chat?.participants.find(uid => uid !== user.uid);
  const otherParticipant = otherParticipantUid ? chat?.participantDetails[otherParticipantUid] : null;

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen bg-[#E5DDD5] dark:bg-gray-950 transition-colors overflow-hidden">
      {/* WhatsApp-Style Header */}
      <header className="bg-brand-primary pt-safe-top pb-3 px-4 flex items-center gap-3 z-50 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white active:scale-90 transition-transform p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="relative">
          <img 
            src={otherParticipant?.photoURL || `https://ui-avatars.com/api/?name=${otherParticipant?.displayName || 'User'}&background=random`} 
            className="w-10 h-10 rounded-full border border-white/20 object-cover" 
            alt={otherParticipant?.displayName || 'User'}
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-brand-primary rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white text-sm font-black truncate leading-tight">
            {otherParticipant?.displayName || 'Usuario de Pasalo'}
          </h3>
          <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">En línea</span>
        </div>
        <div className="flex gap-4 text-white">
          <button className="active:scale-90 transition-transform"><Phone className="w-5 h-5" /></button>
          <button className="active:scale-90 transition-transform"><Video className="w-5 h-5" /></button>
          <button className="active:scale-90 transition-transform"><MoreVertical className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Item Context (Thumb-accessible) */}
      {chat?.listingId && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm z-40"
        >
          <div className="flex items-center gap-3">
             <img 
               src={chat.listingImage || 'https://picsum.photos/seed/placeholder/100/100'} 
               className="w-8 h-8 rounded-lg object-cover" 
               alt={chat.listingTitle}
               referrerPolicy="no-referrer"
             />
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                 {chat.listingTitle}
               </span>
               <span className="text-[8px] font-bold text-brand-primary uppercase">Artículo en venta</span>
             </div>
          </div>
          <button 
            onClick={() => navigate(`/listing/${chat.listingId}`)}
            className="text-[9px] font-black text-brand-primary uppercase underline flex items-center gap-1"
          >
            <Info className="w-3 h-3" />
            Detalles
          </button>
        </motion.div>
      )}

      {/* Chat History */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar pb-32 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat opacity-90 dark:opacity-40"
      >
        <AnimatePresence mode="popLayout">
          {messages.map((m) => (
            <motion.div 
              key={m.id} 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "flex",
                m.senderId === user.uid ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                "relative max-w-[85%] px-3 py-2 rounded-2xl shadow-sm",
                m.senderId === user.uid 
                  ? 'bg-[#DCF8C6] dark:bg-brand-primary text-gray-800 dark:text-white rounded-tr-none' 
                  : 'bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none'
              )}>
                <p className="text-sm font-medium leading-tight pr-8">{m.text}</p>
                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                  <span className="text-[8px] font-black opacity-40 uppercase">
                    {formatTime(m.createdAt)}
                  </span>
                  {m.senderId === user.uid && (
                    <CheckCheck className={cn(
                      "w-3 h-3",
                      m.read ? "text-blue-500" : "opacity-40"
                    )} />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input Bar Fixed (Ergonomics) */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-transparent z-50 safe-area-bottom">
        <div className="flex gap-2 items-center">
          <div className="flex-1 bg-white dark:bg-gray-900 rounded-full px-4 py-3 flex items-center shadow-lg border border-gray-100 dark:border-gray-800 transition-colors">
            <button className="text-gray-400 mr-3 active:scale-90 transition-transform"><Smile className="w-6 h-6" /></button>
            <input
              type="text"
              className="flex-1 bg-transparent border-none text-sm font-medium outline-none dark:text-white"
              placeholder="Mensaje..."
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button className="text-gray-400 ml-3 active:scale-90 transition-transform"><Paperclip className="w-5 h-5" /></button>
            {!msg && <button className="text-gray-400 ml-4 active:scale-90 transition-transform"><Camera className="w-5 h-5" /></button>}
          </div>
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            className="w-12 h-12 bg-brand-primary rounded-full flex items-center justify-center text-white shadow-xl"
          >
            {msg ? <Send className="w-5 h-5 ml-0.5" /> : <Mic className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ChatDetail;
