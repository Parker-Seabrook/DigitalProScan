import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Briefcase, 
  AlertTriangle,
  Activity,
  Clock,
  Truck,
  Wrench,
  PauseCircle,
  MapPin,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStats, getCurrentStatuses } from '@/lib/api';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_team_members: 0,
    working: 0,
    support_activity: 0,
    work_delay: 0,
    traveling: 0,
    idle: 0,
    active_alerts: 0,
    updates_today: 0,
    total_jobs: 0,
    total_geofences: 0,
    recent_activity: []
  });
  const [currentStatuses, setCurrentStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, statusesData] = await Promise.all([
        getStats(),
        getCurrentStatuses()
      ]);
      setStats(statsData);
      setCurrentStatuses(statusesData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const statCards = [
    { label: 'Team Members', value: stats.total_team_members, icon: Users, color: '#002FA7' },
    { label: 'Working', value: stats.working, icon: Activity, color: '#10B981' },
    { label: 'Support Activity', value: stats.support_activity, icon: Wrench, color: '#F59E0B' },
    { label: 'Work Delay', value: stats.work_delay, icon: PauseCircle, color: '#EF4444' },
    { label: 'Traveling', value: stats.traveling, icon: Truck, color: '#3B82F6' },
    { label: 'Active Alerts', value: stats.active_alerts, icon: AlertTriangle, color: stats.active_alerts > 0 ? '#EF4444' : '#6B7280' },
  ];

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
      <div className="flex items-start justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Real-time workforce tracking and productivity monitoring
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
          data-testid="refresh-btn"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} strokeWidth={1.5} />
          Refresh
        </Button>
      </div>

      {/* Alert Banner */}
      {stats.active_alerts > 0 && (
        <Card className="mb-6 border-[var(--accent-destructive)] bg-red-50 animate-fade-in">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--accent-destructive)] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold text-[var(--accent-destructive)]">
                  {stats.active_alerts} Active Emergency Alert{stats.active_alerts > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-[var(--text-secondary)]">Immediate attention required</p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/alerts')}
              className="bg-[var(--accent-destructive)] hover:bg-red-600"
              data-testid="view-alerts-btn"
            >
              View Alerts
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.label} 
            className={`proscan-card stat-card animate-stagger stagger-${index + 1}`}
            data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="proscan-label mb-1 text-[10px]">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight font-['Cabinet_Grotesk']">
                    {stat.value}
                  </p>
                </div>
                <div 
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon 
                    className="w-4 h-4" 
                    style={{ color: stat.color }}
                    strokeWidth={1.5}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Status Overview */}
        <Card className="lg:col-span-2 proscan-card">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Users className="w-5 h-5" strokeWidth={1.5} />
              Team Status
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/team')}
              className="text-[var(--accent-primary)]"
              data-testid="view-all-team"
            >
              View All
              <ArrowUpRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
            </Button>
          </CardHeader>
          <CardContent>
            {currentStatuses.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3" strokeWidth={1} />
                <p className="text-sm text-[var(--text-secondary)]">No team members added yet</p>
                <Button
                  onClick={() => navigate('/team')}
                  className="mt-4 proscan-btn-primary"
                  data-testid="add-first-member"
                >
                  Add Team Member
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {currentStatuses.slice(0, 10).map((member) => {
                  const statusConfig = getStatusConfig(member.status);
                  return (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 border border-[var(--border-subtle)] hover:bg-[var(--surface-main)] transition-colors cursor-pointer"
                      onClick={() => navigate(`/team/${member.user_id}`)}
                      data-testid={`member-row-${member.user_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 flex items-center justify-center font-semibold text-sm"
                          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                        >
                          {member.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {member.employee_id} {member.job_wo_number && `• ${member.job_wo_number}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant="secondary"
                          className="text-xs"
                          style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
                        >
                          <statusConfig.icon className="w-3 h-3 mr-1" strokeWidth={1.5} />
                          {statusConfig.label}
                        </Badge>
                        {member.speed > 0 && (
                          <span className="text-xs text-[var(--text-secondary)]">
                            {(member.speed * 2.237).toFixed(0)} mph
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="proscan-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Clock className="w-5 h-5" strokeWidth={1.5} />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recent_activity.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                No recent activity
              </p>
            ) : (
              <ul className="space-y-3 max-h-[400px] overflow-y-auto">
                {stats.recent_activity.map((activity, index) => {
                  const statusConfig = getStatusConfig(activity.status);
                  return (
                    <li 
                      key={activity.id || index}
                      className="flex items-start gap-3 pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0"
                    >
                      <div 
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: statusConfig.bgColor }}
                      >
                        <statusConfig.icon className="w-4 h-4" style={{ color: statusConfig.color }} strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                          {activity.user_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {statusConfig.label}
                          {activity.details && ` - ${activity.details}`}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Card className="proscan-card cursor-pointer hover:border-[var(--accent-primary)]" onClick={() => navigate('/jobs')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-[var(--accent-primary)]" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-bold font-['Cabinet_Grotesk']">{stats.total_jobs}</p>
              <p className="text-xs text-[var(--text-secondary)]">Active Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="proscan-card cursor-pointer hover:border-[var(--accent-primary)]" onClick={() => navigate('/geofences')}>
          <CardContent className="p-4 flex items-center gap-3">
            <MapPin className="w-8 h-8 text-[var(--accent-primary)]" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-bold font-['Cabinet_Grotesk']">{stats.total_geofences}</p>
              <p className="text-xs text-[var(--text-secondary)]">Geofences</p>
            </div>
          </CardContent>
        </Card>
        <Card className="proscan-card cursor-pointer hover:border-[var(--accent-primary)]" onClick={() => navigate('/map')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="w-8 h-8 text-[var(--accent-primary)]" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-bold font-['Cabinet_Grotesk']">{stats.updates_today}</p>
              <p className="text-xs text-[var(--text-secondary)]">Updates Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="proscan-card cursor-pointer hover:border-[var(--accent-primary)]" onClick={() => navigate('/reports')}>
          <CardContent className="p-4 flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#10B981]" strokeWidth={1.5} />
            <div>
              <p className="text-2xl font-bold font-['Cabinet_Grotesk']">
                {stats.total_team_members > 0 
                  ? Math.round((stats.working / stats.total_team_members) * 100) 
                  : 0}%
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Productivity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
