import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Forum() {
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        axios.get('/api/forum/questions')
            .then((res) => setQuestions(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.error(err));
    }, []);

    return (
        <div className="px-4 sm:px-8 py-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-semibold text-navy">Forum</h1>
                    <p className="text-[15px] text-slate-500 mt-1">Ask questions and share fixes.</p>
                </div>
                <Link to="/ask-question" className="bg-blue-600 text-white px-4 py-2 rounded-md text-[14px] font-medium">
                    Ask question
                </Link>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                {questions.map((q, index) => (
                    <Link
                        key={q.id}
                        to={`/forum/${q.slug}`}
                        className={`block px-4 py-3 hover:bg-slate-50 ${index !== 0 ? 'border-t border-slate-100' : ''}`}
                    >
                        <h2 className="text-[16px] font-medium text-ink">{q.title}</h2>
                        <p className="text-[13px] text-slate-500">Asked by {q.name || 'Anonymous'}</p>
                    </Link>
                ))}
                {questions.length === 0 && (
                    <p className="px-4 py-10 text-center text-slate-500 text-[15px]">No questions yet.</p>
                )}
            </div>
        </div>
    );
}

export default Forum;
