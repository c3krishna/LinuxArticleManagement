// The services customers can enquire about or book. Keep in step with linux-frontend/src/data/services.js.
const SERVICES = [
    'Server troubleshooting',
    'Mail server setup',
    'AWS & Oracle Cloud',
    'Backup & disaster recovery',
    'SSL installation',
    'MySQL / MariaDB high availability',
    'Domain & DNS management',
    '24/7 monitoring',
    'Asterisk PBX setup',
    'General enquiry'
];

const SLOTS = ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–7pm)'];

const STATUSES = ['new', 'contacted', 'scheduled', 'completed', 'closed', 'spam'];

module.exports = { SERVICES, SLOTS, STATUSES };
