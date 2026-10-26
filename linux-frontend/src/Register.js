import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell, { AUTH_BUTTON, AUTH_INPUT, Notice, PasswordInput } from './components/AuthShell';
import api, { errorMessage } from './lib/api';

function Register() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((er) => ({ ...er, [key]: undefined, form: undefined }));
    };

    const validate = () => {
        const next = {};
        if (form.name.trim().length < 2) next.name = 'Enter your name';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address';
        if (form.password.length < 8) next.password = 'Use at least 8 characters';
        if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
        return next;
    };

    const submit = async (e) => {
        e.preventDefault();
        const found = validate();
        if (Object.keys(found).length) {
            setErrors(found);
            return;
        }
        setSubmitting(true);
        try {
            await api.post('/api/register', { name: form.name.trim(), email: form.email.trim(), password: form.password });
            navigate(`/login?registered=1&email=${encodeURIComponent(form.email.trim())}`, { replace: true });
        } catch (err) {
            const field = err.response?.data?.field;
            setErrors({ [field || 'form']: errorMessage(err, 'Registration failed. Please try again') });
            setSubmitting(false);
        }
    };

    const fieldError = (key) => errors[key] && (
        <p id={`reg-${key}-error`} className="mt-1.5 text-[12px] font-medium text-adm-red">{errors[key]}</p>
    );

    return (
        <AuthShell
            title="Create your account"
            subtitle="Free reader account: read every article and join the forum."
            footer={<>Already have an account? <Link to="/login" className="font-semibold text-adm-blue hover:underline">Sign in</Link></>}
        >
            {errors.form && <Notice tone="error">{errors.form}</Notice>}
            <form onSubmit={submit} className="space-y-4" noValidate>
                <div>
                    <label htmlFor="reg-name" className="mb-1.5 block text-[13px] font-semibold text-[#3d4a62]">Name</label>
                    <input id="reg-name" value={form.name} onChange={set('name')} autoComplete="name" className={AUTH_INPUT} aria-invalid={Boolean(errors.name) || undefined} aria-describedby={errors.name ? 'reg-name-error' : undefined} required autoFocus />
                    {fieldError('name')}
                </div>
                <div>
                    <label htmlFor="reg-email" className="mb-1.5 block text-[13px] font-semibold text-[#3d4a62]">Email</label>
                    <input id="reg-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" className={AUTH_INPUT} aria-invalid={Boolean(errors.email) || undefined} aria-describedby={errors.email ? 'reg-email-error' : undefined} required />
                    {fieldError('email')}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="reg-password" className="mb-1.5 block text-[13px] font-semibold text-[#3d4a62]">Password</label>
                        <PasswordInput id="reg-password" value={form.password} onChange={set('password')} autoComplete="new-password" invalid={Boolean(errors.password)} describedBy={errors.password ? 'reg-password-error' : 'reg-password-hint'} />
                        {errors.password ? fieldError('password') : <p id="reg-password-hint" className="mt-1.5 text-[12px] text-adm-muted">At least 8 characters</p>}
                    </div>
                    <div>
                        <label htmlFor="reg-confirm" className="mb-1.5 block text-[13px] font-semibold text-[#3d4a62]">Confirm password</label>
                        <PasswordInput id="reg-confirm" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" invalid={Boolean(errors.confirm)} describedBy={errors.confirm ? 'reg-confirm-error' : undefined} />
                        {fieldError('confirm')}
                    </div>
                </div>
                <button type="submit" disabled={submitting} className={AUTH_BUTTON}>{submitting ? 'Creating account…' : 'Create account'}</button>
            </form>
        </AuthShell>
    );
}

export default Register;
