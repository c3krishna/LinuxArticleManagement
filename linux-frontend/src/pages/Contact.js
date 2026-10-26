import { useSearchParams } from 'react-router-dom';
import ServiceRequestForm from '../components/ServiceRequestForm';
import ContactCard from '../components/ContactCard';

function Contact() {
    const [params] = useSearchParams();
    const plan = params.get('plan');

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-8">
            <h1 className="text-[28px] font-semibold text-navy mb-1">Contact us</h1>
            <p className="text-[15px] text-slate-500 mb-6">Tell us about the problem or the project and we will get back to you.</p>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
                <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6" aria-label="Enquiry form">
                    <ServiceRequestForm
                        type="enquiry"
                        initialService={params.get('service')}
                        initialMessage={plan ? `I am interested in the ${plan} managed plan.` : ''}
                    />
                </section>
                <ContactCard />
            </div>
        </div>
    );
}

export default Contact;
