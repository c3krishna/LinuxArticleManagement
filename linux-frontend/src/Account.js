import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, Trash2 } from 'lucide-react';
import api, { errorMessage } from './lib/api';
import { useAuth } from './lib/auth';
import { initials } from './lib/format';

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

function Account() {
    const { user, isAdmin, updateUser } = useAuth();
    const inputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

    const upload = async (file) => {
        setMessage(null);
        if (!TYPES.includes(file.type)) {
            setMessage({ tone: 'error', text: 'Choose a PNG, JPEG, GIF or WebP image.' });
            return;
        }
        if (file.size > MAX_BYTES) {
            setMessage({ tone: 'error', text: 'Photos must be 2 MB or smaller.' });
            return;
        }
        setPreview(URL.createObjectURL(file));
        setBusy(true);
        try {
            const data = new FormData();
            data.append('file', file);
            const res = await api.post('/api/me/avatar', data);
            updateUser({ avatar_url: res.data.avatar_url });
            setMessage({ tone: 'ok', text: 'Profile photo updated.' });
        } catch (err) {
            setMessage({ tone: 'error', text: errorMessage(err, 'Upload failed. Please try again.') });
        } finally {
            setPreview(null);
            setBusy(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const remove = async () => {
        setBusy(true);
        setMessage(null);
        try {
            await api.delete('/api/me/avatar');
            updateUser({ avatar_url: null });
            setMessage({ tone: 'ok', text: 'Profile photo removed.' });
        } catch (err) {
            setMessage({ tone: 'error', text: errorMessage(err, 'Could not remove the photo.') });
        } finally {
            setBusy(false);
        }
    };

    const shown = preview || user.avatar_url;

    return (
        <div className="mx-auto max-w-2xl px-4 sm:px-8 py-10">
            <h1 className="text-[28px] font-semibold text-navy">My account</h1>
            <p className="text-[15px] text-slate-500 mt-1 mb-6">Your profile photo appears next to your name across the site.</p>

            <section className="rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="photo-heading">
                <h2 id="photo-heading" className="text-[17px] font-semibold text-navy mb-4">Profile photo</h2>
                <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    {shown ? (
                        <img src={shown} alt={user.name} className={`h-24 w-24 rounded-full object-cover ring-1 ring-slate-200 ${busy ? 'opacity-60' : ''}`} />
                    ) : (
                        <span className="grid h-24 w-24 place-items-center rounded-full bg-blue-100 text-[28px] font-semibold text-blue-800" aria-hidden="true">{initials(user.name)}</span>
                    )}
                    <div>
                        <div className="flex flex-wrap gap-2">
                            <input
                                ref={inputRef}
                                id="avatar-file"
                                type="file"
                                accept={TYPES.join(',')}
                                className="sr-only"
                                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                                disabled={busy}
                            />
                            <label
                                htmlFor="avatar-file"
                                className={`inline-flex cursor-pointer items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-[14px] font-medium text-white hover:bg-blue-700 [input:focus-visible+&]:ring-4 [input:focus-visible+&]:ring-blue-300 ${busy ? 'pointer-events-none opacity-60' : ''}`}
                            >
                                <Camera size={16} aria-hidden="true" /> {busy ? 'Uploading…' : user.avatar_url ? 'Change photo' : 'Upload photo'}
                            </label>
                            {user.avatar_url && (
                                <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-[14px] font-medium text-slate-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-60 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
                                    <Trash2 size={16} aria-hidden="true" /> Remove
                                </button>
                            )}
                        </div>
                        <p className="mt-2 text-[13px] text-slate-500">PNG, JPEG, GIF or WebP, up to 2 MB. A square photo looks best.</p>
                    </div>
                </div>
                {message && (
                    <p className={`mt-4 text-[14px] font-medium ${message.tone === 'error' ? 'text-rose-700' : 'text-emerald-700'}`} role={message.tone === 'error' ? 'alert' : 'status'}>
                        {message.text}
                    </p>
                )}
            </section>

            <section className="mt-5 rounded-lg border border-slate-200 bg-white p-6" aria-labelledby="details-heading">
                <h2 id="details-heading" className="text-[17px] font-semibold text-navy mb-3">Details</h2>
                <dl className="grid grid-cols-[110px_1fr] gap-y-2 text-[15px]">
                    <dt className="text-slate-500">Name</dt><dd className="text-ink">{user.name}</dd>
                    <dt className="text-slate-500">Email</dt><dd className="text-ink break-all">{user.email}</dd>
                    <dt className="text-slate-500">Role</dt><dd className="text-ink">{isAdmin ? 'Admin: can write, publish and manage users' : 'Reader: can read articles and post in the forum'}</dd>
                </dl>
                {isAdmin && <Link to="/admin/articles" className="mt-4 inline-block text-[14px] font-medium text-blue-700 hover:underline">Go to the admin workspace →</Link>}
            </section>
        </div>
    );
}

export default Account;
