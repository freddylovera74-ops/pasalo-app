
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './context/AuthContext';


// Lazy Loading de vistas
const Home = lazy(() => import('./views/Home'));
const ListingDetail = lazy(() => import('./views/ListingDetail'));
const CreateListing = lazy(() => import('./views/CreateListing'));
const ChatList = lazy(() => import('./views/ChatList'));
const ChatDetail = lazy(() => import('./views/ChatDetail'));
const Profile = lazy(() => import('./views/Profile'));
const Login = lazy(() => import('./views/Login'));
const AdminDashboard = lazy(() => import('./views/AdminDashboard'));
const Notifications = lazy(() => import('./views/Notifications'));
const Ratings = lazy(() => import('./views/Ratings'));
const Legal = lazy(() => import('./views/Legal'));
const Transactions = lazy(() => import('./views/Transactions'));
const TransactionFlow = lazy(() => import('./views/TransactionFlow'));
const Favorites = lazy(() => import('./views/Favorites'));
const MyListings = lazy(() => import('./views/MyListings'));
const EditListing = lazy(() => import('./views/EditListing'));
const ProhibitedItems = lazy(() => import('./views/ProhibitedItems'));

const LoadingFallback = () => (
  <div className="h-screen w-full flex flex-col items-center justify-center bg-brand-muted dark:bg-brand-dark">
    <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-primary animate-pulse">Cargando PASALO...</p>
  </div>
);

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-brand-accent text-white text-[10px] font-black uppercase py-2 text-center tracking-widest animate-pulse safe-pt shadow-lg">
      <i className="fa-solid fa-wifi-slash mr-2"></i> Sin conexión - Trabajando en modo local
    </div>
  );
};

const BottomNav = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const hideOn = ['/login', '/admin', '/transaction/', '/listing/'];
  if (hideOn.some(path => location.pathname.startsWith(path))) return null;
  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-brand-dark/95 backdrop-blur-xl border-t border-gray-100 dark:border-white/5 flex justify-around items-end pb-safe-bottom z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-all">
      <Link to="/" className={`flex flex-col items-center flex-1 py-4 transition-all duration-300 ${isActive('/') ? 'text-brand-primary' : 'text-gray-400'}`}>
        <div className={`transition-transform duration-300 ${isActive('/') ? 'scale-110 -translate-y-1' : ''}`}>
          <i className="fa-solid fa-house-chimney text-xl"></i>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Inicio</span>
      </Link>
      
      <Link to="/favorites" className={`flex flex-col items-center flex-1 py-4 transition-all ${isActive('/favorites') ? 'text-brand-primary' : 'text-gray-400'}`}>
        <div className={`transition-transform duration-300 ${isActive('/favorites') ? 'scale-110 -translate-y-1' : ''}`}>
          <i className="fa-solid fa-heart text-xl"></i>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Deseos</span>
      </Link>
      
      <div className="relative flex-1 flex justify-center h-14">
        <Link to="/create" className="absolute -top-7 w-16 h-16 bg-brand-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-brand-primary/40 border-4 border-white dark:border-brand-dark active:scale-90 transition-all duration-300 hover:rotate-90">
          <i className="fa-solid fa-plus text-2xl"></i>
        </Link>
      </div>

      <Link to="/chats" className={`flex flex-col items-center flex-1 py-4 transition-all ${isActive('/chats') ? 'text-brand-primary' : 'text-gray-400'}`}>
        <div className={`transition-transform duration-300 ${isActive('/chats') ? 'scale-110 -translate-y-1' : ''}`}>
          <div className="relative">
            <i className="fa-solid fa-comment-dots text-xl"></i>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-accent rounded-full border-2 border-white dark:border-brand-dark animate-bounce"></span>
          </div>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Chats</span>
      </Link>
      
      <Link to="/profile" className={`flex flex-col items-center flex-1 py-4 transition-all ${isActive('/profile') ? 'text-brand-primary' : 'text-gray-400'}`}>
        <div className={`transition-transform duration-300 ${isActive('/profile') ? 'scale-110 -translate-y-1' : ''}`}>
          <i className="fa-solid fa-user-astronaut text-xl"></i>
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest mt-1">Perfil</span>
      </Link>
    </nav>
  );
};

const AppRoutes = () => {
  const { user, loading, isAuthReady } = useAuth();
  const [lowDataMode, setLowDataMode] = useState<boolean>(() => JSON.parse(localStorage.getItem('lowDataMode') || 'false'));
  const [darkMode, setDarkMode] = useState<boolean>(() => JSON.parse(localStorage.getItem('darkMode') || 'false'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('lowDataMode', JSON.stringify(lowDataMode));
  }, [lowDataMode]);

  if (loading || !isAuthReady) return <LoadingFallback />;

  return (
    <div className="min-h-screen bg-brand-muted dark:bg-brand-dark text-gray-900 dark:text-white pb-24 transition-colors duration-300 overflow-x-hidden">
      <ConnectionStatus />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={user ? <Home lowDataMode={lowDataMode} /> : <Navigate to="/login" />} />
          <Route path="/listing/:id" element={user ? <ListingDetail /> : <Navigate to="/login" />} />
          <Route path="/create" element={user ? <CreateListing user={user} /> : <Navigate to="/login" />} />
          <Route path="/chats" element={user ? <ChatList user={user} /> : <Navigate to="/login" />} />
          <Route path="/chat/:id" element={user ? <ChatDetail user={user} /> : <Navigate to="/login" />} />
          <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/ratings" element={user ? <Ratings user={user} /> : <Navigate to="/login" />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/transactions" element={user ? <Transactions /> : <Navigate to="/login" />} />
          <Route path="/transaction/:id" element={user ? <TransactionFlow user={user} /> : <Navigate to="/login" />} />
          <Route path="/favorites" element={user ? <Favorites lowDataMode={lowDataMode} /> : <Navigate to="/login" />} />
          <Route path="/my-listings" element={user ? <MyListings user={user} /> : <Navigate to="/login" />} />
          <Route path="/edit-listing/:id" element={user ? <EditListing user={user} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile 
            user={user} 
            darkMode={darkMode} 
            onToggleDarkMode={() => setDarkMode(!darkMode)} 
            lowDataMode={lowDataMode}
            onToggleLowData={() => setLowDataMode(!lowDataMode)}
          /> : <Navigate to="/login" />} />
          <Route path="/prohibited-items" element={<ProhibitedItems />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/" />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
      <BottomNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </Router>
  );
};

export default App;
