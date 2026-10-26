import { useSearchParams } from 'react-router-dom';
import ServiceRequestForm from '../components/ServiceRequestForm';
import ContactCard from '../components/ContactCard';

const STEPS = [
    'Choose a service and a day and time that suit you.',
    'We call or email to confirm the exact time, usually within one working day.',
    'We meet on a call or screen share, look at the problem and agree next steps.'
];

function Book() {
    const [params] = useSearchParams();

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-8">
            <h1 className="text-[28px] font-semibold text-navy mb-1">Book an appointment</h1>
            <p className="text-[15px] text-slate-500 mb-6">A call with an engineer about your servers, at a time that suits you.</p>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
                <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6" aria-label="Booking form">
                    <ServiceRequestForm type="booking" initialService={params.get('service')} />
                </section>
                <div className="space-y-4">
                    <section className="rounded-lg border border-slate-200 bg-white p-5" aria-labelledby="how-heading">
                        <h2 id="how-heading" className="text-[17px] font-semibold text-navy">How it works</h2>
                        <ol className="mt-3 space-y-3">
                            {STEPS.map((step, i) => (
                                <li key={step} className="flex gap-3">
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-600 text-[12px] font-semibold text-white" aria-hidden="true">{i + 1}</span>
                                    <span className="text-[14px] text-slate-700">{step}</span>
                                </li>
                            ))}
                        </ol>
                    </section>
                    <ContactCard />
                </div>
            </div>
        </div>
    );
}

export default Book;
