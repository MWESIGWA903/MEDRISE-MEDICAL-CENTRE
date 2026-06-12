import { useQueryClient } from '@tanstack/react-query';
import {
  useGetReportsSummary,
  useListHmisTargets,
  useUpsertHmisTargets,
  getListHmisTargetsQueryKey,
} from '@workspace/api-client-react';
import {
  BarChart3,
  Users,
  Stethoscope,
  Calendar,
  FlaskConical,
  Pill,
  DollarSign,
  UserCheck,
  UserX,
  Printer,
  Settings2,
  Loader2,
  Save,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

const PIE_COLORS = ['#1a5276', '#2e86c1', '#a9cce3', '#d6eaf8', '#1a8a4c', '#e74c3c'];

type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

const ADMIN_ROLES = ['medical_director', 'owner', 'admin'];

const METRIC_CONFIG: { key: string; label: string; unit?: string }[] = [
  { key: 'new_patients', label: 'New Patient Registrations' },
  { key: 'outpatient_visits', label: 'Outpatient Visits / Consultations' },
  { key: 'revenue', label: 'Revenue Collected', unit: 'UGX' },
  { key: 'lab_tests', label: 'Lab Tests Completed' },
  { key: 'appointments_completed', label: 'Appointments Completed' },
  { key: 'pharmacy_dispensing', label: 'Pharmacy Dispensing' },
];

function getMonthsForYear(year: string): string[] {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`);
}

function getWeekStart(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + offset * 7);
  return d.toISOString().slice(0, 10);
}

function printReport(
  period: ReportPeriod,
  summary: Record<string, unknown> | null | undefined,
  periodLabel: string,
) {
  const today = new Date().toLocaleDateString('en-UG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const logoUrl = window.location.origin + '/images/medrise-logo.jpg';
  const rows = [
    ['New Patient Registrations', summary?.newPatients ?? 0],
    ['Total Patients on Record', summary?.totalPatients ?? 0],
    ['Total Consultations', summary?.totalConsultations ?? 0],
    ['Total Appointments', summary?.totalAppointments ?? 0],
    ['Appointments Completed', summary?.completedAppointments ?? 0],
    ['Lab Orders Placed', summary?.totalLabOrders ?? 0],
    ['Lab Orders Completed', summary?.completedLabOrders ?? 0],
    [
      'Revenue Collected (UGX)',
      `UGX ${parseFloat(String(summary?.totalRevenue ?? '0')).toLocaleString()}`,
    ],
    ['Staff Attendance Records', summary?.staffPresent ?? 0],
    ['Staff Absence Records', summary?.staffAbsent ?? 0],
    ['Drugs Low on Stock', summary?.lowStockDrugs ?? 0],
  ];

  const html = `<html><head><title>MedRise Report</title>
  <style>
    *{box-sizing:border-box;}
    body{font-family:Arial,sans-serif;padding:28px;color:#222;font-size:13px;margin:0;position:relative;}
    body::before{content:'';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
      width:300px;height:300px;background-image:url('${logoUrl}');
      background-size:contain;background-repeat:no-repeat;background-position:center;
      opacity:0.05;pointer-events:none;z-index:-1;}
    .doc-header{text-align:center;border-bottom:3px solid #003087;padding-bottom:14px;margin-bottom:18px;}
    .doc-header img{height:65px;object-fit:contain;display:block;margin:0 auto 8px;}
    .doc-header h1{color:#003087;margin:0;font-size:20px;font-weight:900;letter-spacing:1px;}
    .doc-header p{margin:3px 0;color:#555;font-size:11px;}
    .green-bar{height:4px;background:linear-gradient(90deg,#1a8a4c,#003087);border-radius:2px;margin-top:10px;}
    .doc-title{font-size:17px;font-weight:bold;text-align:center;color:#003087;margin:0 0 16px;text-transform:uppercase;letter-spacing:.5px;}
    .meta{display:flex;justify-content:space-between;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 16px;margin-bottom:20px;font-size:12px;}
    table{width:100%;border-collapse:collapse;margin-bottom:24px;}
    thead th{background:linear-gradient(90deg,#003087,#1a8a4c);color:#fff;padding:9px 12px;font-size:12px;text-align:left;}
    tbody td{padding:8px 12px;border-bottom:1px solid #f0f0f0;}
    tbody tr:nth-child(even){background:#f0fdf4;}
    .highlight{font-weight:700;color:#003087;}
    .sig-row{display:flex;justify-content:space-between;margin-top:48px;gap:16px;}
    .sig-box{text-align:center;flex:1;}
    .sig-line{border-top:1.5px solid #003087;margin-top:48px;padding-top:6px;font-size:11px;color:#333;}
    .doc-footer{text-align:center;color:#aaa;font-size:10px;margin-top:24px;border-top:1px solid #eee;padding-top:12px;}
    @media print{body{padding:20px;} @page{margin:1.5cm;}}
  </style></head><body>
  <div class="doc-header">
    <img src="${logoUrl}" alt="MedRise" onerror="this.style.display='none'" />
    <h1>MEDRISE MEDICAL CENTRE</h1>
    <p>Lwadda A, Matugga, Gombe Division, Wakiso District, Uganda</p>
    <p>Tel: +256 770 775268 / +256 751 527730 | medrisemedicalcentre@gmail.com</p>
    <div class="green-bar"></div>
  </div>
  <p class="doc-title">Facility Performance Report — ${period}</p>
  <div class="meta">
    <span><strong>Reporting Period:</strong> ${periodLabel}</span>
    <span><strong>Generated:</strong> ${today}</span>
    <span><strong>Report By:</strong> MedRise System</span>
  </div>
  <table>
    <thead><tr><th>Performance Indicator</th><th>Value</th></tr></thead>
    <tbody>
      ${rows.map(([ind, val]) => `<tr><td>${ind}</td><td class="highlight">${val}</td></tr>`).join('')}
    </tbody>
  </table>
  <div class="sig-row">
    <div class="sig-box"><div class="sig-line">Prepared By</div></div>
    <div class="sig-box"><div class="sig-line">Medical Director<br/><small>Signature &amp; Stamp</small></div></div>
    <div class="sig-box"><div class="sig-line">Date</div></div>
  </div>
  <div class="doc-footer">MedRise Medical Centre &copy; ${new Date().getFullYear()} &nbsp;|&nbsp; Auto-generated ${period} report &nbsp;|&nbsp; Printed: ${today}</div>
  </body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  }
}

function SetTargetsDialog({
  open,
  onOpenChange,
  period,
  targets,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  period: ReportPeriod;
  targets: Array<{ metricKey: string; periodType: string; targetValue: number }>;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutate: upsert, isPending } = useUpsertHmisTargets();

  const getTarget = (key: string) =>
    targets.find((t) => t.metricKey === key && t.periodType === period)?.targetValue ?? 0;

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(METRIC_CONFIG.map((m) => [m.key, String(getTarget(m.key))])),
  );

  useEffect(() => {
    if (open) {
      setValues(Object.fromEntries(METRIC_CONFIG.map((m) => [m.key, String(getTarget(m.key))])));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, period, targets]);

  const handleSave = () => {
    const payload = METRIC_CONFIG.map((m) => ({
      metricKey: m.key,
      periodType: period,
      targetValue: Math.max(0, parseInt(values[m.key] ?? '0', 10) || 0),
    }));
    upsert(
      { data: { targets: payload } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListHmisTargetsQueryKey() });
          toast({
            title: 'Targets saved',
            description: `${period.charAt(0).toUpperCase() + period.slice(1)} targets updated successfully.`,
          });
          onOpenChange(false);
        },
        onError: () => {
          toast({
            title: 'Error',
            description: 'Failed to save targets. Please try again.',
            variant: 'destructive',
          });
        },
      },
    );
  };

  const PERIOD_LABELS: Record<ReportPeriod, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    yearly: 'Yearly',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            Set {PERIOD_LABELS[period]} Targets
          </DialogTitle>
          <DialogDescription>
            Configure performance targets for the{' '}
            <strong>{PERIOD_LABELS[period].toLowerCase()}</strong> reporting period. These targets
            appear in the Summary Report Table.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {METRIC_CONFIG.map((m) => (
            <div key={m.key} className="space-y-1.5">
              <Label htmlFor={`target-${m.key}`} className="text-sm font-medium text-gray-700">
                {m.label}
                {m.unit && (
                  <span className="ml-1 text-gray-400 font-normal text-xs">({m.unit})</span>
                )}
              </Label>
              <Input
                id={`target-${m.key}`}
                type="number"
                min={0}
                value={values[m.key] ?? '0'}
                onChange={(e) => setValues((prev) => ({ ...prev, [m.key]: e.target.value }))}
                className="w-full"
                placeholder="0"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Targets
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ReportsTab() {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [targetsDialogOpen, setTargetsDialogOpen] = useState(false);

  const { adminUser } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(adminUser?.role ?? '');

  const _yearMonths = getMonthsForYear(year);
  const _weekStart = getWeekStart(0);

  const reportingMonth = period === 'yearly' ? `${year}-01` : period === 'daily' ? month : month;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: summary, isLoading } = useGetReportsSummary({ month: reportingMonth } as any, {
    query: {} as any,
  });

  const { data: targetsData, isLoading: targetsLoading } = useListHmisTargets();
  const targets = targetsData ?? [];

  const getTarget = (key: string): number | null => {
    const t = targets.find((t) => t.metricKey === key && t.periodType === period);
    return t ? t.targetValue : null;
  };

  const stats = [
    {
      label: 'Total Patients',
      value: summary?.totalPatients ?? 0,
      sub: `+${summary?.newPatients ?? 0} new this month`,
      icon: Users,
      color: 'bg-blue-50 text-blue-700',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Consultations',
      value: summary?.totalConsultations ?? 0,
      sub: 'This month',
      icon: Stethoscope,
      color: 'bg-teal-50 text-teal-700',
      iconBg: 'bg-teal-100',
    },
    {
      label: 'Appointments',
      value: summary?.totalAppointments ?? 0,
      sub: `${summary?.completedAppointments ?? 0} completed`,
      icon: Calendar,
      color: 'bg-purple-50 text-purple-700',
      iconBg: 'bg-purple-100',
    },
    {
      label: 'Revenue',
      value: `UGX ${parseFloat(summary?.totalRevenue ?? '0').toLocaleString()}`,
      sub: 'Collected this month',
      icon: DollarSign,
      color: 'bg-green-50 text-green-700',
      iconBg: 'bg-green-100',
    },
    {
      label: 'Lab Tests',
      value: summary?.totalLabOrders ?? 0,
      sub: `${summary?.completedLabOrders ?? 0} completed`,
      icon: FlaskConical,
      color: 'bg-orange-50 text-orange-700',
      iconBg: 'bg-orange-100',
    },
    {
      label: 'Low Stock Drugs',
      value: summary?.lowStockDrugs ?? 0,
      sub: 'Need restocking',
      icon: Pill,
      color: 'bg-red-50 text-red-700',
      iconBg: 'bg-red-100',
    },
    {
      label: 'Staff Present',
      value: summary?.staffPresent ?? 0,
      sub: 'Attendance records this month',
      icon: UserCheck,
      color: 'bg-emerald-50 text-emerald-700',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Staff Absent',
      value: summary?.staffAbsent ?? 0,
      sub: 'Absences this month',
      icon: UserX,
      color: 'bg-rose-50 text-rose-700',
      iconBg: 'bg-rose-100',
    },
  ];

  const apptRate =
    summary && summary.totalAppointments > 0
      ? Math.round((summary.completedAppointments / summary.totalAppointments) * 100)
      : 0;
  const labRate =
    summary && summary.totalLabOrders > 0
      ? Math.round((summary.completedLabOrders / summary.totalLabOrders) * 100)
      : 0;

  const barData = [
    { name: 'Patients', total: summary?.totalPatients ?? 0, new: summary?.newPatients ?? 0 },
    { name: 'Consultations', total: summary?.totalConsultations ?? 0, new: 0 },
    {
      name: 'Appointments',
      total: summary?.totalAppointments ?? 0,
      new: summary?.completedAppointments ?? 0,
    },
    {
      name: 'Lab Orders',
      total: summary?.totalLabOrders ?? 0,
      new: summary?.completedLabOrders ?? 0,
    },
  ];

  const apptPieData = [
    { name: 'Completed', value: summary?.completedAppointments ?? 0 },
    {
      name: 'Remaining',
      value: Math.max(0, (summary?.totalAppointments ?? 0) - (summary?.completedAppointments ?? 0)),
    },
  ];

  const labPieData = [
    { name: 'Completed', value: summary?.completedLabOrders ?? 0 },
    {
      name: 'Pending',
      value: Math.max(0, (summary?.totalLabOrders ?? 0) - (summary?.completedLabOrders ?? 0)),
    },
  ];

  const attendancePieData = [
    { name: 'Present', value: summary?.staffPresent ?? 0 },
    { name: 'Absent', value: summary?.staffAbsent ?? 0 },
  ];

  const PERIODS: { id: ReportPeriod; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'yearly', label: 'Yearly' },
  ];

  const periodLabel =
    period === 'daily'
      ? new Date().toLocaleDateString('en-UG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : period === 'weekly'
        ? `Week of ${new Date(_weekStart).toLocaleDateString('en-UG', { month: 'short', day: 'numeric' })}`
        : period === 'yearly'
          ? `Year ${year}`
          : new Date(`${month}-01`).toLocaleDateString('en-UG', { month: 'long', year: 'numeric' });

  const newPatientsTarget = getTarget('new_patients');
  const consultationsTarget = getTarget('outpatient_visits');
  const revenueTarget = getTarget('revenue');
  const labTestsTarget = getTarget('lab_tests');
  const appointmentsCompletedTarget = getTarget('appointments_completed');

  const summaryRows = [
    {
      indicator: 'New Patient Registrations',
      value: summary?.newPatients ?? 0,
      target: newPatientsTarget,
      isRevenue: false,
    },
    {
      indicator: 'Total Consultations',
      value: summary?.totalConsultations ?? 0,
      target: consultationsTarget,
      isRevenue: false,
    },
    {
      indicator: 'Appointments Completed',
      value: summary?.completedAppointments ?? 0,
      target:
        appointmentsCompletedTarget ??
        ((summary?.totalAppointments ?? 0) > 0 ? (summary?.totalAppointments ?? 0) : null),
      isRevenue: false,
    },
    {
      indicator: 'Lab Tests Completed',
      value: summary?.completedLabOrders ?? 0,
      target: labTestsTarget,
      isRevenue: false,
    },
    {
      indicator: 'Revenue Collected (UGX)',
      value: parseFloat(summary?.totalRevenue ?? '0').toLocaleString(),
      target: revenueTarget,
      isRevenue: true,
      numericValue: parseFloat(summary?.totalRevenue ?? '0'),
    },
    {
      indicator: 'Pharmacy Dispensing',
      value: '—',
      target: getTarget('pharmacy_dispensing'),
      isRevenue: false,
      notTracked: true,
    },
  ];

  return (
    <div>
      {/* Set Targets Dialog */}
      <SetTargetsDialog
        open={targetsDialogOpen}
        onOpenChange={setTargetsDialogOpen}
        period={period}
        targets={targets.map((t) => ({
          metricKey: t.metricKey,
          periodType: t.periodType,
          targetValue: t.targetValue,
        }))}
      />

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">HMIS Reports & Analytics</h1>
            <p className="text-gray-500 text-sm">
              Auto-generated facility performance reports — daily, weekly, monthly, and yearly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button
                variant="outline"
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => setTargetsDialogOpen(true)}
                disabled={targetsLoading}
              >
                {targetsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Settings2 className="h-4 w-4" />
                )}
                Set Targets
              </Button>
            )}
            <Button
              variant="outline"
              className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-white"
              onClick={() =>
                printReport(period, summary as Record<string, unknown> | undefined, periodLabel)
              }
              disabled={isLoading}
            >
              <Printer className="h-4 w-4" /> Print{' '}
              {period.charAt(0).toUpperCase() + period.slice(1)} Report
            </Button>
          </div>
        </div>

        {/* Period selector tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                period === p.id
                  ? 'bg-white text-primary shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Period-specific date controls */}
        <div className="flex items-center gap-3 mt-3">
          {(period === 'monthly' || period === 'daily' || period === 'weekly') && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                {period === 'monthly' ? 'Reporting Month' : 'Reference Month'}
              </label>
              <Input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-44"
              />
            </div>
          )}
          {period === 'yearly' && (
            <div>
              <label className="text-xs text-gray-500 block mb-1">Year</label>
              <Input
                type="number"
                min={2020}
                max={2040}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-28"
              />
            </div>
          )}
          <Badge variant="outline" className="self-end mb-0.5 text-xs text-gray-500">
            {periodLabel}
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30 animate-pulse" />
          <p>Generating {period} report...</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 mb-6 flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold text-gray-900">
                MEDRISE MEDICAL CENTRE — {period.toUpperCase()} HMIS Report
              </p>
              <p className="text-sm text-gray-600">Period: {periodLabel}</p>
            </div>
            <Badge variant="outline" className="ml-auto bg-white">
              HMIS
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((s) => (
              <Card key={s.label} className={`border-0 ${s.color}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-xs font-medium opacity-80">{s.label}</p>
                    <div className={`p-1.5 rounded-lg ${s.iconBg}`}>
                      <s.icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs opacity-70 mt-0.5">{s.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Bar Chart — Activity Overview */}
          <Card className="border border-gray-100 mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-800">
                Activity Overview
              </CardTitle>
              <p className="text-xs text-gray-400">
                Key metrics for{' '}
                {new Date(`${month}-01`).toLocaleDateString('en-UG', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value: number, name: string) => [
                      value,
                      name === 'new' ? 'Completed / New' : 'Total',
                    ]}
                  />
                  <Bar dataKey="total" name="total" fill="#1a5276" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="new" name="new" fill="#a9cce3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Charts Row */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              { title: 'Appointment Completion', data: apptPieData, rate: apptRate },
              { title: 'Lab Test Completion', data: labPieData, rate: labRate },
              {
                title: 'Staff Attendance',
                data: attendancePieData,
                rate:
                  summary && (summary.staffPresent ?? 0) + (summary.staffAbsent ?? 0) > 0
                    ? Math.round(
                        ((summary.staffPresent ?? 0) /
                          ((summary.staffPresent ?? 0) + (summary.staffAbsent ?? 0))) *
                          100,
                      )
                    : 0,
              },
            ].map(({ title, data, rate }) => (
              <Card key={title} className="border border-gray-100">
                <CardHeader className="pb-1">
                  <CardTitle className="text-sm font-semibold text-gray-800">{title}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  <div className="relative">
                    <PieChart width={140} height={140}>
                      <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {data.map((_, i) => (
                          <Cell key={i} fill={[PIE_COLORS[0], PIE_COLORS[2]][i]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                    </PieChart>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-2xl font-bold text-gray-900">{rate}%</span>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-1">
                    {data.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span
                          className="h-2.5 w-2.5 rounded-full inline-block"
                          style={{ background: [PIE_COLORS[0], PIE_COLORS[2]][i] }}
                        />
                        {d.name}: <strong>{d.value}</strong>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Performance indicators — progress bars */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Appointment Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 mb-2">
                  <p className="text-3xl font-bold text-gray-900">{apptRate}%</p>
                  <p className="text-sm text-gray-500 pb-1">
                    {summary?.completedAppointments ?? 0} of {summary?.totalAppointments ?? 0}
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-primary h-3 rounded-full transition-all"
                    style={{ width: `${apptRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Lab Test Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-3 mb-2">
                  <p className="text-3xl font-bold text-gray-900">{labRate}%</p>
                  <p className="text-sm text-gray-500 pb-1">
                    {summary?.completedLabOrders ?? 0} of {summary?.totalLabOrders ?? 0}
                  </p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className="bg-orange-500 h-3 rounded-full transition-all"
                    style={{ width: `${labRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* New Patients vs Target progress bar — if target is set */}
            {newPatientsTarget !== null && newPatientsTarget > 0 && (
              <Card className="border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    New Patient Registrations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 mb-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(
                        Math.min(((summary?.newPatients ?? 0) / newPatientsTarget) * 100, 100),
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-500 pb-1">
                      {summary?.newPatients ?? 0} of {newPatientsTarget} target
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-blue-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(((summary?.newPatients ?? 0) / newPatientsTarget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consultations vs Target progress bar — if target is set */}
            {consultationsTarget !== null && consultationsTarget > 0 && (
              <Card className="border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Outpatient Consultations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 mb-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(
                        Math.min(
                          ((summary?.totalConsultations ?? 0) / consultationsTarget) * 100,
                          100,
                        ),
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-500 pb-1">
                      {summary?.totalConsultations ?? 0} of {consultationsTarget} target
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-teal-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(((summary?.totalConsultations ?? 0) / consultationsTarget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Revenue vs Target progress bar — if target is set */}
            {revenueTarget !== null && revenueTarget > 0 && (
              <Card className="border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Revenue Collection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 mb-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(
                        Math.min(
                          (parseFloat(summary?.totalRevenue ?? '0') / revenueTarget) * 100,
                          100,
                        ),
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-500 pb-1">
                      UGX {parseFloat(summary?.totalRevenue ?? '0').toLocaleString()} of{' '}
                      {revenueTarget.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min((parseFloat(summary?.totalRevenue ?? '0') / revenueTarget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Lab tests completed vs Target progress bar — if target is set */}
            {labTestsTarget !== null && labTestsTarget > 0 && (
              <Card className="border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Lab Tests Completed vs Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 mb-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(
                        Math.min(((summary?.completedLabOrders ?? 0) / labTestsTarget) * 100, 100),
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-500 pb-1">
                      {summary?.completedLabOrders ?? 0} of {labTestsTarget} target
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-orange-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(((summary?.completedLabOrders ?? 0) / labTestsTarget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Appointments completed vs Target progress bar — if admin target is set */}
            {appointmentsCompletedTarget !== null && appointmentsCompletedTarget > 0 && (
              <Card className="border border-gray-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800">
                    Appointments Completed vs Target
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3 mb-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {Math.round(
                        Math.min(
                          ((summary?.completedAppointments ?? 0) / appointmentsCompletedTarget) *
                            100,
                          100,
                        ),
                      )}
                      %
                    </p>
                    <p className="text-sm text-gray-500 pb-1">
                      {summary?.completedAppointments ?? 0} of {appointmentsCompletedTarget} target
                    </p>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-purple-500 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(((summary?.completedAppointments ?? 0) / appointmentsCompletedTarget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Summary table */}
          <Card className="border border-gray-100">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-gray-800">
                  Summary Report Table
                </CardTitle>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500 hover:text-primary flex items-center gap-1.5 h-7"
                    onClick={() => setTargetsDialogOpen(true)}
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    {targetsLoading ? 'Loading targets...' : 'Edit targets'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-y border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Indicator</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Value</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Target</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {summaryRows.map((row) => {
                    const isNotTracked = !!(row as { notTracked?: boolean }).notTracked;
                    const numericValue = isNotTracked
                      ? null
                      : row.isRevenue
                        ? ((row as { numericValue?: number }).numericValue ?? 0)
                        : Number(row.value);
                    const pct =
                      !isNotTracked && numericValue !== null && row.target && row.target > 0
                        ? (numericValue / row.target) * 100
                        : null;
                    return (
                      <tr key={row.indicator}>
                        <td className="px-4 py-3 text-gray-700">
                          {row.indicator}
                          {isNotTracked && (
                            <span className="ml-2 text-xs text-gray-400">(target only)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {row.value}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {targetsLoading ? (
                            <span className="inline-block h-4 w-12 bg-gray-100 animate-pulse rounded" />
                          ) : row.target !== null && row.target !== undefined && row.target > 0 ? (
                            row.isRevenue ? (
                              row.target.toLocaleString()
                            ) : (
                              row.target
                            )
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {pct !== null ? (
                            <Badge
                              variant="outline"
                              className={`text-xs ${pct >= 80 ? 'bg-green-50 text-green-700' : pct >= 50 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}
                            >
                              {Math.round(pct)}%
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
