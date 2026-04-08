import { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, 
  Plus, 
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Archive,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getJobs, createJob, updateJob } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({
    job_wo_number: '',
    description: '',
    location: '',
    client_name: ''
  });

  const fetchJobs = useCallback(async () => {
    try {
      const data = await getJobs(false);
      setJobs(data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleCreateJob = async () => {
    if (!newJob.job_wo_number.trim()) {
      toast.error('Job/WO Number is required');
      return;
    }
    try {
      await createJob(newJob);
      toast.success('Job created');
      setNewJob({ job_wo_number: '', description: '', location: '', client_name: '' });
      setAddDialogOpen(false);
      fetchJobs();
    } catch (error) {
      toast.error('Failed to create job');
    }
  };

  const handleToggleActive = async (job) => {
    try {
      await updateJob(job.id, !job.is_active);
      toast.success(job.is_active ? 'Job archived' : 'Job activated');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to update job');
    }
  };

  const activeJobs = jobs.filter(j => j.is_active);
  const archivedJobs = jobs.filter(j => !j.is_active);

  const filterJobs = (jobList) => {
    if (!searchQuery) return jobList;
    return jobList.filter(j => 
      j.job_wo_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)] lg:min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[var(--surface-secondary)] rounded-sm"></div>
          <div className="h-4 w-32 bg-[var(--surface-secondary)] rounded-sm"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
            Jobs / Work Orders
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="search-input"
            />
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="proscan-btn-primary"
            data-testid="add-job-btn"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Add Job
          </Button>
        </div>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2 max-w-md mb-6">
          <TabsTrigger value="active" data-testid="active-jobs-tab">
            Active ({activeJobs.length})
          </TabsTrigger>
          <TabsTrigger value="archived" data-testid="archived-jobs-tab">
            Archived ({archivedJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {filterJobs(activeJobs).length === 0 ? (
            <Card className="proscan-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
                  <Briefcase className="w-10 h-10 text-[var(--text-secondary)]" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
                  {searchQuery ? 'No jobs found' : 'No active jobs'}
                </p>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first job to get started'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="proscan-btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Add Job
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterJobs(activeJobs).map((job, index) => (
                <Card 
                  key={job.id}
                  className={`proscan-card animate-stagger stagger-${(index % 6) + 1}`}
                  data-testid={`job-card-${job.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--accent-primary)]15 flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-[var(--accent-primary)]" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{job.job_wo_number}</p>
                          <Badge variant="secondary" className="text-xs mt-1">Active</Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleToggleActive(job)}>
                            <Archive className="w-4 h-4 mr-2" strokeWidth={1.5} />
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {job.description && (
                      <p className="text-sm text-[var(--text-secondary)] mb-2 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                    
                    <div className="space-y-1 text-xs text-[var(--text-secondary)]">
                      {job.client_name && <p>Client: {job.client_name}</p>}
                      {job.location && <p>Location: {job.location}</p>}
                      <p>Created: {format(new Date(job.created_at), 'PP')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived">
          {filterJobs(archivedJobs).length === 0 ? (
            <Card className="proscan-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-[var(--text-secondary)]">No archived jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterJobs(archivedJobs).map((job) => (
                <Card 
                  key={job.id}
                  className="proscan-card opacity-75"
                  data-testid={`archived-job-${job.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[var(--surface-secondary)] flex items-center justify-center">
                          <Briefcase className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="font-bold text-[var(--text-primary)]">{job.job_wo_number}</p>
                          <Badge variant="outline" className="text-xs mt-1">Archived</Badge>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleToggleActive(job)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" strokeWidth={1.5} />
                        Restore
                      </Button>
                    </div>
                    {job.description && (
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Job Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Cabinet_Grotesk']">Add Job / Work Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="job_wo_number">Job/WO Number *</Label>
              <Input
                id="job_wo_number"
                value={newJob.job_wo_number}
                onChange={(e) => setNewJob({ ...newJob, job_wo_number: e.target.value })}
                placeholder="e.g., 55856932"
                data-testid="job-number-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client_name">Client Name</Label>
              <Input
                id="client_name"
                value={newJob.client_name}
                onChange={(e) => setNewJob({ ...newJob, client_name: e.target.value })}
                placeholder="e.g., Acme Corporation"
                data-testid="client-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                placeholder="e.g., Plant 1, Building A"
                data-testid="job-location-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Job description..."
                rows={3}
                data-testid="job-description-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="proscan-btn-primary" 
              onClick={handleCreateJob}
              data-testid="submit-job-btn"
            >
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
