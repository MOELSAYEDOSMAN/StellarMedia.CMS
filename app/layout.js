import './globals.css';
import { getContent } from '@/lib/content';
import { themeVars } from '@/lib/colors';

function safeBrand() {
  try {
    return getContent().brand;
  } catch {
    return {
      name: 'Stellar Media',
      tagline: 'Marketing & creative agency, Abu Dhabi',
      metaTitle: 'Stellar Media | Marketing & creative agency, Abu Dhabi',
      metaDescription:
        'Stellar Media is an Abu Dhabi marketing and creative agency working with government entities and major brands.',
      mainColor: '#150f14',
      secondColor: '#75fff9',
      logoImage: '',
    };
  }
}

export async function generateMetadata() {
  const brand = safeBrand();
  const description = brand.metaDescription || brand.tagline || '';
  return {
    title: {
      default: brand.metaTitle || brand.name,
      template: `%s · ${brand.name}`,
    },
    description,
    applicationName: brand.name,
    openGraph: {
      title: brand.metaTitle || brand.name,
      description,
      siteName: brand.name,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: brand.metaTitle || brand.name, description },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        {
          url:
            'data:image/svg+xml,' +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="8" fill="#150f14"/><path d="M16 5l2.6 8.4L27 16l-8.4 2.6L16 27l-2.6-8.4L5 16l8.4-2.6z" fill="#75fff9"/></svg>',
            ),
        },
      ],
    },
  };
}

export const viewport = {
  themeColor: '#150f14',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  const brand = safeBrand();
  const style = themeVars(brand);

  return (
    <html lang="en" style={style} className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
