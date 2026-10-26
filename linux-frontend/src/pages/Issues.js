import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import aiIssues from '../data/aiIssues';

const linuxIssues = [
    { title: "High Load Average", desc: "CPU overload, blocked IO, or runaway processes causing server slowness.", severity: "HIGH" },
    { title: "Kernel Panic", desc: "Critical Linux kernel crash causing reboot or freeze.", severity: "CRITICAL" },
    { title: "Out of Memory (OOM)", desc: "Linux kills processes automatically due to RAM exhaustion.", severity: "HIGH" },
    { title: "Disk Full", desc: "Filesystem usage reached 100%, affecting applications and logging.", severity: "HIGH" },
    { title: "inode Exhaustion", desc: "Too many small files consumed all filesystem inodes.", severity: "MEDIUM" },
    { title: "SSH Login Failure", desc: "Authentication or SSH daemon issue preventing login.", severity: "HIGH" },
    { title: "DNS Resolution Failure", desc: "Hostnames unable to resolve because of DNS configuration issues.", severity: "MEDIUM" },
    { title: "Network Packet Loss", desc: "Dropped packets causing latency and unstable communication.", severity: "HIGH" },
    { title: "Filesystem Corruption", desc: "Unexpected shutdown causing EXT4/XFS corruption.", severity: "CRITICAL" },
    { title: "Swap Usage High", desc: "Memory pressure causing excessive swap utilization.", severity: "MEDIUM" },
    { title: "Docker Container Exit", desc: "Containers crashing due to application or image issues.", severity: "HIGH" },
    { title: "Kubernetes CrashLoopBackOff", desc: "Pods continuously restarting because startup fails.", severity: "HIGH" },
    { title: "GPU Utilization 100%", desc: "GPU overloaded due to AI/ML workloads.", severity: "MEDIUM" },
    { title: "NVIDIA Driver Mismatch", desc: "CUDA and NVIDIA driver versions are incompatible.", severity: "HIGH" },
    { title: "MariaDB Replication Failure", desc: "Replication stopped because of SQL or sync issues.", severity: "CRITICAL" },
    { title: "Apache/Nginx Down", desc: "Web server stopped because of config or resource failures.", severity: "HIGH" },
    { title: "Systemd Service Failure", desc: "Linux service unable to start due to dependency issues.", severity: "MEDIUM" },
    { title: "Storage IO Bottleneck", desc: "Slow disk operations causing application slowness.", severity: "HIGH" },
    { title: "Postfix Mail Queue Stuck", desc: "Emails deferred and queue continuously growing.", severity: "MEDIUM" },
    { title: "CPU Thermal Throttling", desc: "Processor frequency reduced because of overheating.", severity: "HIGH" }
];

const SEVERITY_STYLE = {
    CRITICAL: 'bg-rose-50 text-rose-700',
    HIGH: 'bg-amber-50 text-amber-800',
    MEDIUM: 'bg-emerald-50 text-emerald-700'
};

const TABS = [
    { key: 'linux', label: 'Linux & infrastructure' },
    { key: 'ai', label: 'AI & ML' }
];

function SeverityBadge({ severity }) {
    return (
        <span className={`px-2 py-1 rounded text-[11px] font-semibold uppercase w-fit ${SEVERITY_STYLE[severity]}`}>
            {severity.toLowerCase()} <span className="sr-only">severity</span>
        </span>
    );
}

function AiIssueCard({ issue }) {
    return (
        <details className="group bg-white border border-slate-200 rounded-lg open:border-blue-300 open:shadow-sm">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-3 p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg">
                <div className="min-w-0">
                    <p className="text-[12px] font-semibold uppercase tracking-wider text-slate-500">{issue.area}</p>
                    <h2 className="text-[16px] font-semibold text-ink">{issue.title}</h2>
                    <p className="text-[14px] text-slate-600 mt-1">{issue.symptoms}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                    <SeverityBadge severity={issue.severity} />
                    <span className="text-[13px] font-medium text-blue-700 group-open:hidden">Diagnose ▾</span>
                    <span className="hidden text-[13px] font-medium text-blue-700 group-open:inline">Hide ▴</span>
                </div>
            </summary>
            <div className="grid gap-4 border-t border-slate-100 p-4 md:grid-cols-2">
                <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Diagnose</h3>
                    <ul className="space-y-1.5">
                        {issue.diagnose.map((d) => (
                            <li key={d}><code className="block rounded-md bg-navy px-3 py-2 font-mono text-[12.5px] text-slate-100 whitespace-pre-wrap break-words">{d}</code></li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h3 className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Fix</h3>
                    <ol className="list-decimal space-y-1.5 pl-5 text-[14px] text-slate-700">
                        {issue.fix.map((f) => <li key={f}>{f}</li>)}
                    </ol>
                </div>
            </div>
        </details>
    );
}

function Issues() {
    const [params, setParams] = useSearchParams();
    const tab = params.get('tab') === 'ai' ? 'ai' : 'linux';
    const [search, setSearch] = useState('');
    const [area, setArea] = useState('');

    const areas = useMemo(() => [...new Set(aiIssues.map((i) => i.area))], []);
    const q = search.toLowerCase().trim();
    const shownAi = aiIssues.filter((i) => (!area || i.area === area)
        && (!q || `${i.title} ${i.symptoms} ${i.diagnose.join(' ')} ${i.fix.join(' ')}`.toLowerCase().includes(q)));
    const shownLinux = linuxIssues.filter((i) => !q || `${i.title} ${i.desc}`.toLowerCase().includes(q));

    return (
        <div className='px-4 sm:px-8 py-8 space-y-6'>
            <div>
                <h1 className='text-[28px] font-semibold text-navy mb-1'>Troubleshooting</h1>
                <p className='text-[15px] text-slate-500'>Common production problems and how to diagnose them.</p>
            </div>

            <div role="tablist" aria-label="Issue topics" className="flex gap-1 overflow-x-auto border-b border-slate-200">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => { setSearch(''); setArea(''); setParams(t.key === 'ai' ? { tab: 'ai' } : {}, { replace: true }); }}
                        className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-navy'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                <input
                    type="search"
                    aria-label="Search issues"
                    placeholder={tab === 'ai' ? 'Search, e.g. out of memory, RAG, vLLM' : 'Search issues'}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md bg-white border border-slate-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
                {tab === 'ai' && (
                    <select aria-label="Filter by area" value={area} onChange={(e) => setArea(e.target.value)} className="bg-white border border-slate-300 rounded-md px-3 py-2 text-[14px]">
                        <option value="">All areas</option>
                        {areas.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                )}
            </div>

            {tab === 'ai' ? (
                <div className="space-y-3">
                    <p className="text-[14px] text-slate-600">Open an issue to see the commands to run and how to fix it.</p>
                    {shownAi.map((issue) => <AiIssueCard key={issue.title} issue={issue} />)}
                    {shownAi.length === 0 && <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-slate-500">No AI issues match your search.</p>}
                </div>
            ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                    {shownLinux.map((issue) => (
                        <div key={issue.title} className='bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-3'>
                            <div>
                                <h2 className='text-[16px] font-semibold text-ink'>{issue.title}</h2>
                                <p className='text-[14px] text-slate-600 mt-1'>{issue.desc}</p>
                            </div>
                            <SeverityBadge severity={issue.severity} />
                        </div>
                    ))}
                    {shownLinux.length === 0 && <p className="col-span-full rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-slate-500">No issues match your search.</p>}
                </div>
            )}
        </div>
    );
}

export default Issues;
