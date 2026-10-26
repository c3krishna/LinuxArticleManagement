import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// Hides UI only; every protected endpoint is enforced by the API as well.
function RequireAuth({ adminOnly = false, children }) {
    const { user, checking, isAdmin } = useAuth();
    const location = useLocation();

    if (checking) {
        return <div className="px-6 py-20 text-center text-slate-500" role="status">Checking your session…</div>;
    }

    if (!user) {
        const next = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/login?next=${next}`} replace />;
    }

    if (adminOnly && !isAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="max-w-md text-center">
                    <h1 className="text-[24px] font-semibold text-navy mb-2">Admins only</h1>
                    <p className="text-slate-600 mb-6">
                        Your account can read every article but cannot change them. Ask an administrator if you need editor access.
                    </p>
                    <a href="/" className="text-blue-700 font-medium hover:underline">← Back to articles</a>
                </div>
            </div>
        );
    }

    return children;
}

export default RequireAuth;
