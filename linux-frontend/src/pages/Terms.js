import { Link } from 'react-router-dom';
import { CONTACT } from '../data/services';

const UPDATED = '27 October 2026';

const sections = [
    ['Acceptance', 'By using this website you agree to these terms. If you do not agree, please do not use the site.'],
    ['Content', 'Articles, cheat sheets and forum posts are general information. Test commands and configuration changes on a non-production system first; you are responsible for changes you make to your own systems.'],
    ['Network tools', 'Use the network tools only on domains you own or are authorised to test. Do not use them to probe, overload or attack other systems. Checks are rate-limited and may be blocked if misused.'],
    ['Accounts and forum', 'Keep your password secure and do not share your account. Do not post unlawful, abusive or misleading content, spam, or other people\'s personal data. We may remove posts or suspend accounts that break these rules.'],
    ['Enquiries and bookings', 'Submitting an enquiry or booking request does not create a contract. Paid work is agreed separately in writing, including scope, price and timing. Appointment times are confirmed by us before they are fixed.'],
    ['Advertising', 'This site shows advertising, including Google AdSense. We are not responsible for the content of third-party ads or the sites they link to.'],
    ['Limitation of liability', 'The site and tools are provided "as is". To the extent the law allows, we are not liable for loss of data, downtime or indirect damages arising from use of the site or its content.'],
    ['Changes', 'We may update these terms. The date at the top shows when they last changed.']
];

function Terms() {
    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10">
            <h1 className="text-[28px] font-semibold text-navy mb-1">Terms of use</h1>
            <p className="text-[15px] text-slate-500 mb-6">Last updated {UPDATED}</p>
            <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
                {sections.map(([title, text]) => (
                    <section key={title} className="p-5 sm:p-6">
                        <h2 className="text-[18px] font-semibold text-navy mb-2">{title}</h2>
                        <p className="text-[16px] leading-relaxed text-slate-700">{text}</p>
                    </section>
                ))}
                <section className="p-5 sm:p-6">
                    <h2 className="text-[18px] font-semibold text-navy mb-2">Contact</h2>
                    <p className="text-[16px] leading-relaxed text-slate-700">
                        Questions about these terms: <a href={`mailto:${CONTACT.email}`} className="font-medium text-blue-700 underline">{CONTACT.email}</a>.
                        See also our <Link to="/privacy-policy" className="font-medium text-blue-700 underline">privacy policy</Link>.
                    </p>
                </section>
            </div>
        </div>
    );
}

export default Terms;
