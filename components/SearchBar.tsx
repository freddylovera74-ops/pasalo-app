
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Mic, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface SearchBarProps {
  onSearch: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new (SpeechRecognition as any)();
      
      recognition.lang = 'es-VE';
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText) {
          setQuery(currentText);
          onSearch(currentText);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [onSearch]);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setQuery('');
      recognitionRef.current.start();
    }
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative w-full group">
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.05 }}
            exit={{ opacity: 0, scale: 1 }}
            className="absolute -inset-1 bg-gradient-to-r from-brand-secondary to-brand-primary rounded-2xl blur opacity-25"
          />
        )}
      </AnimatePresence>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={cn(
            "w-5 h-5 transition-all duration-300",
            isListening ? 'text-brand-primary scale-110' : 'text-gray-400'
          )} />
        </div>
        
        <input
          type="text"
          className={cn(
            "block w-full pl-12 pr-12 py-4 border-none rounded-2xl bg-white dark:bg-gray-800 dark:text-white shadow-xl focus:ring-4 focus:ring-brand-primary/20 text-sm placeholder-gray-400 font-bold transition-all",
            isListening && 'italic text-brand-primary'
          )}
          placeholder={isListening ? "Te escucho..." : "¿Buscas algo en específico?"}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSearch(e.target.value);
          }}
        />

        <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
          {query && !isListening && (
            <button
              onClick={clearSearch}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <button
            onClick={handleVoiceSearch}
            className={cn(
              "p-2 rounded-xl transition-all",
              isListening ? 'text-brand-accent scale-110' : 'text-brand-primary active:scale-90'
            )}
          >
            {isListening ? (
              <div className="flex gap-1 items-center h-5 px-1">
                {[0.6, 0.8, 1, 0.7].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [12, 20, 12] }}
                    transition={{ duration: delay, repeat: Infinity, ease: "easeInOut" }}
                    className="w-1 bg-brand-accent rounded-full"
                  />
                ))}
              </div>
            ) : (
              <div className="w-10 h-10 bg-brand-primary/5 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-brand-primary/10 transition-colors">
                <Mic className="w-5 h-5" />
              </div>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute -bottom-10 left-0 right-0 text-center"
          >
            <span className="text-[9px] font-black text-white/80 uppercase tracking-widest bg-brand-dark/40 backdrop-blur-md px-3 py-1 rounded-full">
              Habla ahora: "Monitor", "Zapatos", "Ofertas"...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;
