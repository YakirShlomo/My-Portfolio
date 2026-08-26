import { useState } from 'react';
import { CERTIFICATES } from '../../data/certificates.js';
import Folder from '../react-bits/Folder/Folder.jsx';
import CertificateLightbox from '../modals/CertificateLightbox.jsx';
import Icon from '../icons/Icon.jsx';
import './CertificatesGallery.css';

const FOLDER_SIZE = 3;

function chunk(list, size) {
  const groups = [];
  for (let i = 0; i < list.length; i += size) groups.push(list.slice(i, i + size));
  return groups;
}

/**
 * Shared certificate data + lightbox — used both by the full Certificates
 * section (decorative Folder reveal) and the compact modal opened from
 * About (a direct thumbnail grid, so it behaves like the Resume viewer:
 * open it and the content is right there, no extra click to "open" it).
 */
export default function CertificatesGallery({ emptyHint, compact = false }) {
  const [active, setActive] = useState(null);

  if (CERTIFICATES.length === 0) {
    return (
      <>
        <div className={`certificates-empty${compact ? ' certificates-empty--compact' : ''}`}>
          <Icon name="folder" size={compact ? 22 : 28} />
          <p>{emptyHint || "Certificates are coming soon — this section is wired up and ready, it just doesn't have any images yet."}</p>
        </div>
      </>
    );
  }

  if (compact) {
    return (
      <>
        <div className="certificates-grid">
          {CERTIFICATES.map((cert) => (
            <button
              key={cert.id}
              type="button"
              className="cert-paper-thumb cert-paper-thumb--grid"
              onClick={() => setActive(cert)}
              aria-label={`View certificate: ${cert.title}`}
            >
              <img src={cert.image} alt="" />
              <span className="cert-paper-thumb__label">{cert.title}</span>
            </button>
          ))}
        </div>
        <CertificateLightbox certificate={active} onClose={() => setActive(null)} />
      </>
    );
  }

  const folders = chunk(CERTIFICATES, FOLDER_SIZE);
  return (
    <>
      <div className="certificates-folders">
        {folders.map((group, i) => (
          <Folder
            key={i}
            color="#6fc7d6"
            items={group.map((cert) => (
              <button
                key={cert.id}
                type="button"
                className="cert-paper-thumb"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive(cert);
                }}
                aria-label={`View certificate: ${cert.title}`}
              >
                <img src={cert.image} alt="" />
              </button>
            ))}
          />
        ))}
      </div>
      <CertificateLightbox certificate={active} onClose={() => setActive(null)} />
    </>
  );
}
