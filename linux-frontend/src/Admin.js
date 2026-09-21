import { useEffect, useState } from 'react';
import axios from 'axios';
import { Editor } from '@tinymce/tinymce-react';
import { useSearchParams } from 'react-router-dom';

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function Admin() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [docs, setDocs] = useState([]);
    const [docFilter, setDocFilter] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [category, setCategory] = useState('Linux');
    const [content, setContent] = useState('');
    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
    const [isLoading, setIsLoading] = useState(false);
    const [slugLocked, setSlugLocked] = useState(false);

    const getAxiosConfig = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    const showNotification = (message, type = 'success') => {
        setNotification({ show: true, message, type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
    };

    const loadDocuments = () => {
        axios.get('/api/admin/documents', getAxiosConfig())
            .then((res) => setDocs(Array.isArray(res.data) ? res.data : []))
            .catch((err) => {
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                }
            });
    };

    const loadDocument = async (id) => {
        try {
            const res = await axios.get(`/api/admin/document/${id}`, getAxiosConfig());
            setSelectedId(id);
            setTitle(res.data.title || '');
            setSlug(res.data.slug || '');
            setCategory(res.data.category || 'Linux');
            setContent(res.data.content || '');
            setSlugLocked(true);
            setSearchParams({ edit: String(id) });
        } catch (err) {
            showNotification('Failed to load document', 'error');
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        loadDocuments();
        const editId = searchParams.get('edit');
        if (editId) loadDocument(Number(editId));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetForm = () => {
        setSelectedId(null);
        setTitle('');
        setSlug('');
        setCategory('Linux');
        setContent('');
        setSlugLocked(false);
        setSearchParams({});
    };

    const onTitleChange = (value) => {
        setTitle(value);
        if (!slugLocked) setSlug(slugify(value));
    };

    const saveDocument = async () => {
        if (!title.trim() || !slug.trim() || !content.trim()) {
            showNotification('Title, slug, and content are required', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const payload = { title: title.trim(), slug: slug.trim(), category, content };
            if (selectedId) {
                await axios.put(`/api/admin/document/${selectedId}`, payload, getAxiosConfig());
                showNotification('Document updated', 'success');
                loadDocuments();
            } else {
                const res = await axios.post('/api/documents', payload, getAxiosConfig());
                showNotification('Document created', 'success');
                loadDocuments();
                if (res.data?.id) {
                    setSelectedId(res.data.id);
                    setSlugLocked(true);
                    setSearchParams({ edit: String(res.data.id) });
                }
            }
        } catch (err) {
            showNotification(err.response?.data?.message || 'Save failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteDocument = async (id) => {
        if (!window.confirm('Delete this document?')) return;
        setIsLoading(true);
        try {
            await axios.delete(`/api/admin/document/${id}`, getAxiosConfig());
            showNotification('Document deleted', 'success');
            if (selectedId === id) resetForm();
            loadDocuments();
        } catch (err) {
            showNotification('Delete failed', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredDocs = docs.filter((doc) =>
        `${doc.title} ${doc.category}`.toLowerCase().includes(docFilter.toLowerCase())
    );

    const field = 'w-full border border-slate-300 rounded-md px-3 py-2 text-[14px] text-ink bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600';

    return (
        <div className="flex w-full min-h-[calc(100vh-56px)] bg-paper">
            {notification.show && (
                <div className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-md text-white text-[14px] font-medium ${notification.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {notification.message}
                </div>
            )}

            <aside className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col h-[calc(100vh-56px)] sticky top-14">
                <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-navy">Documents</p>
                    <button
                        onClick={resetForm}
                        className="text-[12px] font-medium bg-blue-600 text-white px-2.5 py-1 rounded-md"
                    >
                        + New
                    </button>
                </div>
                <div className="p-3 border-b border-slate-200">
                    <input
                        type="text"
                        value={docFilter}
                        onChange={(e) => setDocFilter(e.target.value)}
                        placeholder="Filter documents"
                        className="w-full border border-slate-300 rounded-md px-2.5 py-1.5 text-[13px]"
                    />
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
                    {filteredDocs.map((doc) => (
                        <button
                            key={doc.id}
                            onClick={() => loadDocument(doc.id)}
                            className={`w-full text-left px-2.5 py-2 rounded-md ${
                                selectedId === doc.id ? 'bg-slate-100' : 'hover:bg-slate-50'
                            }`}
                        >
                            <div className="text-[13px] font-medium text-ink truncate">{doc.title}</div>
                            <div className="text-[11px] text-slate-500">{doc.category}</div>
                        </button>
                    ))}
                    {filteredDocs.length === 0 && (
                        <p className="text-[13px] text-slate-400 px-2 py-6 text-center">No documents</p>
                    )}
                </div>
            </aside>

            <section className="flex-1 min-w-0 px-4 sm:px-6 py-4 overflow-y-auto">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <div>
                        <h1 className="text-[22px] font-semibold text-navy">
                            {selectedId ? 'Edit document' : 'Create document'}
                        </h1>
                        <p className="text-[13px] text-slate-500">
                            {selectedId ? 'Changes save to the live catalog.' : 'Publish a new article to the documentation site.'}
                        </p>
                    </div>
                    {selectedId && (
                        <a
                            href={`/${slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[13px] text-blue-700 hover:underline"
                        >
                            View live
                        </a>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 mb-3">
                    <div className="xl:col-span-2">
                        <label className="block text-[12px] font-medium text-slate-600 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => onTitleChange(e.target.value)}
                            disabled={isLoading}
                            className={field}
                            placeholder="Document title"
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-medium text-slate-600 mb-1">Category</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isLoading} className={field}>
                            <option value="Linux">Linux</option>
                            <option value="Linux Administration">Linux Administration</option>
                            <option value="Operating Systems">Operating Systems</option>
                            <option value="Programming Languages">Programming Languages</option>
                            <option value="Databases">Databases</option>
                            <option value="Cloud Computing">Cloud Computing</option>
                            <option value="DevOps">DevOps</option>
                            <option value="Dockers and Containers">Docker & Containers</option>
                            <option value="Kubernets Orchestrations">Kubernetes</option>
                            <option value="AI">Artificial Intelligence</option>
                            <option value="GPU">GPU & Hardware</option>
                            <option value="Networking">Networking</option>
                            <option value="VPN">VPN Services</option>
                            <option value="Network Monitoring">Network Monitoring</option>
                            <option value="Infrastucture Management">Infrastructure Management</option>
                            <option value="WebServers">WebServers</option>
                            <option value="InterviewManagement">Interview Management</option>
                        </select>
                    </div>
                </div>
                <div className="mb-3">
                    <label className="block text-[12px] font-medium text-slate-600 mb-1">URL slug</label>
                    <input
                        type="text"
                        value={slug}
                        onChange={(e) => { setSlug(e.target.value); setSlugLocked(true); }}
                        disabled={isLoading}
                        className={`${field} font-mono`}
                        placeholder="url-slug"
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-[12px] font-medium text-slate-600 mb-1">Content</label>
                    <Editor
                        apiKey="g4ygkuk8qok29hyv1943we8gfhlhw79j3spu1e9k0vb1oa6o"
                        value={content}
                        disabled={isLoading}
                        init={{
                            height: Math.max(420, window.innerHeight - 320),
                            menubar: true,
                            promotion: false,
                            branding: false,
                            automatic_uploads: true,
                            images_upload_url: '/api/upload',
                            images_reuse_filename: true,
                            paste_data_images: true,
                            content_style: 'body { font-family: "IBM Plex Sans", Inter, sans-serif; font-size: 18px; line-height: 1.75; color: #243044; } h1 { font-size: 32px; } h2 { font-size: 24px; } h3 { font-size: 20px; } code, pre { font-family: "IBM Plex Mono", monospace; font-size: 14px; }',
                            plugins: ['anchor', 'autolink', 'advlist', 'charmap', 'codesample', 'code', 'fullscreen', 'image', 'link', 'lists', 'media', 'preview', 'table', 'visualblocks', 'wordcount', 'quickbars'],
                            toolbar: 'undo redo | blocks | bold italic underline | codesample code | bullist numlist | table image blockquote | fullscreen preview'
                        }}
                        onEditorChange={(newValue) => setContent(newValue)}
                    />
                </div>

                <div className="flex flex-wrap gap-2 pb-6">
                    <button
                        onClick={saveDocument}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md text-[14px] font-medium"
                    >
                        {isLoading ? 'Saving...' : selectedId ? 'Save changes' : 'Create document'}
                    </button>
                    <button
                        onClick={resetForm}
                        disabled={isLoading}
                        className="border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-[14px] font-medium"
                    >
                        New blank
                    </button>
                    {selectedId && (
                        <button
                            onClick={() => deleteDocument(selectedId)}
                            disabled={isLoading}
                            className="text-rose-600 px-4 py-2 rounded-md text-[14px] font-medium"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Admin;
