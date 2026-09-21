import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

function stripHtml(html) {
    return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function readingMinutes(html) {
    const words = stripHtml(html).split(' ').filter(Boolean).length;
    return Math.max(1, Math.round(words / 180));
}

function formatUpdated(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function decodeEntities(text) {
    return (text || '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ');
}

function processContent(html) {
    const headings = [];
    let i = 0;
    const content = (html || '').replace(/<h([1-3])([^>]*)>([\s\S]*?)<\/h\1>/gi, (full, level, attrs, inner) => {
        const text = decodeEntities(inner.replace(/<[^>]+>/g, '').trim());
        if (!text) return full;
        const id = `section-${i++}`;
        headings.push({ id, text, level: Number(level) });
        const cleanAttrs = String(attrs || '').replace(/\s*id=["'][^"']*["']/i, '');
        return `<h${level}${cleanAttrs} id="${id}">${inner}</h${level}>`;
    });
    return { content, headings };
}

function Document() {
    const { slug } = useParams();
    const [doc, setDoc] = useState(null);
    const [nav, setNav] = useState({});
    const [error, setError] = useState('');
    const [activeId, setActiveId] = useState('');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    useEffect(() => {
        setDoc(null);
        setError('');
        axios
            .get(`/api/documents/${slug}`)
            .then((res) => {
                setDoc(res.data);
                return axios.get(`/api/navigation/${res.data.id}`);
            })
            .then((navRes) => {
                if (navRes) setNav(navRes.data);
            })
            .catch(() => setError('This article could not be found.'));
    }, [slug]);

    const processed = useMemo(() => processContent(doc?.content || ''), [doc]);

    useEffect(() => {
        if (!processed.headings.length) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible[0]?.target?.id) setActiveId(visible[0].target.id);
            },
            { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
        );
        processed.headings.forEach((h) => {
            const el = window.document.getElementById(h.id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [processed]);

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
        return <div className="px-6 py-20 text-slate-500">Loading document...</div>;
    }

    const toc = processed.headings.filter((h) => h.level <= 2).slice(0, 16);
    const related = [nav.previous, nav.next].filter(Boolean);

    return (
        <div className="flex w-full min-h-[calc(100vh-56px)]">
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto sticky top-14 h-[calc(100vh-56px)] custom-scrollbar">
                <div className="px-4 py-4">
                    <Link to="/" className="text-[13px] text-blue-700 hover:underline">← All documents</Link>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-5 mb-3">On this page</p>
                    {toc.length > 0 ? (
                        <nav className="flex flex-col gap-0.5">
                            {toc.map((h) => (
                                <a
                                    key={h.id}
                                    href={`#${h.id}`}
                                    className={`text-[13px] leading-snug px-2 py-1.5 rounded-md ${
                                        activeId === h.id ? 'bg-slate-100 text-navy font-semibold' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    {h.text}
                                </a>
                            ))}
                        </nav>
                    ) : (
                        <p className="text-[13px] text-slate-400">Overview</p>
                    )}
                </div>
            </aside>

            <article className="flex-1 min-w-0 bg-white px-4 sm:px-8 lg:px-12 py-6">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <p className="text-[13px] text-slate-500">
                        <Link to="/" className="hover:text-navy">Documents</Link>
                        <span className="mx-1.5">/</span>
                        <span>{doc.category || 'Linux'}</span>
                    </p>
                    {user?.role === 'admin' && (
                        <Link
                            to={`/admin?edit=${doc.id}`}
                            className="text-[13px] font-medium bg-navy text-white px-3 py-1.5 rounded-md hover:bg-[#16355c]"
                        >
                            Edit document
                        </Link>
                    )}
                </div>

                <h1 className="text-[32px] font-semibold text-navy tracking-tight leading-tight mb-3">
                    {doc.title}
                </h1>
                <p className="text-[14px] text-slate-500 mb-8">
                    {readingMinutes(doc.content)} min read
                    {formatUpdated(doc.created_at) ? ` · Updated ${formatUpdated(doc.created_at)}` : ''}
                </p>

                <div
                    className="article-body"
                    dangerouslySetInnerHTML={{ __html: processed.content }}
                />

                {related.length > 0 && (
                    <nav className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {related.map((item) => (
                            <Link
                                key={item.id}
                                to={`/${item.slug}`}
                                className="border border-slate-200 rounded-md px-4 py-3 hover:border-blue-400 hover:bg-slate-50"
                            >
                                <p className="text-[12px] text-slate-400 mb-1">Related</p>
                                <p className="text-[15px] font-medium text-navy">{item.title}</p>
                            </Link>
                        ))}
                    </nav>
                )}
            </article>
        </div>
    );
}

export default Document;
