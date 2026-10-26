import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';
import { slugify } from '../lib/format';

function AskQuestion() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!user) {
        return (
            <div className="px-4 sm:px-8 py-16 max-w-xl">
                <h1 className="text-[28px] font-semibold text-navy mb-2">Ask a question</h1>
                <p className="text-slate-600 mb-6">Log in or create a free account to ask the community.</p>
                <div className="flex gap-3">
                    <Link to="/login?next=%2Fask-question" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-[14px] font-medium">Log in</Link>
                    <Link to="/register" className="border border-slate-300 bg-white px-4 py-2 rounded-md text-[14px] font-medium text-slate-700">Create account</Link>
                </div>
            </div>
        );
    }

    const submitQuestion = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setError('Add a title and some details.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const res = await api.post('/api/forum/questions', { title, slug: slugify(title), content, tags });
            navigate(`/forum/${res.data.slug}`);
        } catch (err) {
            setError(errorMessage(err, 'Could not post your question'));
            setSubmitting(false);
        }
    };

    const field = 'w-full border border-slate-300 rounded-md p-3 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';

    return (
        <div className="px-4 sm:px-8 py-8 max-w-3xl">
            <h1 className="text-[28px] font-semibold text-navy mb-6">Ask a question</h1>
            <form onSubmit={submitQuestion} className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                {error && <p className="text-[14px] text-rose-700" role="alert">{error}</p>}
                <div>
                    <label htmlFor="q-title" className="block text-[13px] font-medium text-slate-700 mb-1">Title</label>
                    <input id="q-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={field} maxLength={255} />
                </div>
                <div>
                    <label htmlFor="q-details" className="block text-[13px] font-medium text-slate-700 mb-1">Details</label>
                    <textarea id="q-details" rows="8" value={content} onChange={(e) => setContent(e.target.value)} className={field} />
                </div>
                <div>
                    <label htmlFor="q-tags" className="block text-[13px] font-medium text-slate-700 mb-1">Tags <span className="font-normal text-slate-500">(comma separated)</span></label>
                    <input id="q-tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} className={field} />
                </div>
                <button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-[14px] font-medium">
                    {submitting ? 'Posting…' : 'Post question'}
                </button>
            </form>
        </div>
    );
}

export default AskQuestion;
