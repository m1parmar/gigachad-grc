import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/Button';
import { useToast } from '@/hooks/useToast';

interface AuditTemplate {
  id: string;
  name: string;
  description: string;
  auditType: string;
  framework: string;
  isSystem: boolean;
  usageCount: number;
  status: string;
  checklistItems: any[];
  requestTemplates: any[];
  createdAt: string;
}

const auditTypeLabels: Record<string, string> = {
  internal: 'Internal',
  external: 'External',
  surveillance: 'Surveillance',
  certification: 'Certification',
};

export default function AuditTemplates() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [selectedType, setSelectedType] = useState('');
  const [_showCreateModal, setShowCreateModal] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['audit-templates', selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType) params.set('auditType', selectedType);
      const res = await fetch(`/api/audit/templates?${params}`);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/audit/templates/${id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to clone template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] });
      toast.success('Template cloned successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/audit/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-templates'] });
      toast.success('Template archived');
    },
  });

  const handleClone = (template: AuditTemplate) => {
    const name = prompt('Enter name for the new template:', `${template.name} (Copy)`);
    if (name) {
      cloneMutation.mutate({ id: template.id, name });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Templates</h1>
          <p className="text-surface-400 mt-1">
            Reusable templates with checklists and request templates
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="bg-surface-800 border border-surface-600 rounded-lg px-3 py-2 text-white"
        >
          <option value="">All Types</option>
          {Object.entries(auditTypeLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-surface-800 rounded-lg p-6 h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(templates as AuditTemplate[]).map((template) => (
            <div
              key={template.id}
              className="bg-surface-800 rounded-lg p-6 border border-surface-700 hover:border-surface-500 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-500/10 rounded-lg">
                    <ClipboardDocumentListIcon className="h-6 w-6 text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    {template.isSystem && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                        System Template
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <p className="text-surface-400 text-sm mt-3 line-clamp-2">
                {template.description || 'No description'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="bg-surface-700 text-surface-300 px-2 py-1 rounded">
                  {auditTypeLabels[template.auditType] || template.auditType}
                </span>
                {template.framework && (
                  <span className="bg-surface-700 text-surface-300 px-2 py-1 rounded">
                    {template.framework}
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-surface-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <CheckCircleIcon className="h-4 w-4" />
                    {template.checklistItems?.length || 0} items
                  </span>
                  <span>{template.usageCount} uses</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-700 flex gap-2">
                <Link
                  to={`/audits/new?templateId=${template.id}`}
                  className="flex-1"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Use Template
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleClone(template)}
                  title="Clone Template"
                >
                  <DocumentDuplicateIcon className="h-4 w-4" />
                </Button>
                {!template.isSystem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteMutation.mutate(template.id)}
                    title="Archive Template"
                  >
                    <TrashIcon className="h-4 w-4 text-red-400" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && templates.length === 0 && (
        <div className="text-center py-12">
          <ClipboardDocumentListIcon className="h-12 w-12 text-surface-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white">No templates found</h3>
          <p className="text-surface-400 mt-2">
            Create a new template or check back later for system templates.
          </p>
        </div>
      )}
    </div>
  );
}

