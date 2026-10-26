import { Link } from 'react-router-dom';

const UPDATED = '26 October 2026';
const CONTACT = 'admin@linux.server-issue.online';

function ExternalLink({ href, children }) {
    return <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline underline-offset-2 break-words">{children}</a>;
}

const sections = [
    {
        title: 'Who we are',
        body: (
            <p>
                Linux Docs (linux.server-issue.online) publishes articles, cheat sheets and troubleshooting guides about Linux,
                DevOps and AI, and hosts a community forum. This policy explains what information we collect, why, and the
                choices you have.
            </p>
        )
    },
    {
        title: 'Information we collect',
        body: (
            <ul>
                <li><strong>Account details.</strong> If you register: your name, email address and password. Passwords are stored only as a one-way hash; we cannot read them.</li>
                <li><strong>Profile photo.</strong> Optional. If you upload one, it is stored on our server and shown next to your name.</li>
                <li><strong>Forum posts.</strong> Questions and answers you post, together with your name.</li>
                <li><strong>Article views.</strong> When you open an article we record which article, your IP address and the time. We use this to count views (once per visitor per article per day) and to show aggregate statistics to site administrators.</li>
                <li><strong>Server logs.</strong> Like most websites, our web server records requests, including IP address, browser type and the page requested, for security and troubleshooting.</li>
            </ul>
        )
    },
    {
        title: 'How we use it',
        body: (
            <ul>
                <li>To create and secure your account and let you sign in.</li>
                <li>To run the forum and show your posts and profile photo.</li>
                <li>To protect the site, for example by limiting repeated failed sign-in attempts.</li>
                <li>To understand which content is useful and improve it.</li>
            </ul>
        )
    },
    {
        title: 'Sign-in and browser storage',
        body: (
            <p>
                When you sign in, we keep a sign-in token in your browser&apos;s local storage so you stay signed in. We do not use our
                own cookies for this. Signing out removes the token. Advertising cookies set by Google are described below.
            </p>
        )
    },
    {
        title: 'Advertising (Google AdSense)',
        body: (
            <>
                <p>We use Google AdSense to show ads, which helps keep the site free.</p>
                <ul>
                    <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website and other websites.</li>
                    <li>Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the internet.</li>
                    <li>
                        You can opt out of personalised advertising in{' '}
                        <ExternalLink href="https://adssettings.google.com">Google Ads Settings</ExternalLink>, or opt out of some
                        third-party vendors&apos; use of cookies at{' '}
                        <ExternalLink href="https://www.aboutads.info/choices/">www.aboutads.info</ExternalLink>.
                    </li>
                    <li>
                        Learn more in{' '}
                        <ExternalLink href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</ExternalLink>.
                    </li>
                </ul>
            </>
        )
    },
    {
        title: 'Other services we use',
        body: (
            <ul>
                <li><strong>Google Fonts</strong> delivers the site&apos;s fonts, so your browser connects to Google&apos;s servers when pages load.</li>
                <li><strong>TinyMCE Cloud</strong> provides the article editor used by site administrators. It is not loaded for readers.</li>
            </ul>
        )
    },
    {
        title: 'What is public',
        body: (
            <p>
                Articles, forum questions and answers, the name you post under and your profile photo are visible to anyone
                visiting the site. Your email address is never shown publicly.
            </p>
        )
    },
    {
        title: 'Sharing',
        body: (
            <p>
                We do not sell your personal information. Apart from the services named above, we share information only if the
                law requires it or to protect the site and its users.
            </p>
        )
    },
    {
        title: 'Keeping and deleting your information',
        body: (
            <ul>
                <li>Account details are kept while your account exists.</li>
                <li>You can remove your profile photo at any time from <Link to="/account" className="font-medium text-blue-700 underline underline-offset-2">My account</Link>; the file is deleted from our server.</li>
                <li>To see, correct or delete your account information, email us at the address below.</li>
                <li>You can block or delete cookies in your browser settings; the site still works without advertising cookies.</li>
            </ul>
        )
    },
    {
        title: 'Security',
        body: (
            <p>
                The site is served over HTTPS, passwords are hashed, uploads are checked to be genuine images, and administrative
                features are limited to administrator accounts. No method of transmission or storage is completely secure, but we
                work to protect your information.
            </p>
        )
    },
    {
        title: 'Children',
        body: <p>Linux Docs is intended for a technical audience and is not directed at children under 13.</p>
    },
    {
        title: 'Changes to this policy',
        body: <p>If we change this policy we will update it on this page and change the date at the top.</p>
    }
];

function PrivacyPolicy() {
    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10">
            <h1 className="text-[28px] font-semibold text-navy mb-1">Privacy policy</h1>
            <p className="text-[15px] text-slate-500 mb-6">Last updated {UPDATED}</p>

            <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                {sections.map((s) => (
                    <section key={s.title} className="p-5 sm:p-6 text-[16px] leading-relaxed text-slate-700 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_p+ul]:mt-2 [&_strong]:font-semibold [&_strong]:text-ink">
                        <h2 className="text-[18px] font-semibold text-navy mb-2">{s.title}</h2>
                        {s.body}
                    </section>
                ))}
                <section className="p-5 sm:p-6">
                    <h2 className="text-[18px] font-semibold text-navy mb-2">Contact</h2>
                    <p className="text-[16px] leading-relaxed text-slate-700">
                        For privacy questions or requests, email{' '}
                        <a href={`mailto:${CONTACT}`} className="font-medium text-blue-700 underline underline-offset-2 break-words">{CONTACT}</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default PrivacyPolicy;
