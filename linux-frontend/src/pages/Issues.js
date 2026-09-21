function Issues() {
    const issues = [
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

    return (
        <div className='px-4 sm:px-8 py-8 space-y-6'>
            <div>
                <h1 className='text-[28px] font-semibold text-navy mb-1'>Linux troubleshooting</h1>
                <p className='text-[15px] text-slate-500'>Common production alerts and how to diagnose them.</p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {issues.map((issue, index) => (
                    <div key={index} className='bg-white border border-slate-200 rounded-lg p-4 flex flex-col justify-between gap-3'>
                        <div>
                            <h2 className='text-[16px] font-semibold text-ink'>{issue.title}</h2>
                            <p className='text-[14px] text-slate-600 mt-1'>{issue.desc}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-[11px] font-semibold uppercase w-fit ${
                            issue.severity === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700'
                                : issue.severity === 'HIGH'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-emerald-50 text-emerald-700'
                        }`}>
                            {issue.severity}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Issues;
