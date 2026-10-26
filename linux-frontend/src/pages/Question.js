import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { useAuth } from '../lib/auth';

// Forum posts come from any signed-in user, so they are rendered as plain text, never as HTML.
function Question() {
    const { slug } = useParams();
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(() => {
        axios.get(`/api/forum/question/${slug}`)
            .then((res) => setData(res.data))
            .catch(() => setNotFound(true));
    }, [slug]);

    useEffect(() => { load(); }, [load]);

    if (notFound) {
        return (
            <div className="px-6 py-20 text-center">
                <h1 className="text-[28px] font-semibold text-navy mb-3">Question not found</h1>
                <Link to="/forum" className="text-blue-700 font-medium">← Back to the forum</Link>
            </div>
        );
    }

    if (!data) {
        return <div className="px-6 py-20 text-slate-500" role="status">Loading…</div>;
    }

    const submitAnswer = async (e) => {
        e.preventDefault();
        if (!answer.trim()) return;
        setSubmitting(true);
        setError('');
        try {
            await api.post('/api/forum/answer', { question_id: data.question.id, answer });
            setAnswer('');
            load();
        } catch (err) {
            setError(errorMessage(err, 'Could not post your answer'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
            <Link to="/forum" className="text-[13px] text-blue-700 hover:underline">← Forum</Link>
            <div className="bg-white border border-slate-200 rounded-lg p-6 mt-3 mb-6">
                <h1 className="text-[28px] font-semibold text-navy mb-2">{data.question.title}</h1>
                <p className="text-[13px] text-slate-500 mb-5">Asked by {data.question.name || 'a former member'}</p>
                <p className="whitespace-pre-wrap break-words text-[16px] leading-relaxed text-ink">{data.question.content}</p>
            </div>

            <h2 className="text-[18px] font-semibold text-navy mb-3">
                {data.answers.length} {data.answers.length === 1 ? 'answer' : 'answers'}
            </h2>
            <div className="space-y-3 mb-8">
                {data.answers.map((a) => (
                    <div key={a.id} className="bg-white border border-slate-200 rounded-lg p-5">
                        <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">{a.answer}</p>
                        <p className="text-slate-500 mt-3 text-[13px]">Answered by {a.name || 'a former member'}</p>
                    </div>
                ))}
            </div>

            {user ? (
                <form onSubmit={submitAnswer} className="bg-white border border-slate-200 rounded-lg p-5">
                    <label htmlFor="answer" className="block text-[16px] font-semibold text-navy mb-3">Your answer</label>
                    {error && <p className="text-[14px] text-rose-700 mb-2" role="alert">{error}</p>}
                    <textarea
                        id="answer"
                        rows="6"
                        className="w-full border border-slate-300 rounded-md p-3 text-[14px] mb-3 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                    />
                    <button type="submit" disabled={submitting || !answer.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-4 py-2 rounded-md text-[14px] font-medium">
                        {submitting ? 'Posting…' : 'Post answer'}
                    </button>
                </form>
            ) : (
                <p className="bg-white border border-slate-200 rounded-lg p-5 text-[15px] text-slate-600">
                    <Link to={`/login?next=${encodeURIComponent(`/forum/${slug}`)}`} className="text-blue-700 font-medium">Log in</Link> to answer this question.
                </p>
            )}
        </div>
    );
}

export default Question;
