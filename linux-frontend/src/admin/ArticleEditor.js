import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useBlocker, useNavigate, useParams } from 'react-router-dom';
import { Editor } from '@tinymce/tinymce-react';
import { ArrowLeft, ExternalLink, Eye, Trash2, X } from 'lucide-react';
import api, { errorMessage } from '../lib/api';
import { formatDateTime, fromLocalInput, slugify, stripHtml, toLocalInput } from '../lib/format';
import ArticleView from '../components/ArticleView';
import { BUTTON, FOCUS, Field, INPUT, Panel, StatusBadge, useDebounced, useToast } from './ui';

const EMPTY = {
    title: '',
    slug: '',
    category: '',
    tags: [],
    excerpt: '',
    content: '',
    visibility: 'public',
    featured: false,
    scheduleEnabled: false,
    scheduledLocal: ''
};

const SITE_HOST = 'linux.server-issue.online';

function fromArticle(a) {
    return {
        title: a.title || '',
        slug: a.slug || '',
        category: a.category || '',
        tags: a.tags ? a.tags.split(',').filter(Boolean) : [],
        excerpt: a.excerpt || '',
        content: a.content || '',
        visibility: a.visibility || 'public',
        featured: Boolean(a.featured),
        scheduleEnabled: a.status === 'scheduled',
        scheduledLocal: a.status === 'scheduled' ? toLocalInput(a.scheduled_at) : ''
    };
}

function TagInput({ id, tags, onChange }) {
    const [draft, setDraft] = useState('');

    const add = (raw) => {
        const next = [...tags];
        raw.split(',').map((t) => t.trim()).filter(Boolean).forEach((t) => {
            if (!next.some((x) => x.toLowerCase() === t.toLowerCase()) && next.length < 20) next.push(t.slice(0, 40));
        });
        onChange(next);
        setDraft('');
    };

    return (
        <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-[9px] border border-[#d5dce7] bg-[#fbfcfe] px-2 py-1.5 focus-within:border-adm-blue focus-within:ring-[3px] focus-within:ring-[#b9c8ff]">
            {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-adm-blue-soft py-0.5 pl-2 pr-1 text-[12px] font-semibold text-[#2f47b0]">
                    {tag}
                    <button type="button" onClick={() => onChange(tags.filter((t) => t !== tag))} className={`rounded p-0.5 hover:bg-white ${FOCUS}`} aria-label={`Remove tag ${tag}`}>
                        <X size={12} aria-hidden="true" />
                    </button>
                </span>
            ))}
            <input
                id={id}
                value={draft}
                onChange={(e) => (e.target.value.includes(',') ? add(e.target.value) : setDraft(e.target.value))}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); if (draft.trim()) add(draft); }
                    if (e.key === 'Backspace' && !draft && tags.length) onChange(tags.slice(0, -1));
                }}
                onBlur={() => draft.trim() && add(draft)}
                placeholder={tags.length ? '' : 'e.g. Security, Kubernetes'}
                aria-describedby={`${id}-hint`}
                className="min-w-[120px] flex-1 bg-transparent px-1 text-[14px] outline-none placeholder:text-[#7d889b]"
            />
        </div>
    );
}

function PreviewDialog({ form, onClose }) {
    const closeRef = useRef(null);

    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#0b1220]/60 p-2 nav:p-6" role="dialog" aria-modal="true" aria-labelledby="preview-title">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] bg-paper font-sans shadow-2xl">
                <div className="flex items-center justify-between gap-3 border-b border-adm-line bg-white px-4 py-3 font-admin">
                    <p id="preview-title" className="text-[13px] font-semibold text-adm-ink">Preview · unsaved changes included</p>
                    <button ref={closeRef} type="button" onClick={onClose} className={BUTTON.secondary}>
                        <X size={15} aria-hidden="true" /> Close preview
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <ArticleView doc={{ ...form, tags: form.tags.join(','), updated_at: new Date().toISOString() }} />
                </div>
            </div>
        </div>
    );
}

