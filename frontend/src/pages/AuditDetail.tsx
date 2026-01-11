import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditsApi, frameworksApi } from '@/lib/api';
import { cleanFormData } from '@/lib/formUtils';
import { Button } from '@/components/Button';
import { FormField, Input, Select, Textarea, FormSection, FormActions } from '@/components/Form';
import toast from 'react-hot-toast';
// Removed unused lucide-react import
import { ArrowLeftIcon as HeroArrowLeft } from '@heroicons/react/24/outline'; // Fallback to heroicons

const AuditDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isNew = id === 'new';

    const [formData, setFormData] = useState({
        name: '',
        auditId: '', // e.g. AUD-001
        description: '',
        auditType: 'internal',
        framework: '',
        status: 'planning',
        plannedStartDate: '',
        plannedEndDate: '',
        isExternal: false,
    });

    // Fetch Audit if not new
    const { data: audit, isLoading: isLoadingAudit } = useQuery({
        queryKey: ['audit', id],
        queryFn: () => auditsApi.get(id!).then(res => res.data),
        enabled: !!id && !isNew,
    });

    // Fetch Frameworks for dropdown
    const { data: frameworks = [] } = useQuery({
        queryKey: ['frameworks'],
        queryFn: () => frameworksApi.list().then(res => res.data),
    });

    // Populate form on load
    useEffect(() => {
        if (audit) {
            setFormData({
                name: audit.name || '',
                auditId: audit.auditId || '',
                description: (audit as any).description || '', // Cast in case generic Audit type misses it
                auditType: audit.auditType || 'internal',
                framework: audit.framework || '',
                status: audit.status || 'planning',
                plannedStartDate: audit.plannedStartDate ? audit.plannedStartDate.split('T')[0] : '',
                plannedEndDate: audit.plannedEndDate ? audit.plannedEndDate.split('T')[0] : '',
                isExternal: audit.isExternal || false,
            });
        }
    }, [audit]);

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            // Ensure auditId is present if required, or let backend handle?
            // Assuming backend needs it if it's in the form.
            return auditsApi.create(cleanFormData(data));
        },
        onSuccess: () => {
            toast.success('Audit created successfully');
            queryClient.invalidateQueries({ queryKey: ['audits'] });
            navigate('/audits');
        },
        onError: (err: any) => {
            toast.error('Failed to create audit: ' + (err.response?.data?.message || err.message));
        }
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            return auditsApi.update(id!, cleanFormData(data));
        },
        onSuccess: () => {
            toast.success('Audit updated successfully');
            queryClient.invalidateQueries({ queryKey: ['audits'] });
            queryClient.invalidateQueries({ queryKey: ['audit', id] });
        },
        onError: (err: any) => {
            toast.error('Failed to update audit: ' + (err.response?.data?.message || err.message));
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isNew) {
            createMutation.mutate(formData);
        } else {
            updateMutation.mutate(formData);
        }
    };

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (isLoadingAudit) {
        return <div className="p-8 flex justify-center">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/audits')}>
                    <HeroArrowLeft className="w-5 h-5 mr-2" />
                    Back to Audits
                </Button>
                <h1 className="text-2xl font-bold text-surface-100">
                    {isNew ? 'Create New Audit' : 'Edit Audit'}
                </h1>
            </div>

            <div className="bg-surface-800 border border-surface-700 rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormSection title="General Information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Audit Name" required>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    placeholder="e.g. Q1 Internal Audit"
                                    required
                                />
                            </FormField>

                            <FormField label="Audit ID" required>
                                <Input
                                    value={formData.auditId}
                                    onChange={(e) => handleChange('auditId', e.target.value)}
                                    placeholder="e.g. AUD-2024-001"
                                    required
                                />
                            </FormField>

                            <FormField label="Audit Type">
                                <Select
                                    value={formData.auditType}
                                    onChange={(e) => handleChange('auditType', e.target.value)}
                                >
                                    <option value="internal">Internal</option>
                                    <option value="external">External</option>
                                    <option value="surveillance">Surveillance</option>
                                    <option value="certification">Certification</option>
                                </Select>
                            </FormField>

                            <FormField label="Status">
                                <Select
                                    value={formData.status}
                                    onChange={(e) => handleChange('status', e.target.value)}
                                >
                                    <option value="planning">Planning</option>
                                    <option value="fieldwork">Fieldwork</option>
                                    <option value="testing">Testing</option>
                                    <option value="reporting">Reporting</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </Select>
                            </FormField>

                            <FormField label="Framework">
                                <Select
                                    value={formData.framework}
                                    onChange={(e) => handleChange('framework', e.target.value)}
                                    placeholder="Select a framework"
                                >
                                    <option value="">None</option>
                                    {frameworks.map((fw: any) => (
                                        <option key={fw.id} value={fw.name}>{fw.name}</option>
                                    ))}
                                </Select>
                            </FormField>

                            <FormField label="External Audit?">
                                <Select
                                    value={formData.isExternal ? 'yes' : 'no'}
                                    onChange={(e) => handleChange('isExternal', e.target.value === 'yes')}
                                >
                                    <option value="no">No</option>
                                    <option value="yes">Yes</option>
                                </Select>
                            </FormField>
                        </div>

                        <FormField label="Description">
                            <Textarea
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                rows={4}
                            />
                        </FormField>
                    </FormSection>

                    <FormSection title="Schedule">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Planned Start Date">
                                <Input
                                    type="date"
                                    value={formData.plannedStartDate}
                                    onChange={(e) => handleChange('plannedStartDate', e.target.value)}
                                />
                            </FormField>
                            <FormField label="Planned End Date">
                                <Input
                                    type="date"
                                    value={formData.plannedEndDate}
                                    onChange={(e) => handleChange('plannedEndDate', e.target.value)}
                                />
                            </FormField>
                        </div>
                    </FormSection>

                    <FormActions>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/audits')}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            isLoading={createMutation.isPending || updateMutation.isPending}
                        >
                            {isNew ? 'Create Audit' : 'Save Changes'}
                        </Button>
                    </FormActions>
                </form>
            </div>
        </div>
    );
};

export default AuditDetail;
