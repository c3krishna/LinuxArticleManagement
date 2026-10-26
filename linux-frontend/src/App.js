import {
    createBrowserRouter,
    createRoutesFromElements,
    Link,
    Navigate,
    Outlet,
    Route,
    RouterProvider,
    useLocation,
    useParams,
    useSearchParams
} from 'react-router-dom';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Navbar from './components/Navbar';
import RequireAuth from './components/RequireAuth';
import Home from './Home';
import Articles from './Articles';
import Account from './Account';
import Document from './Document';
import Tutorials from './Tutorials';
import Kubernetes from './Kubernetes';
import Docker from './Docker';
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
import AdminLayout from './admin/AdminLayout';
import ArticlesPage from './admin/ArticlesPage';
import ArticleEditor from './admin/ArticleEditor';
import ArticlePreview from './admin/ArticlePreview';
import CategoriesPage from './admin/CategoriesPage';
import UsersPage from './admin/UsersPage';
import AnalyticsPage from './admin/AnalyticsPage';
import { AuthProvider } from './lib/auth';

function PublicShell() {
    const location = useLocation();
    const compact = location.pathname.split('/').filter(Boolean).length === 1;

    return (
        <div className="min-h-screen bg-paper text-ink flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 w-full">
                <Outlet />
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

// Old editor links (/admin?edit=12, /admin/edit/12, /admin/list) keep working.
function AdminIndexRedirect() {
    const [params] = useSearchParams();
    const editId = Number(params.get('edit'));
    return <Navigate to={editId > 0 ? `/admin/articles/${editId}/edit` : '/admin/articles'} replace />;
}

function LegacyEditRedirect() {
    const { id } = useParams();
    return <Navigate to={`/admin/articles/${id}/edit`} replace />;
}

const router = createBrowserRouter(createRoutesFromElements(
    <>
        <Route path="/admin" element={<RequireAuth adminOnly><AdminLayout /></RequireAuth>}>
            <Route index element={<AdminIndexRedirect />} />
            <Route path="articles" element={<ArticlesPage />} />
            <Route path="articles/new" element={<ArticleEditor />} />
            <Route path="articles/:id/edit" element={<ArticleEditor />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="list" element={<Navigate to="/admin/articles" replace />} />
            <Route path="edit/:id" element={<LegacyEditRedirect />} />
            <Route path="*" element={<Navigate to="/admin/articles" replace />} />
        </Route>

        <Route element={<PublicShell />}>
            <Route path="/admin/articles/:id/preview" element={<RequireAuth adminOnly><ArticlePreview /></RequireAuth>} />
            <Route path="/" element={<Home />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
            <Route path="/tutorials" element={<Tutorials />} />
            <Route path="/kubernetes" element={<Kubernetes />} />
            <Route path="/docker" element={<Docker />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/cheatsheets" element={<CheatSheets />} />
            <Route path="/linux-crash" element={<LinuxCrash />} />
            <Route path="/networking" element={<Networking />} />
            <Route path="/gpu" element={<GPU />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/question/:slug" element={<Question />} />
            <Route path="/ask-question" element={<AskQuestion />} />
            <Route path="/forum/:slug" element={<Question />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/:slug" element={<Document />} />
        </Route>
    </>
));

function App() {
    return (
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    );
}

export default App;
