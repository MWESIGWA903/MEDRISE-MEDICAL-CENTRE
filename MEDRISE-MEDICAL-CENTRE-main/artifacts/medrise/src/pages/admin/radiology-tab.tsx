import { useQueryClient } from '@tanstack/react-query';
import {
  useListImagingOrders,
  useCreateImagingOrder,
  useUpdateImagingOrder,
  useDeleteImagingOrder,
  useListPatients,
  getListImagingOrdersQueryKey,
} from '@workspace/api-client-react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Printer,
  ScanLine,
  Activity,
} from 'lucide-react';
import React, { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { printImagingReport } from '@/lib/print-utils';

const MODALITIES = [
  'X-Ray',
  'CT Scan',
  'MRI',
  'Ultrasound',
  'Mammography',
  'Fluoroscopy',
  'Echocardiography',
  'Doppler Ultrasound',
  'Bone Densitometry (DEXA)',
  'Nuclear Medicine Scan',
  'PET Scan',
  'Angiography',
];

const BODY_PARTS = [
  'Chest',
  'Abdomen',
  'Pelvis',
  'Head / Brain',
  'Neck',
  'Spine (Cervical)',
  'Spine (Thoracic)',
  'Spine (Lumbar)',
  'Shoulder',
  'Elbow',
  'Wrist / Hand',
  'Hip',
  'Knee',
  'Ankle / Foot',
  'Whole Abdomen & Pelvis',
  'Upper Limb',
  'Lower Limb',
  'Obstetric (Pregnancy)',
  'Renal / Urinary Tract',
  'Hepatobiliary',
];

const PRIORITY_COLORS: Record<string, string> = {
  routine: 'bg-gray-50 text-gray-600 border-gray-200',
  urgent: 'bg-orange-50 text-orange-700 border-orange-200',
  stat: 'bg-red-50 text-red-700 border-red-200',
};

const STATUS_COLORS: Record<string, string> = {
  requested: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'in-progress': 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_LABELS: Record<string, string> = {
  requested: 'Requested',
  'in-progress': 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

type FindingsDialogState = {
  orderId: number;
  modality: string;
  bodyPart: string | null | undefined;
  existingFindings: string | null | undefined;
  existingImpression: string | null | undefined;
};

export default function RadiologyTab({ adminId }: { adminId?: number }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [findingsDialog, setFindingsDialog] = useState<FindingsDialogState | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [expanded, setExpanded] = useState<number | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: orders = [], isLoading } = useListImagingOrders({} as any, { query: {} as any });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: patients = [] } = useListPatients(undefined, { query: {} as any });

  const createOrderMutation = useCreateImagingOrder();
  const updateOrderMutation = useUpdateImagingOrder();
  const deleteOrderMutation = useDeleteImagingOrder();

  const uniqueModalities = Array.from(new Set(orders.map((o) => o.modality))).sort();

  const filtered = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (modalityFilter !== 'all' && o.modality !== modalityFilter) return false;
    return true;
  });

  function handleAddOrder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const patientId = parseInt(String(fd.get('patientId')), 10);
    if (!patientId) {
      toast({ title: 'Select a patient', variant: 'destructive' });
      return;
    }
    const modality = String(fd.get('modality') || '');
    if (!modality) {
      toast({ title: 'Select a modality', variant: 'destructive' });
      return;
    }
    createOrderMutation.mutate(
      {
        data: {
          patientId,
          requestedBy: adminId,
          modality,
          bodyPart: String(fd.get('bodyPart') || '') || undefined,
          clinicalIndication: String(fd.get('clinicalIndication') || '') || undefined,
          priority: String(fd.get('priority') || 'routine') as 'routine' | 'urgent' | 'stat',
          notes: String(fd.get('notes') || '') || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Imaging order created' });
          setAddOpen(false);
          qc.invalidateQueries({ queryKey: getListImagingOrdersQueryKey() });
        },
        onError: () => toast({ title: 'Failed to create order', variant: 'destructive' }),
      },
    );
  }

  function handleMarkInProgress(orderId: number) {
    updateOrderMutation.mutate(
      { id: orderId, data: { status: 'in-progress' } },
      {
        onSuccess: () => {
          toast({ title: 'Marked as In Progress' });
          qc.invalidateQueries({ queryKey: getListImagingOrdersQueryKey() });
        },
        onError: () => toast({ title: 'Update failed', variant: 'destructive' }),
      },
    );
  }

  function handleSaveFindings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!findingsDialog) return;
    const fd = new FormData(e.currentTarget);
    updateOrderMutation.mutate(
      {
        id: findingsDialog.orderId,
        data: {
          status: 'completed',
          findings: String(fd.get('findings') || '') || undefined,
          impression: String(fd.get('impression') || '') || undefined,
          reportedBy: adminId,
        },
      },
      {
        onSuccess: () => {
          toast({ title: 'Findings saved — order completed' });
          setFindingsDialog(null);
          qc.invalidateQueries({ queryKey: getListImagingOrdersQueryKey() });
        },
        onError: () => toast({ title: 'Failed to save findings', variant: 'destructive' }),
      },
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Radiology & Imaging</h1>
          <p className="text-gray-500 text-sm">
            Manage imaging orders, record findings, and print reports.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-3 text-sm">
            <span className="flex items-center gap-1 text-yellow-700">
              <Clock className="h-3.5 w-3.5" />{' '}
              {orders.filter((o) => o.status === 'requested').length} pending
            </span>
            <span className="flex items-center gap-1 text-green-700">
              <CheckCircle2 className="h-3.5 w-3.5" />{' '}
              {orders.filter((o) => o.status === 'completed').length} done
            </span>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Imaging Order</DialogTitle>
                <DialogDescription className="sr-only">
                  Create a new radiology/imaging order for a patient.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddOrder} className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Patient *
                    </label>
                    <select
                      name="patientId"
                      required
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select patient...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.fullName} ({p.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Priority</label>
                    <select
                      name="priority"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="routine">Routine</option>
                      <option value="urgent">Urgent</option>
                      <option value="stat">STAT (Emergency)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Modality *
                    </label>
                    <select
                      name="modality"
                      required
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select modality...</option>
                      {MODALITIES.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Body Part / Region
                    </label>
                    <select
                      name="bodyPart"
                      className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">Select region...</option>
                      {BODY_PARTS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Clinical Indication
                  </label>
                  <Input name="clinicalIndication" placeholder="Reason / clinical history" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Additional Notes
                  </label>
                  <Textarea name="notes" rows={2} placeholder="Special instructions or remarks" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createOrderMutation.isPending}>
                    {createOrderMutation.isPending ? 'Ordering...' : 'Place Order'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'requested', 'in-progress', 'completed', 'cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === 'all' ? 'All' : (STATUS_LABELS[s] ?? s)}
            </button>
          ))}
        </div>
        {uniqueModalities.length > 0 && (
          <div className="flex gap-2 flex-wrap ml-2 border-l border-gray-200 pl-3">
            <button
              onClick={() => setModalityFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${modalityFilter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              All Modalities
            </button>
            {uniqueModalities.map((m) => (
              <button
                key={m}
                onClick={() => setModalityFilter(m)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${modalityFilter === m ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No imaging orders found</p>
          <p className="text-sm mt-1">Create a new order using the button above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => (
            <Card key={order.id} className="border border-gray-100">
              <CardContent className="p-0">
                <div className="flex items-start justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900">
                        {order.patientName ?? `Patient #${order.patientId}`}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${PRIORITY_COLORS[order.priority] ?? ''}`}
                      >
                        {order.priority.toUpperCase()}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${STATUS_COLORS[order.status] ?? ''}`}
                      >
                        {STATUS_LABELS[order.status] ?? order.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-gray-800">
                      {order.modality}
                      {order.bodyPart ? ` — ${order.bodyPart}` : ''}
                    </p>
                    {order.clinicalIndication && (
                      <p className="text-xs text-gray-500 mt-0.5">{order.clinicalIndication}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Requested: {new Date(order.requestedAt).toLocaleString()}
                      {order.requestedByName && ` · by ${order.requestedByName}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      className="text-gray-400 hover:text-gray-700"
                      onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                    >
                      {expanded === order.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {order.status === 'requested' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1"
                        onClick={() => handleMarkInProgress(order.id)}
                      >
                        <Activity className="h-3.5 w-3.5" /> Start
                      </Button>
                    )}
                    {(order.status === 'requested' || order.status === 'in-progress') && (
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1 bg-green-600 hover:bg-green-700"
                        onClick={() =>
                          setFindingsDialog({
                            orderId: order.id,
                            modality: order.modality,
                            bodyPart: order.bodyPart,
                            existingFindings: order.findings,
                            existingImpression: order.impression,
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Enter Findings
                      </Button>
                    )}
                    {order.status === 'completed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1 text-green-700 border-green-200 hover:bg-green-50"
                        onClick={() =>
                          setFindingsDialog({
                            orderId: order.id,
                            modality: order.modality,
                            bodyPart: order.bodyPart,
                            existingFindings: order.findings,
                            existingImpression: order.impression,
                          })
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Edit Findings
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete imaging order?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() =>
                              deleteOrderMutation.mutate(
                                { id: order.id },
                                {
                                  onSuccess: () => {
                                    toast({ title: 'Deleted' });
                                    qc.invalidateQueries({
                                      queryKey: getListImagingOrdersQueryKey(),
                                    });
                                  },
                                },
                              )
                            }
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {expanded === order.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    {order.status === 'completed' && (order.findings || order.impression) ? (
                      <>
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                          Report
                        </p>
                        {order.findings && (
                          <div className="bg-blue-50 rounded-lg p-3 text-sm mb-2">
                            <p className="text-xs text-gray-500 mb-1">Findings</p>
                            <p className="text-gray-800 whitespace-pre-wrap">{order.findings}</p>
                          </div>
                        )}
                        {order.impression && (
                          <div className="bg-green-50 rounded-lg p-3 text-sm mb-2">
                            <p className="text-xs text-gray-500 mb-1">Impression</p>
                            <p className="text-gray-800 whitespace-pre-wrap">{order.impression}</p>
                          </div>
                        )}
                        {order.reportedByName && (
                          <p className="text-xs text-gray-400 mb-2">
                            Reported by: {order.reportedByName}
                          </p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8 mt-1 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                          onClick={() =>
                            printImagingReport({
                              patientName: order.patientName ?? `Patient #${order.patientId}`,
                              patientDob: order.patientDob,
                              modality: order.modality,
                              bodyPart: order.bodyPart,
                              clinicalIndication: order.clinicalIndication,
                              requestedAt: String(order.requestedAt),
                              requestedTime: new Date(String(order.requestedAt)).toLocaleTimeString(
                                'en-UG',
                                { hour: '2-digit', minute: '2-digit' },
                              ),
                              completedAt: order.completedAt ?? undefined,
                              completedTime: order.completedAt
                                ? new Date(String(order.completedAt)).toLocaleTimeString('en-UG', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : undefined,
                              priority: order.priority,
                              findings: order.findings,
                              impression: order.impression,
                              requestedByName: order.requestedByName,
                              reportedByName: order.reportedByName,
                              notes: order.notes,
                            })
                          }
                        >
                          <Printer className="h-3.5 w-3.5" /> Print Imaging Report
                        </Button>
                      </>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        {order.status === 'completed'
                          ? 'No findings recorded.'
                          : 'Awaiting findings entry.'}
                      </p>
                    )}
                    {order.notes && (
                      <p className="text-xs text-gray-500 mt-2">
                        <span className="font-medium">Notes:</span> {order.notes}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Findings entry dialog */}
      {findingsDialog && (
        <Dialog open={!!findingsDialog} onOpenChange={() => setFindingsDialog(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {findingsDialog.modality}
                {findingsDialog.bodyPart ? ` — ${findingsDialog.bodyPart}` : ''} Report
              </DialogTitle>
              <DialogDescription className="sr-only">
                Enter imaging findings and impression for this order.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveFindings} className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Findings *</label>
                <Textarea
                  name="findings"
                  rows={5}
                  placeholder="Describe the imaging findings in detail..."
                  defaultValue={findingsDialog.existingFindings ?? ''}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Impression / Conclusion
                </label>
                <Textarea
                  name="impression"
                  rows={3}
                  placeholder="Radiologist's impression or conclusion..."
                  defaultValue={findingsDialog.existingImpression ?? ''}
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setFindingsDialog(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateOrderMutation.isPending}>
                  {updateOrderMutation.isPending ? 'Saving...' : 'Save & Complete'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
