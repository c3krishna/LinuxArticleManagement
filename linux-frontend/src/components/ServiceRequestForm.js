import { useMemo, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { MAX_BOOKING_DAYS, SERVICE_NAMES, SLOTS } from '../data/services';

const INPUT = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 aria-[invalid=true]:border-rose-500';
const BUDGETS = ['Under ₹5,000', '₹5,000 – ₹20,000', '₹20,000 – ₹50,000', 'Over ₹50,000', 'Not sure yet'];

// YYYY-MM-DD for a day offset from today, in the visitor's local calendar.
function isoDay(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Field({ id, label, optional, error, children }) {
    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-[14px] font-medium text-ink">
                {label}{optional && <span className="font-normal text-slate-500"> (optional)</span>}
            </label>
            {children}
            {error && <p id={`${id}-error`} className="mt-1.5 text-[13px] font-medium text-rose-700">{error}</p>}
        </div>
    );
}

// One form for both enquiries and appointment bookings; `type` decides the extra fields.
function ServiceRequestForm({ type, initialService, initialMessage = '' }) {
    const { user } = useAuth();
    const booking = type === 'booking';
    const [form, setForm] = useState(() => ({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        company: '',
        service: SERVICE_NAMES.includes(initialService) ? initialService : '',
        message: initialMessage,
        budget: '',
        preferred_date: '',
        preferred_slot: '',
        website: ''
    }));
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(null);
    const formRef = useRef(null);
    const limits = useMemo(() => ({ min: isoDay(1), max: isoDay(MAX_BOOKING_DAYS - 1) }), []);

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        if (errors[key]) setErrors((x) => ({ ...x, [key]: undefined }));
    };

    const invalid = (key) => ({
        'aria-invalid': errors[key] ? true : undefined,
        'aria-describedby': errors[key] ? `${type}-${key}-error` : undefined
    });

    const submit = async (e) => {
        e.preventDefault();
        setSending(true);
        setErrors({});
        try {
            const res = await api.post('/api/service-requests', { ...form, type });
            setDone(res.data.id);
        } catch (err) {
            const field = err.response?.data?.field;
            setErrors({ [field || 'form']: errorMessage(err) });
            if (field) formRef.current?.querySelector(`#${type}-${field}`)?.focus();
        } finally {
            setSending(false);
        }
    };

    if (done !== null) {
        return (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6" role="status">
                <CheckCircle2 size={28} aria-hidden="true" className="text-emerald-700" />
                <h2 className="mt-2 text-[20px] font-semibold text-navy">{booking ? 'Booking request received' : 'Thanks, we have your enquiry'}</h2>
                <p className="mt-1 text-[15px] text-slate-700">
                    {booking
                        ? 'We will call or email you to confirm the exact time, usually within one working day.'
                        : 'We usually reply within one working day.'}
                    {done > 0 && <> Your reference is <strong>#{done}</strong>.</>}
                </p>
            </div>
        );
    }

    const id = (key) => `${type}-${key}`;

    return (
        <form ref={formRef} onSubmit={submit} noValidate className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Field id={id('name')} label="Your name" error={errors.name}>
                    <input id={id('name')} value={form.name} onChange={set('name')} autoComplete="name" className={INPUT} {...invalid('name')} />
                </Field>
                <Field id={id('email')} label="Email" error={errors.email}>
                    <input id={id('email')} type="email" value={form.email} onChange={set('email')} autoComplete="email" className={INPUT} {...invalid('email')} />
                </Field>
                <Field id={id('phone')} label="Phone or WhatsApp" optional={!booking} error={errors.phone}>
                    <input id={id('phone')} type="tel" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="+91 98765 43210" className={INPUT} {...invalid('phone')} />
                </Field>
                <Field id={id('company')} label="Company" optional error={errors.company}>
                    <input id={id('company')} value={form.company} onChange={set('company')} autoComplete="organization" className={INPUT} />
                </Field>
            </div>

            <Field id={id('service')} label="Service" error={errors.service}>
                <select id={id('service')} value={form.service} onChange={set('service')} className={INPUT} {...invalid('service')}>
                    <option value="">Choose a service…</option>
                    {SERVICE_NAMES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
            </Field>

            {booking ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field id={id('preferred_date')} label="Preferred date" error={errors.preferred_date}>
                        <input id={id('preferred_date')} type="date" min={limits.min} max={limits.max} value={form.preferred_date} onChange={set('preferred_date')} className={INPUT} {...invalid('preferred_date')} />
                    </Field>
                    <Field id={id('preferred_slot')} label="Time of day (IST)" error={errors.preferred_slot}>
                        <select id={id('preferred_slot')} value={form.preferred_slot} onChange={set('preferred_slot')} className={INPUT} {...invalid('preferred_slot')}>
                            <option value="">Choose a time…</option>
                            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </Field>
                </div>
            ) : (
                <Field id={id('budget')} label="Budget" optional error={errors.budget}>
                    <select id={id('budget')} value={form.budget} onChange={set('budget')} className={INPUT}>
                        <option value="">Choose a range…</option>
                        {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                </Field>
            )}

            <Field id={id('message')} label={booking ? 'What should we look at?' : 'Describe the issue'} optional={booking} error={errors.message}>
                <textarea id={id('message')} rows={5} value={form.message} onChange={set('message')} maxLength={4000}
                    placeholder={booking ? 'Server, symptoms, anything we should prepare' : 'What is happening, since when, and what you have tried'}
                    className={INPUT} {...invalid('message')} />
            </Field>

            {/* Honeypot: hidden from people and screen readers, filled in only by bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
                <label htmlFor={id('website')}>Leave this empty</label>
                <input id={id('website')} tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
            </div>

            {errors.form && <p className="rounded-md bg-rose-50 px-3 py-2 text-[14px] font-medium text-rose-800" role="alert">{errors.form}</p>}

            <div className="flex flex-wrap items-center gap-3">
                <button type="submit" disabled={sending} className="rounded-md bg-blue-600 px-5 py-2.5 text-[15px] font-medium text-white hover:bg-blue-500 disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
                    {sending ? 'Sending…' : booking ? 'Request appointment' : 'Send enquiry'}
                </button>
                <p className="text-[13px] text-slate-500">We use these details only to reply to you. See our <a href="/privacy-policy" className="underline">privacy policy</a>.</p>
            </div>
        </form>
    );
}

export default ServiceRequestForm;
