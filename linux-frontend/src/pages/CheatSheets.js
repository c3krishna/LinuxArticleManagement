import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import linuxCheatSheets from '../data/linuxCheatSheets';
import aiCheatSheets from '../data/aiCheatSheets';
import { agentLoop, aiLayers, approaches, glossary, learningTypes, llmSteps, mlPipeline, ragSteps } from '../data/aiConcepts';

const TABS = [
    { key: 'linux', label: 'Linux & DevOps' },
    { key: 'ai-tools', label: 'AI & ML commands' },
    { key: 'ai', label: 'How AI & ML work' }
];

function CommandSheets({ sheets, search }) {
    const q = search.toLowerCase().trim();
    const filtered = useMemo(() => sheets
        .map((section) => {
            if (!q || section.category.toLowerCase().includes(q)) return section;
            const commands = section.commands.filter((c) => `${c.cmd} ${c.desc}`.toLowerCase().includes(q));
            return commands.length ? { ...section, commands } : null;
        })
        .filter(Boolean), [sheets, q]);

    if (!filtered.length) {
        return <p className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-slate-500">No commands match “{search}”.</p>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((section) => (
                <section key={section.category} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                    <div className="border-b border-slate-100 px-4 py-3 flex items-center gap-2">
                        <span aria-hidden="true">{section.icon}</span>
                        <h2 className="text-[16px] font-semibold text-navy">{section.category}</h2>
                    </div>
                    <div className="p-4 space-y-2">
                        {section.commands.map((c, i) => (
                            <div key={`${i}-${c.cmd}`} className="bg-paper rounded-md p-3">
                                <code className="block font-mono text-[13px] text-navy mb-1 break-words">{c.cmd}</code>
                                <div className="text-[13px] text-slate-600">{c.desc}</div>
                            </div>
                        ))}
                    </div>
                </section>
            ))}
        </div>
    );
}

// A numbered left-to-right flow that wraps on small screens.
function Flow({ steps, label }) {
    return (
        <ol className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-none xl:grid-flow-col xl:auto-cols-fr gap-2" aria-label={label}>
            {steps.map((s, i) => (
                <li key={s.step} className="relative rounded-lg border border-slate-200 bg-white p-3.5">
                    <span className="mb-1.5 flex items-center gap-2">
                        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[12px] font-semibold text-white" aria-hidden="true">{i + 1}</span>
                        <strong className="text-[14px] text-navy">{s.step}</strong>
                    </span>
                    <span className="block text-[13px] leading-snug text-slate-600">{s.text}</span>
                    {i < steps.length - 1 && <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-slate-400 xl:block" aria-hidden="true">›</span>}
                </li>
            ))}
        </ol>
    );
}

function Block({ title, intro, children }) {
    return (
        <section className="space-y-3">
            <div>
                <h2 className="text-[20px] font-semibold text-navy">{title}</h2>
                {intro && <p className="text-[15px] text-slate-600 mt-0.5">{intro}</p>}
            </div>
            {children}
        </section>
    );
}

function HowAiWorks() {
    return (
        <div className="space-y-10">
            <Block title="AI, ML, deep learning and GenAI" intro="Each is a subset of the one before it.">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                    {aiLayers.reduceRight((inner, layer, i) => (
                        <div className={`rounded-lg border p-3 ${['bg-blue-50 border-blue-100', 'bg-blue-100/70 border-blue-200', 'bg-blue-200/60 border-blue-300', 'bg-white border-blue-400'][i]}`}>
                            <strong className="block text-[14px] text-navy">{layer.name}</strong>
                            <span className="block text-[13px] text-slate-700 mb-2">{layer.text}</span>
                            {inner}
                        </div>
                    ), null)}
                </div>
            </Block>

            <Block title="How machine learning works" intro="Every ML project, from a spam filter to an LLM, follows this lifecycle.">
                <Flow steps={mlPipeline} label="Machine learning lifecycle" />
            </Block>

            <Block title="Ways a model learns">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {learningTypes.map((t) => (
                        <div key={t.name} className="rounded-lg border border-slate-200 bg-white p-4">
                            <strong className="text-[15px] text-navy">{t.name}</strong>
                            <p className="text-[14px] text-slate-600 mt-1">{t.text}</p>
                        </div>
                    ))}
                </div>
            </Block>

            <Block title="How an LLM writes an answer" intro="Large language models generate one token at a time, in a loop.">
                <Flow steps={llmSteps} label="How an LLM generates text" />
            </Block>

            <Block title="How RAG works" intro="Retrieval-augmented generation grounds answers in your own documents.">
                <Flow steps={ragSteps} label="Retrieval-augmented generation" />
            </Block>

            <Block title="How AI agents work" intro="An agent is an LLM in a loop with tools.">
                <Flow steps={agentLoop} label="Agent loop" />
            </Block>

            <Block title="Prompting, RAG or fine-tuning?">
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <table className="w-full min-w-[560px] text-left text-[14px]">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr><th scope="col" className="px-4 py-2.5 font-semibold">Approach</th><th scope="col" className="px-4 py-2.5 font-semibold">Use it when</th><th scope="col" className="px-4 py-2.5 font-semibold">Cost</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {approaches.map((a) => (
                                <tr key={a.name}><th scope="row" className="px-4 py-3 font-semibold text-navy">{a.name}</th><td className="px-4 py-3 text-slate-700">{a.when}</td><td className="px-4 py-3 text-slate-700 whitespace-nowrap">{a.cost}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Block>

            <Block title="Glossary">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {glossary.map((g) => (
                        <div key={g.term} className="rounded-lg border border-slate-200 bg-white p-4">
                            <dt className="text-[15px] font-semibold text-navy">{g.term}</dt>
                            <dd className="text-[14px] text-slate-600 mt-0.5">{g.text}</dd>
                        </div>
                    ))}
                </dl>
            </Block>
        </div>
    );
}

function CheatSheets() {
    const [params, setParams] = useSearchParams();
    const tab = TABS.some((t) => t.key === params.get('tab')) ? params.get('tab') : 'linux';
    const [search, setSearch] = useState('');

    const selectTab = (key) => {
        setSearch('');
        setParams(key === 'linux' ? {} : { tab: key }, { replace: true });
    };

    return (
        <div className="px-4 sm:px-8 py-8 space-y-6">
            <div>
                <h1 className="text-[28px] font-semibold text-navy mb-1">Cheat sheets</h1>
                <p className="text-[15px] text-slate-500">Quick reference for Linux, DevOps and AI/ML engineering.</p>
            </div>

            <div role="tablist" aria-label="Cheat sheet topics" className="flex gap-1 overflow-x-auto border-b border-slate-200">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.key}
                        onClick={() => selectTab(t.key)}
                        className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[14px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${tab === t.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-600 hover:text-navy'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab !== 'ai' && (
                <input
                    type="search"
                    aria-label="Search commands"
                    placeholder="Search commands, e.g. nvidia-smi, ports, logs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md bg-white border border-slate-300 rounded-md px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                />
            )}

            {tab === 'linux' && <CommandSheets sheets={linuxCheatSheets} search={search} />}
            {tab === 'ai-tools' && <CommandSheets sheets={aiCheatSheets} search={search} />}
            {tab === 'ai' && <HowAiWorks />}
        </div>
    );
}

export default CheatSheets;
