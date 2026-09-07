import { asset } from '../lib/constants.js';

/**
 * Certificates shown in the compact Certificates modal opened from About.
 *
 * Each entry:
 * - id, title, issuer (optional), date (optional)
 * - image: path to the certificate file, via asset() so it resolves
 *   correctly under the GitHub Pages base path
 * - type: 'image' (default) or 'pdf' — controls whether the thumbnail and
 *   lightbox render an <img> or an embedded PDF viewer with an Open PDF link
 *
 * The Folder component shows up to 3 items per folder — once there are
 * more than 3 real certificates, group them into additional folders.
 */
export const CERTIFICATES = [
  {
    id: 'certificate',
    title: 'Certificate',
    type: 'image',
    image: asset('assets/certificates/Certificate.JPG'),
  },
  {
    id: 'kernelios-certificate',
    title: 'Kernelios Certificate',
    type: 'image',
    image: asset('assets/certificates/kernelios .JPG'),
  },
  {
    id: 'le-certificate',
    title: 'LE Certificate',
    type: 'pdf',
    image: asset('assets/certificates/LE.pdf'),
  },
];
