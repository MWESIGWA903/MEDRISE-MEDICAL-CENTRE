import {
  Stethoscope,
  Heart,
  Scissors,
  Activity,
  Baby,
  ScanLine,
  FlaskConical,
  Pill,
  Smile,
  Mic2,
} from 'lucide-react';
import React from 'react';
import { Helmet } from 'react-helmet-async';

import { Layout } from '@/components/layout/Layout';
import { DEPARTMENTS } from '@/lib/constants';
import { getSeoMeta } from '@/lib/seo';
import { DEPT_ICONS_LARGE, COLOR_MAP } from '@/lib/ui-constants';

const seoMeta = getSeoMeta('services');

const DEPT_ICONS: Record<string, React.ReactNode> = DEPT_ICONS_LARGE;

export default function Services() {
  return (
    <Layout>
      <Helmet>
        <title>{seoMeta.title}</title>
        <meta name="description" content={seoMeta.description} />
        <link rel="canonical" href={seoMeta.canonicalUrl} />
        <meta property="og:title" content={seoMeta.title} />
        <meta property="og:description" content={seoMeta.description} />
        <meta property="og:url" content={seoMeta.canonicalUrl} />
        <meta name="twitter:title" content={seoMeta.title} />
        <meta name="twitter:description" content={seoMeta.description} />
      </Helmet>
      {/* Page Header */}
      <section className="bg-primary/5 py-16 border-b border-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">Our Services</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            MEDRISE Medical Centre offers {DEPARTMENTS.length} professional healthcare services
            under one roof, each staffed by trained specialists committed to your well-being.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEPARTMENTS.map((dept, index) => {
              const colors = COLOR_MAP[dept.color] ?? COLOR_MAP.blue;
              return (
                <div
                  key={dept.id}
                  className={`flex gap-5 p-6 rounded-2xl border ${colors.border} hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 bg-white`}
                >
                  <div
                    className={`h-16 w-16 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}
                  >
                    {DEPT_ICONS[dept.icon]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-gray-900 text-base leading-tight">
                        {dept.name}
                      </h3>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{dept.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-2xl bg-primary p-10 text-center text-white">
            <h3 className="text-2xl font-bold mb-2">Not sure where to start?</h3>
            <p className="text-white/80 mb-6">
              Walk in or book an appointment and our team will guide you to the right service.
            </p>
            <a
              href="/appointment"
              className="inline-block bg-white text-primary font-semibold px-8 py-3 rounded-full hover:bg-white/90 transition-colors"
            >
              Book an Appointment
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
