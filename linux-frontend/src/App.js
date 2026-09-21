import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './Home';
import Document from './Document';
import Tutorials from './Tutorials';
import Kubernetes from './Kubernetes';
import Docker from './Docker';
import Admin from './Admin';
import AdminList from './AdminList';
import EditDocument from './EditDocument';
import Login from './Login';
import Register from './Register';
import Issues from './pages/Issues';
import CheatSheets from './pages/CheatSheets';
import LinuxCrash from './pages/LinuxCrash';
import Networking from './pages/Networking';
import GPU from './pages/GPU';
import Forum from './pages/Forum';
import Question from './pages/Question';
import AskQuestion from './pages/AskQuestion';

function AppContent() {
  const location = useLocation();
  const compact = location.pathname.startsWith('/admin') || location.pathname.split('/').filter(Boolean).length === 1;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/kubernetes" element={<Kubernetes />} />
          <Route path="/docker" element={<Docker />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/admin/list" element={<ProtectedRoute><AdminList /></ProtectedRoute>} />
          <Route path="/admin/edit/:id" element={<ProtectedRoute><EditDocument /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/cheatsheets" element={<CheatSheets />} />
          <Route path="/linux-crash" element={<LinuxCrash />} />
          <Route path="/networking" element={<Networking />} />
          <Route path="/gpu" element={<GPU />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/question/:id" element={<Question />} />
          <Route path="/ask-question" element={<AskQuestion />} />
          <Route path="/forum/:slug" element={<Question />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/:slug" element={<Document />} />
        </Routes>
      </main>
      {!compact && (
        <footer className="border-t border-slate-200 bg-white py-4">
          <div className="px-6 flex items-center justify-between text-[13px] text-slate-500">
            <span>© 2026 Linux Docs</span>
            <Link to="/privacy-policy" className="hover:text-navy">Privacy</Link>
          </div>
        </footer>
      )}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
