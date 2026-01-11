import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    PlusIcon,
    PaperClipIcon,
    ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/Button';
import toast from 'react-hot-toast';

interface AuditRequest {
    id: string;
    requestNumber: string;
    auditId: string;
    category: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    dueDate?: string;
    assignedTo?: string;
    instructions?: string;
    audit?: {
        id: string;
        auditId: string;
        name: string;
    };
    createdAt: string;
    updatedAt: string;
}

interface Audit {
    id: string;
    auditId: string;
    name: string;
}

const statusOptions = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'under_review', label: 'Under Review' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'clarification_needed', label: 'Clarification Needed' },
];

const priorityOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
];

const categoryOptions = [
    { value: 'control_documentation', label: 'Control Documentation' },
    { value: 'policy', label: 'Policy' },
    { value: 'evidence', label: 'Evidence' },
    { value: 'interview', label: 'Interview' },
    { value: 'access', label: 'Access' },
    { value: 'walkthrough', label: 'Walkthrough' },
];

export default function AuditRequestDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [audits, setAudits] = useState<Audit[]>([]);
    const [formData, setFormData] = useState<Partial<AuditRequest>>({
        title: '',
        description: '',
        category: 'evidence',
        status: 'open',
        priority: 'medium',
        auditId: '',
        dueDate: '',
        instructions: '',
        assignedTo: '',
    });

    useEffect(() => {
        fetchAudits();
        if (!isNew) {
            fetchRequest();
        }
    }, [id, isNew]);

    const fetchAudits = async () => {
        try {
            const response = await fetch('/api/audits', {
                headers: {
                    'x-organization-id': 'default-org',
                    'x-user-id': 'system',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setAudits(Array.isArray(data) ? data : data.data || []);
            }
        } catch (error) {
            console.error('Error fetching audits:', error);
        }
    };

    const fetchRequest = async () => {
        try {
            const response = await fetch(`/api/audit-requests/${id}`, {
                headers: {
                    'x-organization-id': 'default-org',
                    'x-user-id': 'system',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    category: data.category || 'evidence',
                    status: data.status || 'open',
                    priority: data.priority || 'medium',
                    auditId: data.auditId || '',
                    dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
                    instructions: data.instructions || '',
                    assignedTo: data.assignedTo || '',
                });
            } else {
                toast.error('Failed to load audit request');
                navigate('/audit-requests');
            }
        } catch (error) {
            console.error('Error fetching request:', error);
            toast.error('Failed to load audit request');
            navigate('/audit-requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title?.trim()) {
            toast.error('Title is required');
            return;
        }

        if (!formData.auditId) {
            toast.error('Please select an audit');
            return;
        }

        setSaving(true);
        try {
            const url = isNew ? '/api/audit-requests' : `/api/audit-requests/${id}`;
            const method = isNew ? 'POST' : 'PATCH';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-organization-id': 'default-org',
                    'x-user-id': 'system',
                },
                body: JSON.stringify({
                    ...formData,
                    dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
                }),
            });

            if (response.ok) {
                toast.success(isNew ? 'Audit request created' : 'Audit request updated');
                navigate('/audit-requests');
            } else {
                const error = await response.json();
                toast.error(error.message || 'Failed to save audit request');
            }
        } catch (error) {
            console.error('Error saving request:', error);
            toast.error('Failed to save audit request');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/audit-requests')}
                >
                    <ArrowLeftIcon className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-semibold text-surface-100">
                        {isNew ? 'New Audit Request' : 'Edit Audit Request'}
                    </h1>
                    <p className="text-surface-400 mt-1">
                        {isNew ? 'Create a new audit request for evidence or documentation' : 'Update audit request details'}
                    </p>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-surface-800 border border-surface-700 rounded-lg p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            placeholder="Enter request title"
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Audit */}
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Audit <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={formData.auditId}
                            onChange={(e) => handleChange('auditId', e.target.value)}
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">Select an audit</option>
                            {audits.map((audit) => (
                                <option key={audit.id} value={audit.id}>
                                    {audit.name} ({audit.auditId})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Category
                        </label>
                        <select
                            value={formData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {categoryOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {statusOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Priority
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => handleChange('priority', e.target.value)}
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                            {priorityOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Due Date
                        </label>
                        <input
                            type="date"
                            value={formData.dueDate}
                            onChange={(e) => handleChange('dueDate', e.target.value)}
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Assigned To */}
                    <div>
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Assigned To
                        </label>
                        <input
                            type="text"
                            value={formData.assignedTo}
                            onChange={(e) => handleChange('assignedTo', e.target.value)}
                            placeholder="Enter assignee email or name"
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            rows={3}
                            placeholder="Describe the request..."
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>

                    {/* Instructions */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-surface-300 mb-2">
                            Instructions
                        </label>
                        <textarea
                            value={formData.instructions}
                            onChange={(e) => handleChange('instructions', e.target.value)}
                            rows={3}
                            placeholder="Provide instructions for the person responding to this request..."
                            className="w-full px-4 py-2 bg-surface-900 border border-surface-700 rounded-lg text-surface-100 placeholder-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t border-surface-700">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => navigate('/audit-requests')}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" loading={saving}>
                        {isNew ? 'Create Request' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
