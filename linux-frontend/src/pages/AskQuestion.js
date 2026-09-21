import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AskQuestion() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');

    const submitQuestion = async () => {
        if (!title.trim() || !content.trim()) return alert('Please fill out required fields.');
        const slug = title.toLowerCase().replaceAll(' ', '-');
        try {
            await axios.post('/api/forum/questions', {
                title,
                slug,
                content,
                tags,
                user_id: localStorage.getItem('user_id')
            });
            navigate('/forum');
        } catch (err) {
            console.error(err);
        }
    };

    const field = 'w-full border border-slate-300 rounded-md p-3 text-[14px] bg-white';

    return (
        <div className="px-4 sm:px-8 py-8 max-w-3xl">
            <h1 className="text-[28px] font-semibold text-navy mb-6">Ask a question</h1>
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={field} />
                <textarea rows="8" placeholder="Details" value={content} onChange={(e) => setContent(e.target.value)} className={field} />
                <input type="text" placeholder="Tags" value={tags} onChange={(e) => setTags(e.target.value)} className={field} />
                <button onClick={submitQuestion} className="bg-blue-600 text-white px-4 py-2 rounded-md text-[14px] font-medium">
                    Post
                </button>
            </div>
        </div>
    );
}

export default AskQuestion;
