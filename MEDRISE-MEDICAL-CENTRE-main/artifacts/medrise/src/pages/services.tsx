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
  ClipboardList,
} from 'lucide-react';
import React from 'react';
import { Helmet } from 'react-helmet-async';

import { Layout } from '@/components/layout/Layout';
import { DEPARTMENTS } from '@/lib/constants';

const DEPT_ICONS: Record<string, React.ReactNode> = {
  ClipboardList: <ClipboardList className="h-7 w-7" />,
  Stethoscope: <Stethoscope className="h-7 w-7" />,
  Heart: <Heart className="h-7 w-7" />,
  Scissors: <Scissors className="h-7 w-7" />,
  Activity: <Activity className="h-7 w-7" />,
  Baby: <Baby className="h-7 w-7" />,
  ScanLine: <ScanLine className="h-7 w-7" />,
  FlaskConical: <FlaskConical className="h-7 w-7" />,
  Pill: <Pill className="h-7 w-7" />,
  Smile: <Smile className="h-7 w-7" />,
  Mic2: <Mic2 className="h-7 w-7" />,
};

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  lime: {
    bg: 'bg-lime-50',
    text: 'text-lime-600',
    border: 'border-lime-100',
    badge: 'bg-lime-100 text-lime-700',
  },
  rose: {
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    border: 'border-rose-100',
    badge: 'bg-rose-100 text-rose-700',
  },
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-100',
    badge: 'bg-blue-100 text-blue-700',
  },
  pink: {
    bg: 'bg-pink-50',
    text: 'text-pink-600',
    border: 'border-pink-100',
    badge: 'bg-pink-100 text-pink-700',
  },
  red: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-100',
    badge: 'bg-red-100 text-red-700',
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-100',
    badge: 'bg-green-100 text-green-700',
  },
  yellow: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-600',
    border: 'border-yellow-100',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-100',
    badge: 'bg-purple-100 text-purple-700',
  },
  teal: {
    bg: 'bg-teal-50',
    text: 'text-teal-600',
    border: 'border-teal-100',
    badge: 'bg-teal-100 text-teal-700',
  },
  orange: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-100',
    badge: 'bg-orange-100 text-orange-700',
  },
  cyan: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    border: 'border-cyan-100',
    badge: 'bg-cyan-100 text-cyan-700',
  },
  indigo: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-100',
    badge: 'bg-indigo-100 text-indigo-700',
  },
};

export default function Services() {
  return (
    <Layout>
      <Helmet>
        <title>Our Services | MedRise Medical Centre</title>
        <meta name="description" content="MedRise Medical Centre offers comprehensive healthcare services including general medicine, maternity, laboratory, pharmacy, dental, and specialist care. Open 24/7 in Matugga, Wakiso District." />
        <link rel="canonical" href="https://medrise-medical-centre-medrise.vercel.app/services" />
        <meta property="og:title" content="Our Services | MedRise Medical Centre" />
        <meta property="og:description" content="Comprehensive healthcare services including general medicine, maternity, laboratory, pharmacy, dental, and specialist care." />
        <meta property="og:url" content="https://medrise-medical-centre-medrise.vercel.app/services" />
        <meta name="twitter:title" content="Our Services | MedRise Medical Centre" />
        <meta name="twitter:description" content="Comprehensive healthcare services including general medicine, maternity, laboratory, pharmacy, dental, and specialist care." />
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
