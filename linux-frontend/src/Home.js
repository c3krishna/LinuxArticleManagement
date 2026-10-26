import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, BrainCircuit, Flame, LifeBuoy, MessagesSquare, Search, Sparkles, Terminal } from 'lucide-react';

const SECTIONS = [
    { to: '/articles', icon: BookOpen, title: 'Articles', text: 'In-depth guides on Linux, DevOps, databases and AI.' },
    { to: '/cheatsheets', icon: Terminal, title: 'Cheat sheets', text: 'Commands for Linux, Docker, Kubernetes, GPUs and LLM serving.' },
    { to: '/cheatsheets?tab=ai', icon: BrainCircuit, title: 'How AI & ML work', text: 'The ML pipeline, LLMs, RAG and agents explained simply.' },
    { to: '/issues', icon: LifeBuoy, title: 'Troubleshooting', text: 'Linux and AI production issues with diagnosis steps.' },
    { to: '/linux-crash', icon: Flame, title: 'Crash analysis', text: 'Kernel panics, OOM kills and post-mortem logs.' },
    { to: '/forum', icon: MessagesSquare, title: 'Community forum', text: 'Ask questions and share fixes with other engineers.' }
];

function formatDate(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ArticleRow({ doc, meta }) {
    return (
        <Link to={`/${doc.slug}`} className="group flex items-start justify-between gap-4 px-4 py-3 hover:bg-slate-50">
            <div className="min-w-0">
                <h3 className="text-[15px] font-medium text-ink group-hover:text-blue-700">{doc.title}</h3>
                <p className="text-[13px] text-slate-500 mt-0.5">{doc.category || 'General'}{meta ? ` · ${meta}` : ''}</p>
            </div>
            <ArrowRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-slate-400 group-hover:text-blue-700" />
        </Link>
    );
}

// Landing dashboard: a way into every part of the site, not a copy of the article list.
function Home() {
    const navigate = useNavigate();
    const [docs, setDocs] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [query, setQuery] = useState('');

    useEffect(() => {
        axios.get('/api/documents')
            .then((res) => setDocs(Array.isArray(res.data) ? res.data : []))
            .catch(() => setDocs([]));
        axios.get('/api/forum/questions')
            .then((res) => setQuestions(Array.isArray(res.data) ? res.data : []))
            .catch(() => {});
    }, []);

    const { latest, popular, featured, categories } = useMemo(() => {
        const list = docs || [];
        const byDate = [...list].sort((a, b) => new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at));
        const counts = {};
        list.forEach((d) => { const c = d.category || 'General'; counts[c] = (counts[c] || 0) + 1; });
        return {
            latest: byDate.slice(0, 6),
            popular: [...list].filter((d) => d.views > 0).sort((a, b) => b.views - a.views).slice(0, 5),
            featured: list.filter((d) => d.featured).slice(0, 3),
            categories: Object.entries(counts).sort((a, b) => b[1] - a[1])
        };
    }, [docs]);

    const search = (e) => {
        e.preventDefault();
        navigate(query.trim() ? `/articles?q=${encodeURIComponent(query.trim())}` : '/articles');
    };

    return (
        <div className="w-full">
            <section className="bg-navy text-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-8 py-12 sm:py-16">
                    <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-200">Linux Docs knowledge hub</p>
                    <h1 className="mt-2 max-w-3xl text-[30px] sm:text-[40px] font-semibold leading-tight tracking-tight">
                        Practical Linux, DevOps and AI knowledge for engineers who run production.
                    </h1>
                    <form onSubmit={search} role="search" className="mt-7 flex max-w-2xl gap-2">
                        <label htmlFor="home-search" className="sr-only">Search articles</label>
                        <div className="relative flex-1">
                            <Search size={18} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                id="home-search"
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search guides, e.g. Kubernetes, RAG, disk full"
                                className="h-12 w-full rounded-md border-0 bg-white pl-10 pr-3 text-[15px] text-ink placeholder:text-slate-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
                            />
                        </div>
                        <button type="submit" className="h-12 rounded-md bg-blue-600 px-5 text-[15px] font-medium hover:bg-blue-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
                            Search
                        </button>
                    </form>
                    <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-2 text-[14px] text-slate-300">
                        <div><dt className="sr-only">Articles</dt><dd><strong className="text-white">{docs ? docs.length : '—'}</strong> articles</dd></div>
                        <div><dt className="sr-only">Categories</dt><dd><strong className="text-white">{docs ? categories.length : '—'}</strong> categories</dd></div>
                        <div><dt className="sr-only">Forum</dt><dd><strong className="text-white">{questions.length}</strong> forum {questions.length === 1 ? 'question' : 'questions'}</dd></div>
                    </dl>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 space-y-10">
                <section aria-labelledby="explore-heading">
                    <h2 id="explore-heading" className="text-[20px] font-semibold text-navy mb-4">Explore</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SECTIONS.map(({ to, icon: Icon, title, text }) => (
                            <Link key={title} to={to} className="group flex gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true"><Icon size={20} /></span>
                                <span>
                                    <strong className="block text-[15px] font-semibold text-navy group-hover:text-blue-700">{title}</strong>
                                    <span className="text-[14px] text-slate-600">{text}</span>
                                </span>
                            </Link>
                        ))}
                    </div>
                </section>

                {featured.length > 0 && (
                    <section aria-labelledby="featured-heading">
                        <h2 id="featured-heading" className="flex items-center gap-2 text-[20px] font-semibold text-navy mb-4">
                            <Sparkles size={18} aria-hidden="true" className="text-amber-500" /> Featured
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {featured.map((doc) => (
                                <Link key={doc.id} to={`/${doc.slug}`} className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-400 hover:shadow-sm">
                                    <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">{doc.category || 'General'}</p>
                                    <h3 className="mt-1 text-[17px] font-semibold text-navy">{doc.title}</h3>
                                    {doc.excerpt && <p className="mt-1.5 text-[14px] text-slate-600 line-clamp-3">{doc.excerpt}</p>}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6">
                    <section aria-labelledby="latest-heading">
                        <div className="mb-3 flex items-end justify-between">
                            <h2 id="latest-heading" className="text-[20px] font-semibold text-navy">Latest articles</h2>
                            <Link to="/articles" className="text-[14px] font-medium text-blue-700 hover:underline">View all</Link>
                        </div>
                        <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                            {latest.map((doc) => <ArticleRow key={doc.id} doc={doc} meta={formatDate(doc.published_at || doc.created_at)} />)}
                            {docs && latest.length === 0 && <p className="px-4 py-8 text-center text-slate-500">No articles yet.</p>}
                            {!docs && <p className="px-4 py-8 text-center text-slate-500" role="status">Loading…</p>}
                        </div>
                    </section>

                    <div className="space-y-6">
                        {popular.length > 0 && (
                            <section aria-labelledby="popular-heading">
                                <h2 id="popular-heading" className="mb-3 text-[20px] font-semibold text-navy">Most read</h2>
                                <ol className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                                    {popular.map((doc, i) => (
                                        <li key={doc.id} className="flex items-start gap-3 px-4 py-3">
                                            <span className="mt-0.5 w-5 shrink-0 text-[14px] font-semibold text-slate-400">{i + 1}</span>
                                            <Link to={`/${doc.slug}`} className="text-[15px] font-medium text-ink hover:text-blue-700">{doc.title}</Link>
                                        </li>
                                    ))}
                                </ol>
                            </section>
                        )}

                        <section aria-labelledby="forum-heading">
                            <div className="mb-3 flex items-end justify-between">
                                <h2 id="forum-heading" className="text-[20px] font-semibold text-navy">From the forum</h2>
                                <Link to="/ask-question" className="text-[14px] font-medium text-blue-700 hover:underline">Ask a question</Link>
                            </div>
                            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                                {questions.slice(0, 4).map((q) => (
                                    <Link key={q.id} to={`/forum/${q.slug}`} className="block px-4 py-3 hover:bg-slate-50">
                                        <p className="text-[15px] font-medium text-ink">{q.title}</p>
                                        <p className="text-[13px] text-slate-500">Asked by {q.name || 'Anonymous'}</p>
                                    </Link>
                                ))}
                                {questions.length === 0 && <p className="px-4 py-6 text-[14px] text-slate-500">No questions yet. Be the first to ask.</p>}
                            </div>
                        </section>
                    </div>
                </div>

                <section aria-labelledby="categories-heading">
                    <h2 id="categories-heading" className="text-[20px] font-semibold text-navy mb-4">Browse by category</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {categories.map(([name, count]) => (
                            <Link key={name} to={`/articles?category=${encodeURIComponent(name)}`} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-blue-400">
                                <span className="truncate text-[15px] font-medium text-ink">{name}</span>
                                <span className="shrink-0 rounded bg-slate-100 px-2 py-0.5 text-[12px] font-semibold text-slate-600">{count}</span>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Home;
