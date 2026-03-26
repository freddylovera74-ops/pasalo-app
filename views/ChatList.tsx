
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ChevronRight, Search, Edit2 } from 'lucide-react';
import NotificationBell from '../components/NotificationBell';
import { User, Chat } from '../types';
import { firestoreService } from '../services/firestoreService';
import { cn } from '../lib/utils';

interface Props {
  user: User;
}

const ChatList: React.FC<Props> = ({ user }) => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.uid) return;

    const unsubscribe = firestoreService.getChats(user.uid, (fetchedChats) => {
      setChats(fetchedChats);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Error('Invalid date');
    if (date instanceof Error) return '';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Ayer';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen transition-colors">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-10">
        <h1 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Mensajes</h1>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button className="text-brand-primary p-2 hover:bg-brand-primary/10 rounded-full transition-colors">
            <Edit2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-900 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-900">
          <AnimatePresence mode="popLayout">
            {chats.map((chat, index) => {
              const otherParticipantUid = chat.participants.find(uid => uid !== user.uid);
              const otherParticipant = otherParticipantUid ? chat.participantDetails[otherParticipantUid] : null;

              return (
                <motion.div
                  key={chat.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link 
                    to={`/chat/${chat.id}`} 
                    className="flex items-center p-4 active:bg-brand-neutral dark:active:bg-gray-900 gap-4 transition-colors group"
                  >
                    <div className="relative">
                      <img 
                        src={otherParticipant?.photoURL || `https://ui-avatars.com/api/?name=${otherParticipant?.displayName || 'User'}&background=random`} 
                        className="w-14 h-14 rounded-full object-cover border-2 border-brand-neutral dark:border-gray-800 shadow-sm" 
                        alt={otherParticipant?.displayName || 'User'}
                        referrerPolicy="no-referrer"
                      />
                      {/* Online indicator placeholder */}
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-950 rounded-full" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <h3 className="font-black text-gray-900 dark:text-white truncate text-sm">
                          {otherParticipant?.displayName || 'Usuario de Pasalo'}
                        </h3>
                        <span className="text-[10px] font-bold text-gray-400">
                          {formatTime(chat.updatedAt)}
                        </span>
                      </div>
                      
                      {chat.listingTitle && (
                        <p className="text-[10px] text-brand-primary font-black uppercase tracking-tighter mb-1 truncate flex items-center gap-1">
                          <span className="opacity-50">Interesado en:</span> {chat.listingTitle}
                        </p>
                      )}
                      
                      <p className={cn(
                        "text-xs truncate",
                        chat.lastMessage?.senderId !== user.uid && !chat.lastMessage?.createdAt ? "text-gray-900 dark:text-gray-100 font-bold" : "text-gray-500"
                      )}>
                        {chat.lastMessage?.text || 'Inicia una conversación...'}
                      </p>
                    </div>
                    
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-700 group-hover:text-brand-primary transition-colors" />
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {!loading && chats.length === 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-40 text-gray-400 px-10 text-center"
        >
          <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
            <MessageSquare className="w-10 h-10 opacity-20" />
          </div>
          <p className="text-sm font-black uppercase tracking-widest opacity-50">Aún no tienes conversaciones</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-6 text-brand-primary text-xs font-black uppercase tracking-widest border-b-2 border-brand-primary pb-1"
          >
            Explorar artículos
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default ChatList;
