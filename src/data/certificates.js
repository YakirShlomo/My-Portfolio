/**
 * Certificates shown in the Certificates section's Folder UI.
 *
 * No certificate images exist in the repo yet (checked images/, public/,
 * and git history) — this array is intentionally empty rather than
 * populated with placeholders, so the site never shows fake credentials.
 *
 * To add a real certificate:
 * 1. Drop the image in `public/assets/certificates/` (e.g. `aws-cert.png`).
 * 2. Add an entry below:
 *    { id: 'aws-cert', title: 'AWS Certified Developer', issuer: 'Amazon Web Services',
 *      date: '2025', image: asset('assets/certificates/aws-cert.png') }
 *
 * The Folder component shows up to 3 items per folder — once there are
 * more than 3 real certificates, group them into additional folders.
 */
export const CERTIFICATES = [];
