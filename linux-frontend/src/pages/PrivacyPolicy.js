const sections = [
    {
        title: 'Information Collection',
        text: 'Linux Docs may collect user information including name, email address, IP address, browser details, and usage analytics for authentication, security, and service improvements.'
    },
    {
        title: 'Cookies',
        text: 'This website may use cookies for login sessions, analytics, and improving user experience.'
    },
    {
        title: 'User Content',
        text: 'Questions, answers, forum posts, and uploaded documentation may be publicly visible to other users.'
    },
    {
        title: 'Third-Party Services',
        text: 'Linux Docs may integrate with Google Login, analytics services, CDN providers, and advertising platforms.'
    },
    {
        title: 'Security',
        text: 'We implement security measures to protect user data, authentication sessions, and uploaded content.'
    }
];

function PrivacyPolicy() {
    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10">
            <h1 className="text-[28px] font-semibold text-navy mb-1">Privacy policy</h1>
            <p className="text-[15px] text-slate-500 mb-6">How Linux Docs handles your information.</p>

            <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                {sections.map((s) => (
                    <section key={s.title} className="p-5 sm:p-6">
                        <h2 className="text-[18px] font-semibold text-navy mb-2">{s.title}</h2>
                        <p className="text-[16px] leading-relaxed text-slate-700">{s.text}</p>
                    </section>
                ))}
                <section className="p-5 sm:p-6">
                    <h2 className="text-[18px] font-semibold text-navy mb-2">Contact</h2>
                    <p className="text-[16px] leading-relaxed text-slate-700">
                        For privacy-related concerns contact:{' '}
                        <a href="mailto:admin@linux.server-issue.online" className="font-medium text-blue-700 underline underline-offset-2 break-words">admin@linux.server-issue.online</a>
                    </p>
                </section>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
