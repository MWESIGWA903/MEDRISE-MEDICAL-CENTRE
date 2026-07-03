/**
 * SEO Metadata Configuration
 * Canonical domain: https://medrise-medical-centre.onrender.com
 */

export const CANONICAL_DOMAIN = 'https://medrise-medical-centre.onrender.com';

export const SEO_METADATA = {
  home: {
    title: 'MedRise Medical Centre | Matugga, Wakiso District, Uganda',
    description:
      'MedRise Medical Centre — Compassionate healthcare in Matugga, Wakiso District. General medicine, maternity, laboratory, pharmacy, dental, paediatrics & specialist care. Open 24/7. Call +256 770 775268.',
    keywords:
      'MedRise Medical Centre, clinic Matugga, hospital Wakiso, doctor Uganda, maternity clinic Uganda, pharmacy Matugga, dental clinic Uganda, 24 hour clinic Uganda',
    path: '/',
  },
  about: {
    title: 'About Us | MedRise Medical Centre',
    description:
      'Learn about MedRise Medical Centre in Matugga, Wakiso District. Our mission, vision, and core values of compassion, excellence, integrity, and respect.',
    keywords: 'About MedRise, medical centre Wakiso, healthcare Uganda',
    path: '/about',
  },
  services: {
    title: 'Services | MedRise Medical Centre',
    description:
      'Comprehensive healthcare services at MedRise Medical Centre. General medicine, maternity, laboratory, pharmacy, dental, paediatrics, and specialist care.',
    keywords: 'Medical services, maternity care, laboratory testing, pharmacy, dental services, Uganda',
    path: '/services',
  },
  appointment: {
    title: 'Book an Appointment | MedRise Medical Centre',
    description:
      'Schedule your medical appointment at MedRise Medical Centre. Fast, easy online booking for general, maternity, dental, and specialist services.',
    keywords: 'Book appointment, medical appointment, schedule doctor, Uganda clinic',
    path: '/appointment',
  },
  contact: {
    title: 'Contact Us | MedRise Medical Centre',
    description:
      'Contact MedRise Medical Centre in Matugga, Wakiso District. Call +256 770 775268 or +256 751 527730. Email medrisemedicalcentre@gmail.com. Open 24/7 for emergencies.',
    keywords: 'Contact MedRise, hospital phone, clinic address, emergency Uganda',
    path: '/contact',
  },
  feedback: {
    title: 'Feedback | MedRise Medical Centre',
    description:
      'Share your feedback and experience with MedRise Medical Centre. Your input helps us improve our healthcare services.',
    keywords: 'Feedback, patient reviews, healthcare ratings, Uganda clinic',
    path: '/feedback',
  },
  privacy: {
    title: 'Privacy Policy | MedRise Medical Centre',
    description:
      'Privacy Policy and Medical Disclaimer for MedRise Medical Centre. Learn how we protect your personal and medical information.',
    keywords: 'Privacy policy, medical confidentiality, data protection',
    path: '/privacy',
  },
  terms: {
    title: 'Terms of Service | MedRise Medical Centre',
    description:
      'Terms of Service and Conditions for using MedRise Medical Centre website and services.',
    keywords: 'Terms of service, conditions of use',
    path: '/terms',
  },
};

export function getCanonicalUrl(path: string = '/'): string {
  return `${CANONICAL_DOMAIN}${path}`;
}

export function getSeoMeta(pageKey: keyof typeof SEO_METADATA) {
  const meta = SEO_METADATA[pageKey];
  return {
    ...meta,
    canonicalUrl: getCanonicalUrl(meta.path),
  };
}
