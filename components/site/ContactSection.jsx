import ContactForm from './ContactForm';

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-sm text-soft">{label}</dt>
      <dd className="font-display text-lg font-bold">{children}</dd>
    </div>
  );
}

export default function ContactSection({ contact }) {
  const phoneHref = contact.phone ? `tel:${contact.phone.replace(/[^+0-9]/g, '')}` : null;

  return (
    <section id="contact" className="border-t border-line bg-panel">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-[1fr_1.1fr] md:gap-20 md:py-32">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-second">{contact.eyebrow}</p>
          <h2
            data-reveal
            className="mb-6 font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl"
          >
            {contact.heading}
          </h2>
          <p data-reveal className="mb-8 max-w-md text-lg text-soft">
            {contact.body}
          </p>

          <dl data-reveal className="space-y-5">
            {contact.studio ? <Detail label="Studio">{contact.studio}</Detail> : null}
            {contact.email ? (
              <Detail label="Email">
                <a
                  href={`mailto:${contact.email}`}
                  className="underline decoration-line underline-offset-4 transition-colors hover:text-second hover:decoration-second"
                >
                  {contact.email}
                </a>
              </Detail>
            ) : null}
            {contact.phone && phoneHref ? (
              <Detail label="Phone">
                <a
                  href={phoneHref}
                  className="underline decoration-line underline-offset-4 transition-colors hover:text-second hover:decoration-second"
                >
                  {contact.phone}
                </a>
              </Detail>
            ) : null}
            {contact.hours ? <Detail label="Hours">{contact.hours}</Detail> : null}
          </dl>
        </div>

        <div data-reveal>
          <ContactForm contact={contact} />
        </div>
      </div>
    </section>
  );
}
