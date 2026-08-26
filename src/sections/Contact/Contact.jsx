import { useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion.js';
import { CONTACT_LINKS, EMAIL } from '../../lib/constants.js';
import SplitText from '../../components/react-bits/SplitText.jsx';
import AnimatedContent from '../../components/react-bits/AnimatedContent.jsx';
import Icon from '../../components/icons/Icon.jsx';
import './Contact.css';

const EMPTY_FORM = { name: '', subject: '', message: '' };
const LIMITS = { name: 80, subject: 120, message: 1200 };

export default function Contact() {
  const reducedMotion = useReducedMotion();

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  function updateField(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setErrors((err) => ({ ...err, [field]: undefined }));
      setSent(false);
    };
  }

  function validate(field, rawValue, label) {
    const value = rawValue.trim();
    if (!value) return `Please add ${label}.`;
    if (value.length > LIMITS[field]) return `Keep ${label} under ${LIMITS[field]} characters.`;
    return null;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const name = form.name.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();

    const nextErrors = {
      name: validate('name', form.name, 'your name'),
      subject: validate('subject', form.subject, 'a subject'),
      message: validate('message', form.message, 'a message'),
    };
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setSent(false);
      return;
    }

    const body = `From: ${name}\n\n${message}`;
    const mailto = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    setSent(true);
  }

  return (
    <section id="contact" className="section section--contact">
      <div className="section__head">
        <span className="section__index">04</span>
        {reducedMotion ? (
          <h2 className="section__title">Get in touch</h2>
        ) : (
          <SplitText text="Get in touch" tag="h2" className="section__title" splitType="chars" delay={22} />
        )}
      </div>

      <div className="contact-inner">
        <AnimatedContent distance={16}>
          <p className="contact-eyebrow">
            <span className="dot" /> Open to new opportunities · Available now
          </p>
        </AnimatedContent>

        <div className="contact-grid">
          <AnimatedContent distance={16} delay={0.1}>
            <form className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="contact-form__field">
                <label htmlFor="contact-name">Name</label>
                <input
                  id="contact-name"
                  type="text"
                  value={form.name}
                  onChange={updateField('name')}
                  maxLength={LIMITS.name}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? 'contact-name-error' : undefined}
                />
                {errors.name && (
                  <span className="contact-form__error" id="contact-name-error" role="alert">
                    {errors.name}
                  </span>
                )}
              </div>

              <div className="contact-form__field">
                <label htmlFor="contact-subject">Subject</label>
                <input
                  id="contact-subject"
                  type="text"
                  value={form.subject}
                  onChange={updateField('subject')}
                  maxLength={LIMITS.subject}
                  aria-invalid={!!errors.subject}
                  aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                />
                {errors.subject && (
                  <span className="contact-form__error" id="contact-subject-error" role="alert">
                    {errors.subject}
                  </span>
                )}
              </div>

              <div className="contact-form__field">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  rows={5}
                  value={form.message}
                  onChange={updateField('message')}
                  maxLength={LIMITS.message}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? 'contact-message-error' : undefined}
                />
                {errors.message && (
                  <span className="contact-form__error" id="contact-message-error" role="alert">
                    {errors.message}
                  </span>
                )}
              </div>

              <div className="contact-form__submit-row">
                <button type="submit" className="btn btn--primary contact-form__submit">
                  <span className="btn__label">
                    <Icon name="paperPlane" /> Send
                  </span>
                </button>
                <span className="contact-form__hint">Your email app will open with the message ready to send.</span>
              </div>

              {sent && (
                <p className="contact-form__note" role="status">
                  Opening your email app…
                </p>
              )}
            </form>
          </AnimatedContent>

          <AnimatedContent distance={16} delay={0.15}>
            <ul className="contact-links">
              {CONTACT_LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    className="contact-row"
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noopener noreferrer' : undefined}
                  >
                    <span className="contact-row__icon">
                      <Icon name={link.icon} size={17} />
                    </span>
                    <span className="contact-row__label">{link.label}</span>
                    <span className="contact-row__value">{link.value}</span>
                    <span className="contact-row__arrow">
                      <Icon name="arrowUpRight" size={14} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </AnimatedContent>
        </div>
      </div>
    </section>
  );
}
