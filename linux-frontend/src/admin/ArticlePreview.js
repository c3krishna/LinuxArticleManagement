import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { formatDateTime } from '../lib/format';
import ArticleView from '../components/ArticleView';

const NOTE = {
    draft: 'This is a draft. Only admins can see it.',
    scheduled: 'Scheduled. Visitors will see it from',
    published: 'Published. This is how visitors see it.'
};

// Saved version of any article, including drafts, rendered with the public layout.
function ArticlePreview() {
    const { id } = useParams();
    const [doc, setDoc] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get(`/api/admin/articles/${id}`)
            .then((res) => setDoc(res.data))
            .catch((err) => setError(errorMessage(err, 'Article not found')));
    }, [id]);

    if (error) {
        return <div className="px-6 py-20 text-center text-slate-600">{error}</div>;
    }
    if (!doc) {
        return <div className="px-6 py-20 text-slate-500" role="status">Loading preview…</div>;
    }

    return (
        <ArticleView
            doc={doc}
            banner={(
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-2.5 text-[14px] text-amber-900" role="note">
                    <span>
                        <strong>Preview.</strong> {NOTE[doc.status]}
                        {doc.status === 'scheduled' ? ` ${formatDateTime(doc.scheduled_at)}.` : ''}
                    </span>
                    <Link to={`/admin/articles/${doc.id}/edit`} className="font-semibold text-blue-800 underline">Back to editor</Link>
                </div>
            )}
        />
    );
}

export default ArticlePreview;
