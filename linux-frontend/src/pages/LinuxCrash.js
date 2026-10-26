import { Link } from 'react-router-dom';

const tools = [
    {
        title: 'Kernel diagnostics with dmesg',
        intro: 'The kernel logs all hardware events, driver initializations, and critical system faults to a temporary memory buffer called the ring buffer.',
        commands: ['dmesg -T'],
        points: [
            ['Why use it', 'If the system crashed due to a hardware fault, a failing hard drive, or an OOM (Out of Memory) Kill where the kernel forced an application to close to save itself, dmesg will show it.'],
            ['The -T flag', 'By default, dmesg shows delta-time stamps (e.g., [ 12345.6789]). Adding -T converts these into human-readable date and time stamps, allowing you to match the exact moment of the crash.']
        ]
    },
    {
        title: 'Deep dive logs with journalctl',
        intro: 'On modern Linux distributions utilizing systemd, system logs, service errors, and boot messages are centralized into a binary logging service.',
        commands: ['journalctl -xe'],
        points: [
            ['Why use it', 'The -x flag adds explanatory text to log messages (catalog explanations) where available, which helps decipher cryptic error codes. The -e flag immediately jumps to the very end of the log pager so you can look backward from the point of failure.']
        ],
        after: {
            label: 'Historical analysis',
            text: 'If the server rebooted after a crash, you can view the logs of the previous boot session by running:',
            command: 'journalctl -b -1 -e'
        }
    },
    {
        title: 'System environment verification with uname',
        intro: 'Before diving into crash dumps or looking up specific kernel bug reports online, you must know the exact environment parameters of the machine.',
        commands: ['uname -a'],
        points: [
            ['Why use it', 'The -a (all) flag prints your exact system architecture, hostname, network node, and most importantly, the exact Kernel Release Version and build date. Many kernel panics are known bugs tied to specific kernel versions; knowing this helps you verify if a kernel update/patch is required to fix the stability issue.']
        ]
    }
];

const kdump = [
    ['How it works', 'Kdump reserves a small amount of system memory at boot time.'],
    ['The panic handover', 'When a kernel panic occurs, the main kernel instantly hands control over to a secondary "crash kernel" residing in that reserved memory space.'],
    ['The core dump', 'Because the crash kernel runs in an isolated memory space, it remains unaffected by the main system crash. It captures the exact state of the system memory and writes it as a core dump file (usually located at /var/crash/).'],
    ['Analysis', 'You can later use a tool called crash alongside the gdb debugger to inspect the exact function call stack that triggered the panic.']
];

function Command({ children }) {
    return <code className="block rounded-md bg-navy px-3.5 py-2.5 font-mono text-[14px] text-slate-100 overflow-x-auto">{children}</code>;
}

function LinuxCrash() {
    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-8 py-8">
            <h1 className="text-[28px] font-semibold text-navy mb-1">Linux crash analysis</h1>
            <p className="text-[15px] text-slate-500 mb-6">Kernel panics and how to reconstruct what happened.</p>

            <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6 mb-6">
                <h2 className="text-[20px] font-semibold text-navy mb-2">Kernel panic</h2>
                <p className="text-[16px] leading-relaxed text-slate-700">
                    When a Linux server crashes or experiences a Kernel Panic (the Linux equivalent of a Blue Screen of Death), the system abruptly stops to prevent data corruption. Analyzing these crashes requires looking at persistent logs and kernel ring buffers to piece together the timeline of the failure.
                </p>
                <p className="text-[16px] leading-relaxed text-slate-700 mt-3">
                    Based on standard system diagnostics, here is how you analyze a Linux server crash using the primary tools:
                </p>
            </section>

            <ol className="space-y-4 mb-8">
                {tools.map((tool, i) => (
                    <li key={tool.title} className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                        <h2 className="flex items-center gap-3 text-[18px] font-semibold text-navy mb-2">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[13px] font-semibold text-white" aria-hidden="true">{i + 1}</span>
                            {tool.title}
                        </h2>
                        <p className="text-[15px] leading-relaxed text-slate-700 mb-3">{tool.intro}</p>
                        {tool.commands.map((c) => <Command key={c}>{c}</Command>)}
                        <dl className="mt-4 space-y-2.5">
                            {tool.points.map(([label, text]) => (
                                <div key={label}>
                                    <dt className="text-[14px] font-semibold text-ink">{label}</dt>
                                    <dd className="text-[15px] leading-relaxed text-slate-700">{text}</dd>
                                </div>
                            ))}
                        </dl>
                        {tool.after && (
                            <div className="mt-4">
                                <p className="text-[15px] leading-relaxed text-slate-700 mb-2">
                                    <strong className="font-semibold text-ink">{tool.after.label}:</strong> {tool.after.text}
                                </p>
                                <Command>{tool.after.command}</Command>
                            </div>
                        )}
                    </li>
                ))}
            </ol>

            <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-[20px] font-semibold text-navy mb-2">The advanced crash analysis workflow</h2>
                <p className="text-[15px] leading-relaxed text-slate-700 mb-4">
                    If the commands above don&apos;t provide enough details because the system froze completely without writing to standard logs, system administrators rely on a mechanism called Kdump (Kernel Crash Dump).
                </p>
                <ol className="space-y-3">
                    {kdump.map(([label, text], i) => (
                        <li key={label} className="flex gap-3">
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-50 text-[12px] font-semibold text-blue-800" aria-hidden="true">{i + 1}</span>
                            <p className="text-[15px] leading-relaxed text-slate-700"><strong className="font-semibold text-ink">{label}:</strong> {text}</p>
                        </li>
                    ))}
                </ol>
            </section>

            <p className="mt-6 text-[14px] text-slate-500">
                More production problems and their fixes are on the <Link to="/issues" className="font-medium text-blue-700 hover:underline">Troubleshooting</Link> page.
            </p>
        </div>
    );
}

export default LinuxCrash;
