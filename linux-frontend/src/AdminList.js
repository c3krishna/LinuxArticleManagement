import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function AdminList() {
    const [docs, setDocs] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [error, setError] = useState('');

    const getAxiosConfig = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const loadDocuments = () => {
        axios
            .get('/api/admin/documents', getAxiosConfig())
            .then((res) => setDocs(Array.isArray(res.data) ? res.data : []))
            .catch((err) => {
                if (err.response?.status === 401) {
                    window.location.href = '/login';
                    return;
                }
                setError('Could not load documents. Check that the API is running.');
            });
    };

    useEffect(() => {
        loadDocuments();
    }, []);

    const deleteDocument = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        try {
            await axios.delete(`/api/admin/document/${id}`, getAxiosConfig());
            loadDocuments();
        } catch (err) {
            alert('Delete failed. Admin login is required.');
        }
    };

    const filtered = docs.filter((doc) =>
        `${doc.title} ${doc.category}`.toLowerCase().includes(keyword.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-white">Manage Documents</h1>
                    <p className="text-hub-muted mt-2">Edit or delete documentation from the live catalog.</p>
                </div>
                <Link
                    to="/admin"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold text-center"
                >
                    Add New
                </Link>
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Filter by title or category"
                    className="w-full sm:max-w-md border border-white/10 rounded-xl p-3 bg-hub-panel text-white"
                />
            </div>

            {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            <div className="bg-hub-card rounded-3xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-white/5 bg-hub-bg/50">
                                <th className="p-5 text-left font-bold text-hub-muted">Title</th>
                                <th className="p-5 text-left font-bold text-hub-muted">Category</th>
                                <th className="p-5 text-left font-bold text-hub-muted">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((doc) => (
                                <tr key={doc.id} className="border-b border-white/5 last:border-0">
                                    <td className="p-5 font-semibold text-white">{doc.title}</td>
                                    <td className="p-5 text-hub-muted">{doc.category}</td>
                                    <td className="p-5">
                                        <div className="flex flex-wrap gap-3">
                                            <Link
                                                to={`/admin/edit/${doc.id}`}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => deleteDocument(doc.id)}
                                                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-semibold"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-slate-500">
                                        No documents found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default AdminList;
