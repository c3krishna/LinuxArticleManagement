import { Link } from 'react-router-dom';

const OFFER = [
    ['Knowledge base', 'Articles, cheat sheets and troubleshooting guides on Linux, DevOps, databases and AI, written by working engineers.', '/articles'],
    ['Network tools', 'Free checks for DNS, mail authentication, SSL certificates and web server security headers.', '/tools'],
    ['Community forum', 'Ask questions and share fixes with other engineers.', '/forum'],
    ['Services', 'Hands-on help with Linux servers, cloud, mail, databases, monitoring and VoIP.', '/services']
];

function About() {
    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-8 py-10">
            <h1 className="text-[28px] font-semibold text-navy mb-2">About us</h1>
            <p className="text-[17px] leading-relaxed text-slate-700">
                We help businesses, startups and IT teams run Linux servers, cloud infrastructure, mail systems, databases and VoIP
                reliably. The same engineers who fix production systems write the guides on this site.
            </p>

            <h2 className="mt-8 mb-3 text-[20px] font-semibold text-navy">What you will find here</h2>
            <ul className="space-y-3">
                {OFFER.map(([title, text, to]) => (
                    <li key={title} className="rounded-lg border border-slate-200 bg-white p-4">
                        <Link to={to} className="text-[16px] font-semibold text-blue-700 hover:underline">{title}</Link>
                        <p className="mt-0.5 text-[15px] text-slate-600">{text}</p>
                    </li>
                ))}
            </ul>

            <h2 className="mt-8 mb-2 text-[20px] font-semibold text-navy">Our mission</h2>
            <p className="text-[16px] leading-relaxed text-slate-700">
                To make production infrastructure dependable and understandable: fix the problem in front of you, and explain it so
                the next one is easier.
            </p>

            <h2 className="mt-8 mb-2 text-[20px] font-semibold text-navy">Get in touch</h2>
            <p className="text-[16px] leading-relaxed text-slate-700">
                For service enquiries, partnerships or technical support, <Link to="/contact" className="font-medium text-blue-700 underline">contact us</Link> or{' '}
                <Link to="/book" className="font-medium text-blue-700 underline">book an appointment</Link>.
            </p>
        </div>
    );
}

export default About;
