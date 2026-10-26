import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Check, Clock, ShieldCheck, Wrench } from 'lucide-react';
import { PLANS, SERVICES } from '../data/services';

const REASONS = [
    { icon: Clock, title: 'Fast response', text: 'Most enquiries get a reply within one working day.' },
    { icon: Wrench, title: 'Hands-on engineers', text: 'The people who write our guides fix the servers.' },
    { icon: ShieldCheck, title: 'Secure systems', text: 'Hardening, backups and monitoring are part of every setup.' }
];

function Services() {
    return (
        <div className="w-full">
            <section className="bg-navy text-white">
                <div className="mx-auto max-w-6xl px-4 sm:px-8 py-12 sm:py-14">
                    <p className="text-[13px] font-semibold uppercase tracking-wider text-blue-200">Services</p>
                    <h1 className="mt-2 max-w-3xl text-[30px] sm:text-[38px] font-semibold leading-tight tracking-tight">
                        Linux server, cloud and mail experts when you need them.
                    </h1>
                    <p className="mt-3 max-w-2xl text-[16px] text-slate-300">
                        Troubleshooting, setup and ongoing management for production infrastructure.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link to="/book" className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-[15px] font-medium hover:bg-blue-500 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
                            <CalendarCheck size={17} aria-hidden="true" /> Book an appointment
                        </Link>
                        <Link to="/contact" className="inline-flex items-center gap-2 rounded-md border border-white/30 px-5 py-2.5 text-[15px] font-medium hover:bg-white/10 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
                            Send an enquiry
                        </Link>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 sm:px-8 py-10 space-y-12">
                <section aria-labelledby="services-heading">
                    <h2 id="services-heading" className="text-[22px] font-semibold text-navy mb-4">What we do</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {SERVICES.map(({ name, icon: Icon, text }) => (
                            <li key={name} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
                                <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-700" aria-hidden="true"><Icon size={20} /></span>
                                <h3 className="mt-3 text-[16px] font-semibold text-navy">{name}</h3>
                                <p className="mt-1 flex-1 text-[14px] text-slate-600">{text}</p>
                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[14px] font-medium">
                                    <Link to={`/book?service=${encodeURIComponent(name)}`} className="text-blue-700 hover:underline">
                                        Book<span className="sr-only"> {name}</span>
                                    </Link>
                                    <Link to={`/contact?service=${encodeURIComponent(name)}`} className="text-blue-700 hover:underline">
                                        Ask a question<span className="sr-only"> about {name}</span>
                                    </Link>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section aria-labelledby="plans-heading">
                    <h2 id="plans-heading" className="text-[22px] font-semibold text-navy">Managed plans</h2>
                    <p className="mt-1 mb-4 text-[15px] text-slate-600">For servers we look after every month. One-off jobs are quoted after a first call.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {PLANS.map((plan) => (
                            <div key={plan.name} className={`flex flex-col rounded-lg border bg-white p-5 ${plan.highlight ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-[17px] font-semibold text-navy">{plan.name}</h3>
                                    {plan.highlight && <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[12px] font-semibold text-blue-800">Most popular</span>}
                                </div>
                                <p className="mt-2"><span className="text-[28px] font-semibold text-ink">{plan.price}</span> <span className="text-[14px] text-slate-500">{plan.period}</span></p>
                                <ul className="mt-4 flex-1 space-y-2">
                                    {plan.features.map((f) => (
                                        <li key={f} className="flex gap-2 text-[14px] text-slate-700"><Check size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-600" />{f}</li>
                                    ))}
                                </ul>
                                <Link to={`/contact?plan=${encodeURIComponent(plan.name)}`} className={`mt-5 inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-2 text-[14px] font-medium ${plan.highlight ? 'bg-blue-600 text-white hover:bg-blue-500' : 'border border-slate-300 text-navy hover:border-blue-500'}`}>
                                    Choose {plan.name} <ArrowRight size={15} aria-hidden="true" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>

                <section aria-labelledby="why-heading">
                    <h2 id="why-heading" className="text-[22px] font-semibold text-navy mb-4">Why work with us</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {REASONS.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy" aria-hidden="true"><Icon size={18} /></span>
                                <span>
                                    <strong className="block text-[15px] text-navy">{title}</strong>
                                    <span className="text-[14px] text-slate-600">{text}</span>
                                </span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="rounded-lg bg-blue-50 p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
                    <div>
                        <h2 className="text-[19px] font-semibold text-navy">Want to check something yourself first?</h2>
                        <p className="mt-1 text-[15px] text-slate-700">Our free network tools check DNS, mail records, SSL certificates and HTTP security headers.</p>
                    </div>
                    <Link to="/tools" className="mt-4 inline-flex shrink-0 items-center gap-1.5 rounded-md bg-navy px-4 py-2.5 text-[14px] font-medium text-white hover:bg-[#16345a] sm:mt-0">
                        Open network tools <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                </section>
            </div>
        </div>
    );
}

export default Services;
