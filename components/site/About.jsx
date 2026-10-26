export default function About({ about }) {
  const principles = Array.isArray(about.principles) ? about.principles : [];

  return (
    <section id="about" className="mx-auto grid max-w-6xl gap-12 px-5 py-24 md:grid-cols-2 md:gap-20 md:py-32">
      <div>
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-second">{about.eyebrow}</p>
        <h2
          data-reveal
          className="font-display text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl"
        >
          {about.heading}
        </h2>
      </div>

      <div className="space-y-8">
        <p data-reveal className="text-lg text-soft">
          {about.body}
        </p>

        {principles.length ? (
          <ul className="divide-y divide-line border-y border-line">
            {principles.map((principle, index) => (
              <li
                key={principle.id || principle.title}
                data-reveal
                style={{ '--d': `${index * 90}ms` }}
                className="group py-6"
              >
                <h3 className="mb-1 font-display text-xl font-bold transition-colors group-hover:text-second">
                  {principle.title}
                </h3>
                <p className="text-soft">{principle.text}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
