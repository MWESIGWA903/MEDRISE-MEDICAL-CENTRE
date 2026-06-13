import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routes = [
  {
    path: '/',
    title: 'MedRise Medical Centre | Matugga, Wakiso District, Uganda',
    description: 'MedRise Medical Centre — Compassionate healthcare in Matugga, Wakiso District. General medicine, maternity, laboratory, pharmacy, dental, paediatrics & specialist care. Open 24/7. Call +256 770 775268.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/',
  },
  {
    path: '/about',
    title: 'About Us | MedRise Medical Centre',
    description: 'Learn about MedRise Medical Centre in Matugga, Wakiso District. Our mission, vision, and core values of compassion, excellence, integrity, and respect.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/about',
  },
  {
    path: '/services',
    title: 'Our Services | MedRise Medical Centre',
    description: 'MedRise Medical Centre offers comprehensive healthcare services including general medicine, maternity, laboratory, pharmacy, dental, and specialist care. Open 24/7 in Matugga, Wakiso District.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/services',
  },
  {
    path: '/contact',
    title: 'Contact Us | MedRise Medical Centre',
    description: 'Contact MedRise Medical Centre in Matugga, Wakiso District. Call +256 770 775268 or +256 751 527730. Email medrisemedicalcentre@gmail.com. Open 24/7 for emergencies.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/contact',
  },
  {
    path: '/appointment',
    title: 'Book an Appointment | MedRise Medical Centre',
    description: 'Schedule your appointment at MedRise Medical Centre in Matugga, Wakiso District. Book online for general medicine, maternity, laboratory, pharmacy, dental, and specialist care.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/appointment',
  },
  {
    path: '/feedback',
    title: 'Share Your Experience | MedRise Medical Centre',
    description: 'Share your feedback about MedRise Medical Centre. Your experience helps us improve our healthcare services in Matugga, Wakiso District.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/feedback',
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | MedRise Medical Centre',
    description: 'Privacy Policy for MedRise Medical Centre. Learn how we protect your personal information and medical records in compliance with HIPAA regulations.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/privacy',
  },
  {
    path: '/terms',
    title: 'Terms of Service | MedRise Medical Centre',
    description: 'Terms of Service for MedRise Medical Centre. Read our terms and conditions for using our healthcare services and website.',
    canonical: 'https://medrise-medical-centre-medrise.vercel.app/terms',
  },
];

function generateStaticHtml() {
  const distDir = path.resolve(__dirname, '../dist/public');
  const indexHtmlPath = path.join(distDir, 'index.html');
  
  if (!fs.existsSync(indexHtmlPath)) {
    console.error('index.html not found. Run build first.');
    process.exit(1);
  }

  let indexHtml = fs.readFileSync(indexHtmlPath, 'utf-8');

  routes.forEach((route) => {
    // Replace title
    let html = indexHtml.replace(
      /<title>.*?<\/title>/,
      `<title>${route.title}</title>`
    );

    // Replace meta description
    html = html.replace(
      /<meta name="description" content=".*?"\/>/,
      `<meta name="description" content="${route.description}"/>`
    );

    // Replace canonical URL
    html = html.replace(
      /<link rel="canonical" href=".*?"\/>/,
      `<link rel="canonical" href="${route.canonical}"/>`
    );

    // Replace OG title
    html = html.replace(
      /<meta property="og:title" content=".*?"\/>/,
      `<meta property="og:title" content="${route.title}"/>`
    );

    // Replace OG description
    html = html.replace(
      /<meta property="og:description" content=".*?"\/>/,
      `<meta property="og:description" content="${route.description}"/>`
    );

    // Replace OG URL
    html = html.replace(
      /<meta property="og:url" content=".*?"\/>/,
      `<meta property="og:url" content="${route.canonical}"/>`
    );

    // Replace Twitter title
    html = html.replace(
      /<meta name="twitter:title" content=".*?"\/>/,
      `<meta name="twitter:title" content="${route.title}"/>`
    );

    // Replace Twitter description
    html = html.replace(
      /<meta name="twitter:description" content=".*?"\/>/,
      `<meta name="twitter:description" content="${route.description}"/>`
    );

    // Determine output filename
    const filename = route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`;
    const outputPath = path.join(distDir, filename);

    // Write the file
    fs.writeFileSync(outputPath, html);
    console.log(`Generated: ${filename}`);
  });

  console.log('Static HTML generation complete!');
}

generateStaticHtml();