function SeoPreview({ title, slug, description }) {
    const titleTooLong = title.length > 60;
    const descTooLong = description.length > 155;
    return (
        <div>
            <div className="rounded-[10px] border border-adm-line bg-white p-3.5">
                <p className="truncate text-[12px] text-[#3c4a5e]">{SITE_HOST} › {slug || 'your-article-slug'}</p>
                <p className="mt-1 text-[17px] leading-snug text-[#1a0dab]">
                    {(title || 'Article title').slice(0, 60)}{titleTooLong ? '…' : ''}
                </p>
                <p className="mt-1 text-[13px] leading-snug text-[#4d5156]">
                    {(description || 'Add an excerpt to control the description shown in search results.').slice(0, 155)}{descTooLong ? '…' : ''}
                </p>
            </div>
            <p className="mt-2 flex justify-between text-[11px] text-adm-muted">
                <span className={titleTooLong ? 'font-semibold text-adm-amber' : ''}>Title {title.length}/60</span>
                <span className={descTooLong ? 'font-semibold text-adm-amber' : ''}>Description {description.length}/155</span>
            </p>
        </div>
    );
}

function ArticleEditor() {
    const { id } = useParams();
    const isNew = !id;
    const navigate = useNavigate();
    const toast = useToast();

    const [form, setForm] = useState(EMPTY);
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(!isNew);
    const [notFound, setNotFound] = useState(false);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [slugTouched, setSlugTouched] = useState(!isNew);
    const [slugState, setSlugState] = useState('idle');
    const [categories, setCategories] = useState([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [baseline, setBaseline] = useState(JSON.stringify(EMPTY));

    const dirty = JSON.stringify(form) !== baseline;
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;

    const set = (key) => (value) => {
        setForm((f) => ({ ...f, [key]: value }));
        setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
    };

    useEffect(() => {
        api.get('/api/admin/categories').then((res) => setCategories(res.data.map((c) => c.name))).catch(() => {});
    }, []);

    useEffect(() => {
        if (isNew) {
            setForm(EMPTY);
            setBaseline(JSON.stringify(EMPTY));
            setArticle(null);
            setSlugTouched(false);
            return;
        }
        setLoading(true);
        api.get(`/api/admin/articles/${id}`)
            .then((res) => {
                const next = fromArticle(res.data);
                setArticle(res.data);
                setForm(next);
                setBaseline(JSON.stringify(next));
                setSlugTouched(true);
            })
            .catch((err) => {
                if (err.response?.status === 404) setNotFound(true);
                else toast(errorMessage(err, 'Could not load the article'), 'error');
            })
            .finally(() => setLoading(false));
    }, [id, isNew, toast]);

    // TinyMCE normalises HTML when it loads; treat its first version as the saved state so
    // opening an article doesn't count as an unsaved change.
    const onEditorInit = useCallback((evt, editor) => {
        const normalized = editor.getContent();
        setForm((f) => ({ ...f, content: normalized }));
        setBaseline((b) => JSON.stringify({ ...JSON.parse(b), content: normalized }));
    }, []);

    const debouncedSlug = useDebounced(form.slug, 350);
    useEffect(() => {
        if (!debouncedSlug) { setSlugState('idle'); return; }
        if (article && debouncedSlug === article.slug) { setSlugState('available'); return; }
        let cancelled = false;
        setSlugState('checking');
        api.get('/api/admin/articles/slug-check', { params: { slug: debouncedSlug, excludeId: article?.id } })
            .then((res) => !cancelled && setSlugState(!res.data.valid ? 'invalid' : res.data.available ? 'available' : 'taken'))
            .catch(() => !cancelled && setSlugState('idle'));
        return () => { cancelled = true; };
    }, [debouncedSlug, article]);

    // Warn before leaving with unsaved changes: in-app navigation and closing the tab.
    const blocker = useBlocker(({ currentLocation, nextLocation }) => dirtyRef.current && currentLocation.pathname !== nextLocation.pathname);
    useEffect(() => {
        if (blocker.state !== 'blocked') return;
        if (window.confirm('You have unsaved changes. Leave this page and discard them?')) blocker.proceed();
        else blocker.reset();
    }, [blocker]);
    useEffect(() => {
        if (!dirty) return undefined;
        const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const onTitleChange = (value) => {
        setForm((f) => ({ ...f, title: value, slug: slugTouched ? f.slug : slugify(value) }));
        setErrors((e) => ({ ...e, title: undefined, slug: slugTouched ? e.slug : undefined }));
    };

    const save = async (status) => {
        if (status === 'draft' && article?.status === 'published'
            && !window.confirm('Move this article back to draft? It will disappear from the public site until you publish it again.')) {
            return;
        }
        const scheduledAt = status === 'scheduled' ? fromLocalInput(form.scheduledLocal) : null;
        const payload = {
            title: form.title,
            slug: form.slug,
            category: form.category,
            tags: form.tags.join(','),
            excerpt: form.excerpt,
            content: form.content,
            visibility: form.visibility,
            featured: form.featured,
            status,
            scheduled_at: scheduledAt
        };

        setSaving(true);
        setErrors({});
        try {
            const res = isNew
                ? await api.post('/api/admin/articles', payload)
                : await api.put(`/api/admin/articles/${article.id}`, payload);
            const saved = res.data.article;
            const next = fromArticle(saved);
            setArticle(saved);
            setForm(next);
            setBaseline(JSON.stringify(next));
            dirtyRef.current = false;

            const wasPublished = article?.status === 'published';
            toast(
                status === 'draft' ? (wasPublished ? 'Moved to draft — no longer public' : 'Draft saved')
                    : status === 'scheduled' ? `Scheduled for ${formatDateTime(saved.scheduled_at)}`
                        : wasPublished ? 'Changes published' : 'Article published'
            );
            if (isNew) navigate(`/admin/articles/${saved.id}/edit`, { replace: true });
        } catch (err) {
            const fieldErrors = err.response?.data?.errors;
            if (fieldErrors) setErrors(fieldErrors);
            toast(errorMessage(err, 'Save failed. Your changes are still here'), 'error');
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!window.confirm(`Delete "${article.title}" permanently? This cannot be undone.`)) return;
        setSaving(true);
        try {
            await api.delete(`/api/admin/articles/${article.id}`);
            dirtyRef.current = false;
            setBaseline(JSON.stringify(form));
            toast('Article deleted');
            navigate('/admin/articles', { replace: true });
        } catch (err) {
            toast(errorMessage(err, 'Delete failed'), 'error');
            setSaving(false);
        }
    };

    const uploadImage = (blobInfo, progress) => {
        const data = new FormData();
        data.append('file', blobInfo.blob(), blobInfo.filename());
        return api.post('/api/upload', data, {
            onUploadProgress: (e) => e.total && progress((e.loaded / e.total) * 100)
        })
            .then((res) => res.data.location)
            .catch((err) => Promise.reject({ message: errorMessage(err, 'Image upload failed'), remove: true }));
    };

    if (notFound) {
        return (
            <Panel className="px-6 py-14 text-center">
                <h1 className="text-[20px] font-bold">Article not found</h1>
                <p className="mt-1 text-adm-muted">It may have been deleted.</p>
                <Link to="/admin/articles" className={`${BUTTON.secondary} mt-5`}>Back to articles</Link>
            </Panel>
        );
    }

    if (loading) {
        return <p className="py-16 text-center text-adm-muted" role="status">Loading article…</p>;
    }

    const savedStatus = article?.status;
    const primaryStatus = form.scheduleEnabled ? 'scheduled' : 'published';
    const primaryLabel = form.scheduleEnabled ? 'Schedule' : savedStatus === 'published' ? 'Update' : 'Publish';
    const description = form.excerpt || stripHtml(form.content).slice(0, 160);
    const slugChangedOnLive = savedStatus === 'published' && article && form.slug !== article.slug;
    const minSchedule = toLocalInput(new Date(Date.now() + 5 * 60 * 1000));

    const slugHint = {
        checking: 'Checking availability…',
        available: `Available · ${SITE_HOST}/${form.slug}`,
        taken: null,
        invalid: null,
        idle: 'Lowercase letters, numbers and hyphens'
    }[slugState];
    const slugError = errors.slug
        || (slugState === 'taken' ? 'Already used by another article' : null)
        || (slugState === 'invalid' ? 'Use lowercase letters, numbers and single hyphens' : null);

    return (
        <>
            <div className="mb-6 flex flex-col gap-4 wide:flex-row wide:items-end wide:justify-between">
                <div>
                    <Link to="/admin/articles" className={`mb-2 inline-flex items-center gap-1 rounded text-[12px] font-semibold text-adm-muted hover:text-adm-blue ${FOCUS}`}>
                        <ArrowLeft size={14} aria-hidden="true" /> All articles
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-[25px] font-bold leading-tight tracking-[-0.04em] nav:text-[28px]">{isNew ? 'New article' : 'Edit article'}</h1>
                        {savedStatus && <StatusBadge status={savedStatus} />}
                        {dirty && <span className="text-[12px] font-semibold text-adm-amber" role="status">Unsaved changes</span>}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button type="button" className={BUTTON.secondary} onClick={() => setPreviewOpen(true)} disabled={saving}>
                        <Eye size={15} aria-hidden="true" /> Preview
                    </button>
                    <button type="button" className={BUTTON.secondary} onClick={() => save('draft')} disabled={saving}>
                        {savedStatus === 'published' ? 'Unpublish to draft' : 'Save draft'}
                    </button>
                    <button type="button" className={BUTTON.primary} onClick={() => save(primaryStatus)} disabled={saving || slugState === 'taken'}>
                        {saving ? 'Saving…' : primaryLabel}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-5 wide:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-5">
                    <Panel className="space-y-4 p-4 nav:p-[22px]">
                        <Field label="Title" htmlFor="title" error={errors.title}>
                            <input id="title" value={form.title} onChange={(e) => onTitleChange(e.target.value)} className={`${INPUT} h-12 text-[18px] font-semibold`} placeholder="e.g. Linux Disk Space Troubleshooting" aria-invalid={Boolean(errors.title)} />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 nav:grid-cols-2">
                            <Field label="URL slug" htmlFor="slug" error={slugError} hint={slugChangedOnLive ? 'This article is live: changing the slug breaks existing links to it' : slugHint}>
                                <div className="flex items-stretch">
                                    <span className="hidden items-center rounded-l-[9px] border border-r-0 border-[#d5dce7] bg-[#f0f3f8] px-2.5 font-admin-mono text-[12px] text-adm-muted wide:flex">/</span>
                                    <input
                                        id="slug"
                                        value={form.slug}
                                        onChange={(e) => { setSlugTouched(true); set('slug')(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                                        className={`${INPUT} font-admin-mono text-[13px] wide:rounded-l-none`}
                                        placeholder="linux-disk-space"
                                        aria-invalid={Boolean(slugError)}
                                        aria-describedby={slugError ? 'slug-error' : 'slug-hint'}
                                    />
                                </div>
                            </Field>
                            <Field label="Category" htmlFor="category" error={errors.category} hint="Pick an existing category or type a new one">
                                <input id="category" list="category-options" value={form.category} onChange={(e) => set('category')(e.target.value)} className={INPUT} placeholder="e.g. Linux" aria-invalid={Boolean(errors.category)} />
                                <datalist id="category-options">
                                    {categories.map((c) => <option key={c} value={c} />)}
                                </datalist>
                            </Field>
                        </div>
                        <Field label="Tags" htmlFor="tags" hint="Press Enter or comma to add a tag">
                            <TagInput id="tags" tags={form.tags} onChange={set('tags')} />
                        </Field>
                        <Field label="Excerpt" htmlFor="excerpt" hint={`${form.excerpt.length}/500 · Shown in listings and used as the search description`}>
                            <textarea id="excerpt" value={form.excerpt} onChange={(e) => set('excerpt')(e.target.value.slice(0, 500))} rows={3} className={`${INPUT} h-auto py-2.5 leading-relaxed`} placeholder="One or two sentences that summarise the article" aria-describedby="excerpt-hint" />
                        </Field>
                    </Panel>

                    <Panel className="p-4 nav:p-[22px]">
                        <p id="content-label" className="mb-1.5 text-[12px] font-semibold text-[#3d4a62]">Content</p>
                        {errors.content && <p className="mb-2 text-[12px] font-medium text-adm-red" role="alert">{errors.content}</p>}
                        <Editor
                            apiKey="g4ygkuk8qok29hyv1943we8gfhlhw79j3spu1e9k0vb1oa6o"
                            value={form.content}
                            onInit={onEditorInit}
                            onEditorChange={(value) => set('content')(value)}
                            init={{
                                height: Math.max(480, window.innerHeight - 260),
                                menubar: true,
                                promotion: false,
                                branding: false,
                                convert_urls: false,
                                automatic_uploads: true,
                                images_upload_handler: uploadImage,
                                images_file_types: 'png,jpg,jpeg,gif,webp',
                                paste_data_images: true,
                                iframe_aria_text: 'Article content editor',
                                content_style: 'body { font-family: "IBM Plex Sans", Inter, sans-serif; font-size: 18px; line-height: 1.75; color: #243044; } h1 { font-size: 32px; } h2 { font-size: 24px; } h3 { font-size: 20px; } code, pre { font-family: "IBM Plex Mono", monospace; font-size: 14px; }',
                                plugins: ['anchor', 'autolink', 'advlist', 'charmap', 'codesample', 'code', 'fullscreen', 'image', 'link', 'lists', 'media', 'preview', 'table', 'visualblocks', 'wordcount', 'quickbars'],
                                toolbar: 'undo redo | blocks | bold italic underline | codesample code | bullist numlist | table image blockquote | fullscreen preview'
                            }}
                        />
                    </Panel>
                </div>

                <aside className="space-y-5" aria-label="Publishing settings">
                    <Panel className="space-y-4 p-[18px]">
                        <h2 className="text-[15px] font-bold">Publishing</h2>
                        <dl className="grid grid-cols-[90px_1fr] gap-y-2 text-[13px]">
                            <dt className="text-adm-muted">Status</dt>
                            <dd>{savedStatus ? <StatusBadge status={savedStatus} /> : <span className="text-adm-muted">Not saved yet</span>}</dd>
                            {savedStatus === 'scheduled' && (<><dt className="text-adm-muted">Goes live</dt><dd>{formatDateTime(article.scheduled_at)}</dd></>)}
                            {article?.published_at && savedStatus === 'published' && (<><dt className="text-adm-muted">Published</dt><dd>{formatDateTime(article.published_at)}</dd></>)}
                            {article && (<><dt className="text-adm-muted">Last saved</dt><dd>{formatDateTime(article.updated_at || article.created_at)}</dd></>)}
                        </dl>
                        {savedStatus === 'published' && (
                            <a href={`/${article.slug}`} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1 rounded text-[13px] font-semibold text-adm-blue hover:underline ${FOCUS}`}>
                                View live article <ExternalLink size={13} aria-hidden="true" />
                            </a>
                        )}

                        <Field label="Visibility" htmlFor="visibility" hint={form.visibility === 'unlisted' ? 'Only people with the link can read it; hidden from listings' : 'Listed on the home page and in categories'}>
                            <select id="visibility" value={form.visibility} onChange={(e) => set('visibility')(e.target.value)} className={`${INPUT} bg-white`} aria-describedby="visibility-hint">
                                <option value="public">Public</option>
                                <option value="unlisted">Unlisted</option>
                            </select>
                        </Field>

                        <div>
                            <label className="flex items-center gap-2.5 text-[13px] font-semibold text-[#3d4a62]">
                                <input type="checkbox" checked={form.scheduleEnabled} onChange={(e) => set('scheduleEnabled')(e.target.checked)} className={`h-4 w-4 rounded accent-adm-blue ${FOCUS}`} />
                                Schedule for later
                            </label>
                            {form.scheduleEnabled && (
                                <div className="mt-2.5">
                                    <label htmlFor="scheduled_at" className="sr-only">Publish date and time</label>
                                    <input id="scheduled_at" type="datetime-local" min={minSchedule} value={form.scheduledLocal} onChange={(e) => set('scheduledLocal')(e.target.value)} className={INPUT} aria-invalid={Boolean(errors.scheduled_at)} />
                                    {errors.scheduled_at
                                        ? <p className="mt-1.5 text-[12px] font-medium text-adm-red" role="alert">{errors.scheduled_at}</p>
                                        : <p className="mt-1.5 text-[12px] text-adm-muted">Your local time. Publishes automatically within a minute of this time.</p>}
                                </div>
                            )}
                        </div>

                        <label className="flex items-start gap-2.5 text-[13px] font-semibold text-[#3d4a62]">
                            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured')(e.target.checked)} className={`mt-0.5 h-4 w-4 rounded accent-adm-blue ${FOCUS}`} />
                            <span>Feature on home page<span className="block text-[12px] font-normal text-adm-muted">Shown in the Featured section of the home page</span></span>
                        </label>
                    </Panel>

                    <Panel className="p-[18px]">
                        <h2 className="mb-3 text-[15px] font-bold">Search snippet preview</h2>
                        <SeoPreview title={form.title} slug={form.slug} description={description} />
                    </Panel>

                    {article && (
                        <Panel className="p-[18px]">
                            <h2 className="mb-1 text-[15px] font-bold">Danger zone</h2>
                            <p className="mb-3 text-[12px] text-adm-muted">Deleting removes the article and its URL permanently.</p>
                            <button type="button" onClick={remove} disabled={saving} className={BUTTON.danger}>
                                <Trash2 size={15} aria-hidden="true" /> Delete article
                            </button>
                        </Panel>
                    )}
                </aside>
            </div>

            {previewOpen && <PreviewDialog form={form} onClose={() => setPreviewOpen(false)} />}
        </>
    );
}

export default ArticleEditor;
