import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Activity,
  Wrench,
  PauseCircle,
  Truck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Battery,
  Briefcase,
  Save,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  getTeamMember, 
  updateTeamMember, 
  getStatusUpdates, 
  getJobs,
  assignJobToMember,
  getLocations
} from '@/lib/api';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

const STATUS_CONFIG = {
  WORKING: { color: '#10B981', bgColor: '#10B98115', label: 'Working', icon: Activity },
  SUPPORT_ACTIVITY: { color: '#F59E0B', bgColor: '#F59E0B15', label: 'Support Activity', icon: Wrench },
  WORK_DELAY: { color: '#EF4444', bgColor: '#EF444415', label: 'Work Delay', icon: PauseCircle },
  TRAVELING: { color: '#3B82F6', bgColor: '#3B82F615', label: 'Traveling', icon: Truck },
  IDLE: { color: '#6B7280', bgColor: '#6B728015', label: 'Idle', icon: Clock },
  OFFLINE: { color: '#9CA3AF', bgColor: '#9CA3AF15', label: 'Offline', icon: Clock },
};

export default function TeamMemberDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [statusHistory, setStatusHistory] = useState([]);
  const [locations, setLocations] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});

  const fetchData = useCallback(async () => {
    try {
      const [memberData, historyData, jobsData, locationsData] = await Promise.all([
        getTeamMember(id),
        getStatusUpdates(id, 50),
        getJobs(),
        getLocations({ user_id: id, limit: 50 })
      ]);
      setMember(memberData);
      setEditData({
        name: memberData.name,
        phone_number: memberData.phone_number || '',
        email: memberData.email || ''
      });
      setStatusHistory(historyData);
      setJobs(jobsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Failed to fetch member data:', error);
      toast.error('Failed to load team member');
      navigate('/team');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    try {
      await updateTeamMember(id, editData);
      setMember({ ...member, ...editData });
      setEditing(false);
      toast.success('Member updated');
    } catch (error) {
      toast.error('Failed to update member');
    }
  };

  const handleAssignJob = async (jobId) => {
    const job = jobs.find(j => j.id === jobId);
    try {
      await assignJobToMember(id, jobId, job?.job_wo_number || null);
      setMember({ 
        ...member, 
        current_job_wo_id: jobId, 
        current_job_wo_number: job?.job_wo_number 
      });
      toast.success('Job assigned');
    } catch (error) {
      toast.error('Failed to assign job');
    }
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;

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

  if (!member) return null;

  const statusConfig = getStatusConfig(member.current_status);

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/team')}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
            {member.name}
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">{member.employee_id}</p>
        </div>
        <Badge 
          variant="secondary"
          className="text-sm py-1 px-3"
          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
        >
          <statusConfig.icon className="w-4 h-4 mr-2" strokeWidth={1.5} />
          {statusConfig.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="proscan-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk']">
                Profile Information
              </CardTitle>
              {editing ? (
                <Button size="sm" onClick={handleSave} data-testid="save-profile-btn">
                  <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Save
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="edit-profile-btn">
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        data-testid="edit-name-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Employee ID</Label>
                      <Input value={member.employee_id} disabled />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={editData.phone_number}
                        onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                        data-testid="edit-phone-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        data-testid="edit-email-input"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                    <span className="text-sm">{member.phone_number || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                    <span className="text-sm">{member.email || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                    <span className="text-sm">{member.battery_level}% Battery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                    <span className="text-sm">
                      {member.last_location 
                        ? `${member.last_location.lat?.toFixed(4)}, ${member.last_location.lng?.toFixed(4)}`
                        : 'No location'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="history">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history" data-testid="history-tab">Status History</TabsTrigger>
              <TabsTrigger value="locations" data-testid="locations-tab">Locations</TabsTrigger>
            </TabsList>

            <TabsContent value="history" className="mt-4">
              <Card className="proscan-card">
                <CardContent className="p-4">
                  {statusHistory.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                      No status history yet
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {statusHistory.map((update, index) => {
                        const config = getStatusConfig(update.status);
                        return (
                          <div 
                            key={update.id || index}
                            className="flex items-start gap-3 pb-3 border-b border-[var(--border-subtle)] last:border-0"
                          >
                            <div 
                              className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: config.bgColor }}
                            >
                              <config.icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{config.label}</p>
                              {update.details && (
                                <p className="text-xs text-[var(--text-secondary)]">{update.details}</p>
                              )}
                              {update.job_wo_number && (
                                <p className="text-xs text-[var(--text-secondary)]">Job: {update.job_wo_number}</p>
                              )}
                              <p className="text-xs text-[var(--text-secondary)] mt-1">
                                {format(new Date(update.timestamp), 'PPp')}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="locations" className="mt-4">
              <Card className="proscan-card">
                <CardContent className="p-4">
                  {locations.length === 0 ? (
                    <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                      No location data yet
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {locations.map((loc, index) => (
                        <div 
                          key={loc.id || index}
                          className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[var(--accent-primary)]" strokeWidth={1.5} />
                            <span className="text-sm font-mono">
                              {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)]">
                            {loc.speed > 0 && (
                              <span>{(loc.speed * 2.237).toFixed(0)} mph</span>
                            )}
                            <span>{formatDistanceToNow(new Date(loc.timestamp), { addSuffix: true })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Job */}
          <Card className="proscan-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
                <Briefcase className="w-4 h-4" strokeWidth={1.5} />
                Assigned Job/WO
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={member.current_job_wo_id || 'none'}
                onValueChange={(val) => handleAssignJob(val === 'none' ? null : val)}
              >
                <SelectTrigger data-testid="job-select">
                  <SelectValue placeholder="Select job" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Job Assigned</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.job_wo_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {member.current_job_wo_number && (
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  Current: {member.current_job_wo_number}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="proscan-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold font-['Cabinet_Grotesk']">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Status Updates</span>
                <span className="font-medium">{statusHistory.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Location Points</span>
                <span className="font-medium">{locations.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Current Speed</span>
                <span className="font-medium">{(member.speed * 2.237).toFixed(0)} mph</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Last Update</span>
                <span className="font-medium">
                  {member.last_location_update 
                    ? formatDistanceToNow(new Date(member.last_location_update), { addSuffix: true })
                    : 'Never'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="proscan-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold font-['Cabinet_Grotesk']">
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/map')}>
                <MapPin className="w-4 h-4 mr-2" strokeWidth={1.5} />
                View on Map
              </Button>
              <Button variant="outline" className="w-full justify-start text-[var(--accent-destructive)]">
                <AlertTriangle className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Send Alert
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
