import { Mail, MessageCircle, Phone } from 'lucide-react';
import { CONTACT } from '../data/services';

function ContactCard() {
    const rows = [
        { icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` },
        { icon: Phone, label: 'Phone', value: CONTACT.phone, href: CONTACT.phoneHref },
        { icon: MessageCircle, label: 'WhatsApp', value: 'Chat on WhatsApp', href: CONTACT.whatsapp, external: true }
    ];
    return (
        <aside className="rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="contact-card-heading">
            <h2 id="contact-card-heading" className="text-[17px] font-semibold text-navy">Talk to us directly</h2>
            <ul className="mt-3 space-y-3">
                {rows.map(({ icon: Icon, label, value, href, external }) => (
                    <li key={label} className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true"><Icon size={17} /></span>
                        <span className="min-w-0">
                            <span className="block text-[13px] text-slate-500">{label}</span>
                            <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="break-words text-[15px] font-medium text-blue-700 hover:underline">{value}</a>
                        </span>
                    </li>
                ))}
            </ul>
            <p className="mt-4 border-t border-slate-100 pt-3 text-[13px] text-slate-500">We usually reply within one working day.</p>
        </aside>
    );
}

export default ContactCard;
