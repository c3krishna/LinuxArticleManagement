import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell, { AUTH_BUTTON, AUTH_INPUT, Notice, PasswordInput, safeNext } from './components/AuthShell';
import { errorMessage } from './lib/api';
import { useAuth } from './lib/auth';

function Login() {
    const navigate = useNavigate();
    const [params] = useSearchParams();
    const { user, login } = useAuth();
    const [email, setEmail] = useState(params.get('email') || '');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const next = safeNext(params.get('next'));

    const destination = (u) => next || (u.role === 'admin' ? '/admin/articles' : '/');

    useEffect(() => {
        if (user) navigate(destination(user), { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const submit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError('Enter your email and password');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            // Redirect happens in the effect above once the user is set.
            await login(email.trim(), password);
        } catch (err) {
            setError(errorMessage(err, 'Could not sign in. Please try again'));
            setSubmitting(false);
        }
    };

    return (
        <AuthShell
            title="Welcome back"
            subtitle="Sign in to your LinuxDocs account."
            footer={<>New here? <Link to="/register" className="font-semibold text-adm-blue hover:underline">Create an account</Link></>}
        >
            {params.get('registered') && <Notice>Account created. Sign in to continue.</Notice>}
            {params.get('expired') && !error && <Notice>Your session ended. Please sign in again.</Notice>}
            {error && <Notice tone="error">{error}</Notice>}

            <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                    <label htmlFor="login-email" className="mb-1.5 block text-[13px] font-semibold text-[#3d4a62]">Email</label>
                    <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={AUTH_INPUT} aria-invalid={Boolean(error) || undefined} required autoFocus={!email} />
                </div>
                <div>
                    <label htmlFor="login-password" className="mb-1.5 block text-[13px] font-semibold text-[#3d4a62]">Password</label>
                    <PasswordInput id="login-password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" invalid={Boolean(error)} />
                </div>
                <button type="submit" disabled={submitting} className={AUTH_BUTTON}>{submitting ? 'Signing in…' : 'Sign in'}</button>
            </form>
            <p className="mt-4 text-[12px] text-adm-muted">Forgot your password? Ask an administrator to reset it from Users &amp; roles.</p>
        </AuthShell>
    );
}

export default Login;
