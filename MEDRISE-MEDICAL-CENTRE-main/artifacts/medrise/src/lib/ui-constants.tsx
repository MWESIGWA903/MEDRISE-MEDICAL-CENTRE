import React from 'react';
import {
  ClipboardList,
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

/**
 * Department Icons Mapping
 * Used across pages (home, services)
 */
export const DEPT_ICONS: Record<string, React.ReactNode> = {
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

/**
 * Large Icon Sizes (h-7 w-7 variant)
 * Used in services page for larger display
 */
export const DEPT_ICONS_LARGE: Record<string, React.ReactNode> = {
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

/**
 * Color Map for Department Cards
 * Used to provide consistent styling across pages
 */
export const COLOR_MAP: Record<string, { bg: string; text: string; border?: string; badge?: string }> = {
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
