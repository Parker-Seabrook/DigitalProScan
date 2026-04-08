import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Plus, 
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Activity,
  Wrench,
  PauseCircle,
  Truck,
  Clock,
  Phone,
  Mail,
  Battery
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { getTeamMembers, createTeamMember, deleteTeamMember } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  WORKING: { color: '#10B981', bgColor: '#10B98115', label: 'Working', icon: Activity },
  SUPPORT_ACTIVITY: { color: '#F59E0B', bgColor: '#F59E0B15', label: 'Support', icon: Wrench },
  WORK_DELAY: { color: '#EF4444', bgColor: '#EF444415', label: 'Delayed', icon: PauseCircle },
  TRAVELING: { color: '#3B82F6', bgColor: '#3B82F615', label: 'Traveling', icon: Truck },
  IDLE: { color: '#6B7280', bgColor: '#6B728015', label: 'Idle', icon: Clock },
  OFFLINE: { color: '#9CA3AF', bgColor: '#9CA3AF15', label: 'Offline', icon: Clock },
};

export default function TeamMembers() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    employee_id: '',
    phone_number: '',
    email: ''
  });

  const fetchMembers = useCallback(async () => {
    try {
      const data = await getTeamMembers();
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleCreateMember = async () => {
    if (!newMember.name.trim() || !newMember.employee_id.trim()) {
      toast.error('Name and Employee ID are required');
      return;
    }
    try {
      await createTeamMember(newMember);
      toast.success('Team member added');
      setNewMember({ name: '', employee_id: '', phone_number: '', email: '' });
      setAddDialogOpen(false);
      fetchMembers();
    } catch (error) {
      toast.error('Failed to add team member');
    }
  };

  const handleDeleteMember = async (id) => {
    try {
      await deleteTeamMember(id);
      toast.success('Team member removed');
      fetchMembers();
    } catch (error) {
      toast.error('Failed to remove team member');
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
            Team Members
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {members.length} team member{members.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
            <Input
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="search-input"
            />
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="proscan-btn-primary"
            data-testid="add-member-btn"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Add Member
          </Button>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <Card className="proscan-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-[var(--text-secondary)]" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
              {searchQuery ? 'No members found' : 'No team members yet'}
            </p>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              {searchQuery ? 'Try a different search term' : 'Add your first team member to get started'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="proscan-btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Add Team Member
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member, index) => {
            const statusConfig = getStatusConfig(member.current_status);
            return (
              <Card 
                key={member.id}
                className={`proscan-card cursor-pointer animate-stagger stagger-${(index % 6) + 1}`}
                onClick={() => navigate(`/team/${member.id}`)}
                data-testid={`member-card-${member.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 flex items-center justify-center font-bold text-lg"
                        style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                      >
                        {member.name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{member.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">{member.employee_id}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/team/${member.id}`); }}>
                          <Edit className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDeleteMember(member.id); }}
                          className="text-[var(--accent-destructive)]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="secondary"
                        style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                      >
                        <statusConfig.icon className="w-3 h-3 mr-1" strokeWidth={1.5} />
                        {statusConfig.label}
                      </Badge>
                      {member.battery_level !== undefined && (
                        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                          <Battery className="w-3 h-3" strokeWidth={1.5} />
                          {member.battery_level}%
                        </div>
                      )}
                    </div>

                    {member.current_job_wo_number && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Job: <span className="font-medium">{member.current_job_wo_number}</span>
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-subtle)]">
                      {member.phone_number && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" strokeWidth={1.5} />
                          {member.phone_number}
                        </div>
                      )}
                      {member.email && (
                        <div className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" strokeWidth={1.5} />
                          <span className="truncate">{member.email}</span>
                        </div>
                      )}
                    </div>

                    {member.last_location_update && (
                      <p className="text-xs text-[var(--text-secondary)]">
                        Last update: {formatDistanceToNow(new Date(member.last_location_update), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Cabinet_Grotesk']">Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="John Doe"
                data-testid="member-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                value={newMember.employee_id}
                onChange={(e) => setNewMember({ ...newMember, employee_id: e.target.value })}
                placeholder="EMP001"
                data-testid="member-empid-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newMember.phone_number}
                onChange={(e) => setNewMember({ ...newMember, phone_number: e.target.value })}
                placeholder="+1 234 567 8900"
                data-testid="member-phone-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="john@company.com"
                data-testid="member-email-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="proscan-btn-primary" 
              onClick={handleCreateMember}
              data-testid="submit-member-btn"
            >
              Add Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
