import { Activity, Cloud, DatabaseBackup, Globe, LockKeyhole, Mail, Network, PhoneCall, Server } from 'lucide-react';

// Names must match linux-api/lib/services.js: the API only accepts these.
export const SERVICES = [
    {
        name: 'Server troubleshooting',
        icon: Server,
        text: 'Diagnose and fix Linux server problems: high load, memory and disk exhaustion, failing services and network faults.'
    },
    {
        name: 'Mail server setup',
        icon: Mail,
        text: 'Postfix and Dovecot mail servers with SPF, DKIM and DMARC, spam filtering and reliable delivery.'
    },
    {
        name: 'AWS & Oracle Cloud',
        icon: Cloud,
        text: 'Deploy, migrate and tune cloud infrastructure for reliability and cost.'
    },
    {
        name: 'Backup & disaster recovery',
        icon: DatabaseBackup,
        text: 'Automated, tested backups and a recovery plan for your critical data.'
    },
    {
        name: 'SSL installation',
        icon: LockKeyhole,
        text: 'Certificates, HTTPS configuration and automatic renewal, so certificates never expire unnoticed.'
    },
    {
        name: 'MySQL / MariaDB high availability',
        icon: Network,
        text: 'Replication, failover and performance tuning for databases that cannot go down.'
    },
    {
        name: 'Domain & DNS management',
        icon: Globe,
        text: 'Domains, DNS records and email routing configured correctly the first time.'
    },
    {
        name: '24/7 monitoring',
        icon: Activity,
        text: 'Prometheus and Grafana monitoring with alerts before your users notice a problem.'
    },
    {
        name: 'Asterisk PBX setup',
        icon: PhoneCall,
        text: 'Asterisk PBX with SIP trunks, WebRTC calling and real-time call monitoring.'
    }
];

export const GENERAL_ENQUIRY = 'General enquiry';
export const SERVICE_NAMES = [...SERVICES.map((s) => s.name), GENERAL_ENQUIRY];

export const SLOTS = ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–7pm)'];
export const MAX_BOOKING_DAYS = 90;

export const PLANS = [
    { name: 'Basic', price: '₹1,999', period: 'per month', features: ['Server monitoring', 'Email support', 'Monthly health report'] },
    { name: 'Standard', price: '₹4,999', period: 'per month', features: ['Everything in Basic', 'Cloud support', 'Managed backups'], highlight: true },
    { name: 'Premium', price: '₹9,999', period: 'per month', features: ['Everything in Standard', '24/7 support', 'High-availability setup', 'Security hardening'] }
];

export const CONTACT = {
    email: 'serverissue.online@gmail.com',
    phone: '+91 77082 71236',
    phoneHref: 'tel:+917708271236',
    whatsapp: 'https://wa.me/917708271236'
};
