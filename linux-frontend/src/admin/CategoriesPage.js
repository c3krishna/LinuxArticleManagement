import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../lib/api';
import { formatDate, formatNumber } from '../lib/format';
import { FOCUS, Panel, useToast } from './ui';

// Categories are the distinct values used by articles; they are created by typing a new one in the editor.
function CategoriesPage() {
    const toast = useToast();
    const [rows, setRows] = useState(null);

    useEffect(() => {
        api.get('/api/admin/categories')
            .then((res) => setRows(res.data))
            .catch((err) => toast(errorMessage(err, 'Could not load categories'), 'error'));
    }, [toast]);

    return (
        <>
            <div className="mb-[25px]">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-adm-blue">Content workspace</p>
                <h1 className="mb-[5px] mt-1 text-[25px] font-bold leading-tight tracking-[-0.04em] nav:text-[28px]">Categories</h1>
                <p className="text-adm-muted">How articles are spread across categories. Add a category by typing a new name in the article editor.</p>
            </div>

            <Panel>
                <div className="overflow-auto">
                    <table className="w-full min-w-[640px] border-collapse">
                        <caption className="sr-only">Categories with article counts</caption>
                        <thead>
                            <tr>
                                {['Category', 'Articles', 'Published', 'Drafts', 'Views', 'Last updated'].map((h) => (
                                    <th key={h} scope="col" className="border-b border-adm-line bg-[#fbfcfe] px-[22px] py-3 text-left text-[10px] font-bold uppercase tracking-[0.09em] text-adm-muted">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(rows || []).map((c) => (
                                <tr key={c.name} className="border-b border-[#edf0f5] last:border-0 hover:bg-[#fbfcff]">
                                    <td className="px-[22px] py-[14px]">
                                        <Link to={`/admin/articles?category=${encodeURIComponent(c.name)}`} className={`rounded text-[13px] font-semibold text-[#1d2940] hover:text-adm-blue ${FOCUS}`}>{c.name}</Link>
                                    </td>
                                    <td className="px-[22px] py-[14px] text-[13px] tabular-nums">{c.total}</td>
                                    <td className="px-[22px] py-[14px] text-[13px] tabular-nums">{c.published}</td>
                                    <td className="px-[22px] py-[14px] text-[13px] tabular-nums">{c.drafts}</td>
                                    <td className="px-[22px] py-[14px] text-[13px] tabular-nums">{formatNumber(c.views)}</td>
                                    <td className="px-[22px] py-[14px] text-[13px] tabular-nums">{formatDate(c.updated_at)}</td>
                                </tr>
                            ))}
                            {rows && rows.length === 0 && (
                                <tr><td colSpan={6} className="px-[22px] py-12 text-center text-adm-muted">No categories yet.</td></tr>
                            )}
                            {!rows && (
                                <tr><td colSpan={6} className="px-[22px] py-12 text-center text-adm-muted" role="status">Loading categories…</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Panel>
        </>
    );
}

export default CategoriesPage;
