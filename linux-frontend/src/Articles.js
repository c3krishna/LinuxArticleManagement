import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import SearchBar from './components/SearchBar';

function Articles() {
    const [docs, setDocs] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [keyword, setKeyword] = useState(searchParams.get('q') || '');
    const activeCategory = searchParams.get('category') || '';

    useEffect(() => {
        axios
            .get('/api/documents')
            .then((res) => setDocs(Array.isArray(res.data) ? res.data : []))
            .catch((err) => console.error('Error fetching docs:', err));
    }, []);

    const categories = useMemo(() => {
        const counts = {};
        docs.forEach((doc) => {
            const name = doc.category || 'General';
            counts[name] = (counts[name] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    }, [docs]);

    const filteredDocs = docs.filter((doc) => {
        const haystack = `${doc.title} ${doc.category || ''} ${doc.tags || ''} ${doc.excerpt || ''}`.toLowerCase();
        const matchesSearch = haystack.includes(keyword.toLowerCase().trim());
        const matchesCategory = !activeCategory || (doc.category || 'General') === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const setCategory = (name) => {
        const next = new URLSearchParams(searchParams);
        if (name) next.set('category', name);
        else next.delete('category');
        setSearchParams(next);
    };

    return (
        <div className="flex w-full min-h-[calc(100vh-56px)]">
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto sticky top-14 h-[calc(100vh-56px)] custom-scrollbar">
                <div className="px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Categories</p>
                    <nav className="flex flex-col">
                        <button
                            onClick={() => setCategory('')}
                            className={`text-left text-[14px] px-2 py-1.5 rounded-md ${!activeCategory ? 'bg-slate-100 text-navy font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            All documents
                        </button>
                        {categories.map(([name, count]) => (
                            <button
                                key={name}
                                onClick={() => setCategory(name)}
                                className={`text-left text-[14px] px-2 py-1.5 rounded-md flex justify-between gap-2 ${activeCategory === name ? 'bg-slate-100 text-navy font-semibold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span className="truncate">{name}</span>
                                <span className="text-slate-400 text-[12px]">{count}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </aside>

            <section className="flex-1 min-w-0 px-4 sm:px-8 py-6">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-5">
                    <div>
                        <h1 className="text-[28px] font-semibold text-navy tracking-tight">{activeCategory || 'All articles'}</h1>
                        <p className="text-[15px] text-slate-500 mt-1">{filteredDocs.length} articles available</p>
                    </div>
                    <div className="w-full sm:w-80">
                        <SearchBar keyword={keyword} setKeyword={setKeyword} />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    {filteredDocs.map((doc, index) => (
                        <Link
                            key={doc.id}
                            to={`/${doc.slug}`}
                            className={`flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-50 ${index !== 0 ? 'border-t border-slate-100' : ''}`}
                        >
                            <div className="min-w-0">
                                <h2 className="text-[16px] font-medium text-ink truncate">{doc.title}</h2>
                                <p className="text-[13px] text-slate-500 mt-0.5">{doc.category || 'General'}</p>
                            </div>
                            <span className="text-slate-400 text-[13px] shrink-0">Open →</span>
                        </Link>
                    ))}
                    {filteredDocs.length === 0 && (
                        <p className="px-4 py-10 text-center text-slate-500 text-[15px]">No documents match this filter.</p>
                    )}
                </div>
            </section>
        </div>
    );
}

export default Articles;
