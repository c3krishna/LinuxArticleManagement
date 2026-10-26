import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import ArticleView from './components/ArticleView';
import { useAuth } from './lib/auth';

function Document() {
    const { slug } = useParams();
    const { isAdmin } = useAuth();
    const [doc, setDoc] = useState(null);
    const [nav, setNav] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        setDoc(null);
        setNav({});
        setError('');
        axios
            .get(`/api/documents/${slug}`)
            .then((res) => {
                setDoc(res.data);
                // The API counts one view per visitor per day, so repeat renders are harmless.
                axios.post('/api/view', { document_id: res.data.id }).catch(() => {});
                return axios.get(`/api/navigation/${res.data.id}`);
            })
            .then((navRes) => {
                if (navRes) setNav(navRes.data);
            })
            .catch(() => setError('This article could not be found.'));
    }, [slug]);

    if (error) {
        return (
            <div className="px-6 py-20 text-center">
                <h1 className="text-[28px] font-semibold text-navy mb-3">Article not found</h1>
                <p className="text-slate-500 mb-6">{error}</p>
                <Link to="/" className="text-blue-700 font-medium">← All documents</Link>
            </div>
        );
    }

    if (!doc) {
        return <div className="px-6 py-20 text-slate-500" role="status">Loading document...</div>;
    }

    return (
        <ArticleView
            doc={doc}
            related={[nav.previous, nav.next].filter(Boolean)}
            headerAction={isAdmin && (
                <Link
                    to={`/admin/articles/${doc.id}/edit`}
                    className="text-[13px] font-medium bg-navy text-white px-3 py-1.5 rounded-md hover:bg-[#16355c]"
                >
                    Edit document
                </Link>
            )}
        />
    );
}

export default Document;
