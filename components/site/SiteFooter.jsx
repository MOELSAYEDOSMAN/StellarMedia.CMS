import StarMark from './StarMark';

export default function SiteFooter({ brand, footer, nav, services }) {
  const year = new Date().getFullYear();
  const links = Array.isArray(nav.links) ? nav.links : [];
  const socials = Array.isArray(footer.socials) ? footer.socials.filter((social) => social.url) : [];
  const serviceNames = Array.isArray(services.items) ? services.items.map((item) => item.name) : [];

  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="#top" className="inline-flex items-center gap-2 font-display text-xl font-extrabold">
            {brand.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoImage} alt="" className="h-6 w-auto" loading="lazy" />
            ) : (
              <StarMark className="h-6 w-6 text-second" />
            )}
            {brand.name}
          </a>
          <p className="mt-3 max-w-xs text-soft">{footer.blurb}</p>
          {socials.length ? (
            <ul className="mt-5 flex flex-wrap gap-3">
              {socials.map((social) => (
                <li key={social.id || social.label}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm text-soft transition-colors hover:border-second hover:text-second"
                  >
                    {social.label}
                    <span aria-hidden="true">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav aria-label="Footer">
          <h2 className="mb-3 font-display font-bold">Explore</h2>
          <ul className="space-y-2 text-soft">
            {links.map((link) => (
              <li key={`f-${link.label}-${link.target}`}>
                <a href={link.target} className="transition-colors hover:text-second">
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="/admin" className="transition-colors hover:text-second">
                CMS
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-display font-bold">Services</h2>
          <ul className="space-y-2 text-soft">
            {serviceNames.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 px-5 py-5 text-sm text-soft">
          <span>
            © {year} {footer.copyright || `${brand.name}. All rights reserved.`}
          </span>
          <a href="#top" className="transition-colors hover:text-second">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
