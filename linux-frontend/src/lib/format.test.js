import { formatNumber, fromLocalInput, initials, slugify, timeAgo, toLocalInput } from './format';
import { safeNext } from '../components/AuthShell';

test('slugify makes URL-safe slugs', () => {
    expect(slugify('SaaS Security in the AI Era')).toBe('saas-security-in-the-ai-era');
    expect(slugify('  Docker & Kubernetes: 101!  ')).toBe('docker-kubernetes-101');
    expect(slugify('Café déjà vu')).toBe('cafe-deja-vu');
    expect(slugify('---')).toBe('');
});

test('local datetime input round-trips through ISO', () => {
    const iso = fromLocalInput('2026-11-02T09:30');
    expect(toLocalInput(iso)).toBe('2026-11-02T09:30');
    expect(fromLocalInput('')).toBeNull();
});

test('number, initials and relative time formatting', () => {
    expect(formatNumber(8420)).toBe('8,420');
    expect(formatNumber(24800)).toBe('24.8k');
    expect(initials('Krishnakumar Pethiah')).toBe('KP');
    const now = Date.parse('2026-10-26T12:00:00Z');
    expect(timeAgo('2026-10-26T11:42:00Z', now)).toBe('18m ago');
    expect(timeAgo('2026-10-25T10:00:00Z', now)).toBe('Yesterday');
});

test('post-login redirect only allows same-site paths', () => {
    expect(safeNext('/admin/articles')).toBe('/admin/articles');
    expect(safeNext('//evil.example')).toBeNull();
    expect(safeNext('https://evil.example')).toBeNull();
    expect(safeNext(null)).toBeNull();
});
