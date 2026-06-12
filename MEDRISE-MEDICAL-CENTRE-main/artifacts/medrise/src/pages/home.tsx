import {
  ArrowRight,
  Clock,
  Shield,
  Award,
  Users,
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
import { Link } from 'wouter';

import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { DEPARTMENTS } from '@/lib/constants';

const DEPT_ICONS: Record<string, React.ReactNode> = {
  ClipboardList: <ClipboardList className="h-6 w-6" />,
  Stethoscope: <Stethoscope className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  Scissors: <Scissors className="h-6 w-6" />,
  Activity: <Activity className="h-6 w-6" />,
  Baby: <Baby className="h-6 w-6" />,
  ScanLine: <ScanLine className="h-6 w-6" />,
  FlaskConical: <FlaskConical className="h-6 w-6" />,
  Pill: <Pill className="h-6 w-6" />,
  Smile: <Smile className="h-6 w-6" />,
  Mic2: <Mic2 className="h-6 w-6" />,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  lime: { bg: 'bg-lime-50', text: 'text-lime-600' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600' },
  red: { bg: 'bg-red-50', text: 'text-red-600' },
  green: { bg: 'bg-green-50', text: 'text-green-600' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600' },
};

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center bg-gray-50 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero.jpg"
            alt="MedRise Medical Centre"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-primary/70 mix-blend-multiply"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl text-white">
            <span className="inline-block py-1 px-3 rounded-full bg-secondary text-white text-sm font-semibold mb-4">
              Wakiso District, Uganda
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Compassionate Care.
              <br />
              <span className="text-secondary">Better Health.</span>
              <br />
              Brighter Lives.
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white/90">
              Your trusted partner in healthcare. We provide professional, accessible, and
              affordable medical services with a focus on patient well-being.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/appointment">
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-white rounded-full px-8 h-12 text-base"
                >
                  Book an Appointment
                </Button>
              </Link>
              <Link href="/services">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 rounded-full px-8 h-12 text-base"
                >
                  Our Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">24/7 Service</h3>
                <p className="text-sm text-gray-500">Always here for you</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Shield className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Modern Equipment</h3>
                <p className="text-sm text-gray-500">Accurate diagnostics</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Experienced Doctors</h3>
                <p className="text-sm text-gray-500">Expert medical care</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Award className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Affordable Care</h3>
                <p className="text-sm text-gray-500">Quality within reach</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services (unified) */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-secondary mb-3">
              What We Offer
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-600">
              MEDRISE Medical Centre provides {DEPARTMENTS.length} professional healthcare services
              under one roof, staffed by trained specialists dedicated to your health.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DEPARTMENTS.map((dept) => {
              const colors = COLOR_MAP[dept.color] ?? COLOR_MAP.blue;
              return (
                <div
                  key={dept.id}
                  className="group flex flex-col items-center text-center p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 bg-white hover:-translate-y-1"
                >
                  <div
                    className={`h-14 w-14 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center mb-4`}
                  >
                    {DEPT_ICONS[dept.icon]}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {dept.description}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link href="/services">
              <Button className="rounded-full" variant="outline">
                View All Services <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
