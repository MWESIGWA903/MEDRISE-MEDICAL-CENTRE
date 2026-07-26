import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Clock,
  User,
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const BASE = ((import.meta.env.VITE_API_URL ?? import.meta.env.VITE_RENDER_URL ?? '') as string);
const TOKEN = () => localStorage.getItem('medrise_admin_token') ?? '';
const authHeaders = () => ({
  Authorization: `Bearer ${TOKEN()}`,
  'Content-Type': 'application/json',
});

// ── Types ──────────────────────────────────────────────────────────────────────

type DocumentVersion = {
  id: number;
  documentType: string;
  documentId: number;
  patientId: number;
  version: number;
  content: any;
  changeReason: string | null;
  createdById: number | null;
  createdByName: string | null;
  createdAt: string;
};

export default function DocumentVersionsTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchDocumentId, setSearchDocumentId] = useState('');
  const [searchPatientId, setSearchPatientId] = useState('');
  const [documentTypeFilter, setDocumentTypeFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion | null>(null);
  const [formData, setFormData] = useState({
    documentType: '',
    documentId: 0,
    patientId: 0,
    content: '',
    changeReason: '',
  });

  // Fetch document versions
  const { data: versions = [], isLoading, refetch } = useQuery<DocumentVersion[]>({
    queryKey: ['document-versions', searchDocumentId, searchPatientId, documentTypeFilter],
    queryFn: async () => {
      const url = new URL(`${BASE}/api/document-versions`);
      if (searchDocumentId) url.searchParams.set('documentId', searchDocumentId);
      if (searchPatientId) url.searchParams.set('patientId', searchPatientId);
      if (documentTypeFilter) url.searchParams.set('documentType', documentTypeFilter);
      const res = await fetch(url.toString(), { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch document versions');
      return res.json();
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(`${BASE}/api/document-versions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...data,
          content: JSON.parse(data.content),
        }),
      });
      if (!res.ok) throw new Error('Failed to create document version');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions'] });
      toast({ title: 'Success', description: 'Document version created' });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      documentType: '',
      documentId: 0,
      patientId: 0,
      content: '',
      changeReason: '',
    });
  };

  const handleViewVersion = (version: DocumentVersion) => {
    setSelectedVersion(version);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.documentId || !formData.patientId || !formData.documentType) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      JSON.parse(formData.content);
      createMutation.mutate(formData);
    } catch {
      toast({ title: 'Error', description: 'Invalid JSON content', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium">Document ID</label>
              <Input
                placeholder="Search by document ID..."
                value={searchDocumentId}
                onChange={(e) => setSearchDocumentId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Patient ID</label>
              <Input
                placeholder="Search by patient ID..."
                value={searchPatientId}
                onChange={(e) => setSearchPatientId(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Document Type</label>
              <Select
                value={documentTypeFilter}
                onValueChange={setDocumentTypeFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="lab_request">Lab Request</SelectItem>
                  <SelectItem value="imaging_request">Imaging Request</SelectItem>
                  <SelectItem value="theatre_booking">Theatre Booking</SelectItem>
                  <SelectItem value="admission">Admission</SelectItem>
                  <SelectItem value="nursing_note">Nursing Note</SelectItem>
                  <SelectItem value="progress_note">Progress Note</SelectItem>
                  <SelectItem value="discharge_form">Discharge Form</SelectItem>
                  <SelectItem value="death_notification">Death Notification</SelectItem>
                  <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                  <SelectItem value="sick_leave_form">Sick Leave Form</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <Button onClick={() => refetch()}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <FileText className="h-4 w-4 mr-2" />
              Create Version
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Document ID</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Change Reason</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No document versions found
                    </TableCell>
                  </TableRow>
                ) : (
                  versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <Badge variant="outline">v{version.version}</Badge>
                      </TableCell>
                      <TableCell className="capitalize">{version.documentType.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{version.documentId}</TableCell>
                      <TableCell>{version.patientId}</TableCell>
                      <TableCell className="max-w-xs truncate">{version.changeReason || '-'}</TableCell>
                      <TableCell>{version.createdByName || '-'}</TableCell>
                      <TableCell>{format(new Date(version.createdAt), 'PPP')}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => handleViewVersion(version)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVersion ? 'Document Version Details' : 'Create Document Version'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedVersion ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Version</label>
                  <div className="text-lg font-semibold">v{selectedVersion.version}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Document Type</label>
                  <div className="capitalize">{selectedVersion.documentType.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Document ID</label>
                  <div>{selectedVersion.documentId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Patient ID</label>
                  <div>{selectedVersion.patientId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Created By</label>
                  <div>{selectedVersion.createdByName || '-'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium">Created At</label>
                  <div>{format(new Date(selectedVersion.createdAt), 'PPP')}</div>
                </div>
              </div>
              {selectedVersion.changeReason && (
                <div>
                  <label className="text-sm font-medium">Change Reason</label>
                  <div className="p-3 bg-gray-50 rounded">{selectedVersion.changeReason}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Content (JSON)</label>
                <pre className="p-4 bg-gray-900 text-green-400 rounded overflow-auto max-h-96 text-sm">
                  {JSON.stringify(selectedVersion.content, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Document Type *</label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="lab_request">Lab Request</SelectItem>
                      <SelectItem value="imaging_request">Imaging Request</SelectItem>
                      <SelectItem value="theatre_booking">Theatre Booking</SelectItem>
                      <SelectItem value="admission">Admission</SelectItem>
                      <SelectItem value="nursing_note">Nursing Note</SelectItem>
                      <SelectItem value="progress_note">Progress Note</SelectItem>
                      <SelectItem value="discharge_form">Discharge Form</SelectItem>
                      <SelectItem value="death_notification">Death Notification</SelectItem>
                      <SelectItem value="medical_certificate">Medical Certificate</SelectItem>
                      <SelectItem value="sick_leave_form">Sick Leave Form</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Document ID *</label>
                  <Input
                    type="number"
                    value={formData.documentId || ''}
                    onChange={(e) => setFormData({ ...formData, documentId: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Patient ID *</label>
                  <Input
                    type="number"
                    value={formData.patientId || ''}
                    onChange={(e) => setFormData({ ...formData, patientId: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Change Reason</label>
                  <Input
                    value={formData.changeReason}
                    onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Content (JSON) *</label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={10}
                  placeholder='{"key": "value"}'
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Create Version
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
