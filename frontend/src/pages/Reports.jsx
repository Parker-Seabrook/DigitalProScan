import { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3,
  Activity,
  Wrench,
  PauseCircle,
  Truck,
  Clock,
  Download,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getProductivityReport, getWorkBarriersReport, getTeamMembers } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  WORKING: { color: '#10B981', bgColor: '#10B98115', label: 'Working', icon: Activity },
  SUPPORT_ACTIVITY: { color: '#F59E0B', bgColor: '#F59E0B15', label: 'Support Activity', icon: Wrench },
  WORK_DELAY: { color: '#EF4444', bgColor: '#EF444415', label: 'Work Delay', icon: PauseCircle },
  TRAVELING: { color: '#3B82F6', bgColor: '#3B82F615', label: 'Traveling', icon: Truck },
  IDLE: { color: '#6B7280', bgColor: '#6B728015', label: 'Idle', icon: Clock },
};

export default function Reports() {
  const [productivity, setProductivity] = useState(null);
  const [barriers, setBarriers] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (selectedMember !== 'all') {
        params.user_id = selectedMember;
      }
      
      const [prodData, barriersData, membersData] = await Promise.all([
        getProductivityReport(params),
        getWorkBarriersReport(params),
        getTeamMembers()
      ]);
      setProductivity(prodData);
      setBarriers(barriersData);
      setMembers(membersData);
    } catch (error) {
      console.error('Failed to fetch report data:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [selectedMember]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = () => {
    toast.success('Export functionality coming soon');
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

  const totalUpdates = productivity?.total_updates || 1;

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
            Reports
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Productivity analytics and work barrier analysis
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger className="w-48" data-testid="member-filter">
              <SelectValue placeholder="All Members" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} data-testid="export-btn">
            <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
            Export
          </Button>
        </div>
      </div>

      {/* Productivity Overview */}
      <Card className="proscan-card mb-6">
        <CardHeader>
          <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
            <TrendingUp className="w-5 h-5" strokeWidth={1.5} />
            Productivity Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-8 mb-6">
            <div className="text-center">
              <p className="text-5xl font-bold font-['Cabinet_Grotesk'] text-[#10B981]">
                {productivity?.productivity_percentage || 0}%
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Productivity Rate</p>
            </div>
            <div className="flex-1">
              <div className="h-4 bg-[var(--surface-secondary)] rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-[#10B981]" 
                  style={{ width: `${(productivity?.working / totalUpdates) * 100 || 0}%` }}
                />
                <div 
                  className="h-full bg-[#F59E0B]" 
                  style={{ width: `${(productivity?.support_activity / totalUpdates) * 100 || 0}%` }}
                />
                <div 
                  className="h-full bg-[#EF4444]" 
                  style={{ width: `${(productivity?.work_delay / totalUpdates) * 100 || 0}%` }}
                />
                <div 
                  className="h-full bg-[#3B82F6]" 
                  style={{ width: `${(productivity?.traveling / totalUpdates) * 100 || 0}%` }}
                />
                <div 
                  className="h-full bg-[#6B7280]" 
                  style={{ width: `${(productivity?.idle / totalUpdates) * 100 || 0}%` }}
                />
              </div>
              <div className="flex justify-between mt-2">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
                    <span className="text-xs text-[var(--text-secondary)]">{config.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const count = productivity?.[key.toLowerCase()] || 0;
              const percentage = totalUpdates > 0 ? ((count / totalUpdates) * 100).toFixed(1) : 0;
              return (
                <Card key={key} className="border border-[var(--border-subtle)]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div 
                        className="w-8 h-8 flex items-center justify-center"
                        style={{ backgroundColor: config.bgColor }}
                      >
                        <config.icon className="w-4 h-4" style={{ color: config.color }} strokeWidth={1.5} />
                      </div>
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <p className="text-2xl font-bold font-['Cabinet_Grotesk']">{count}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{percentage}% of total</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Work Barriers Analysis */}
      <Card className="proscan-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-[var(--accent-destructive)]" strokeWidth={1.5} />
            Work Delay Analysis (Productive Work Barriers)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {barriers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-[var(--text-secondary)]">No work delays recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {barriers.map((barrier, index) => {
                const maxCount = barriers[0]?.count || 1;
                const percentage = (barrier.count / maxCount) * 100;
                return (
                  <div key={barrier.barrier_type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {barrier.barrier_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <Badge variant="secondary">{barrier.count}</Badge>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}

          {/* Barrier Types Legend */}
          <div className="mt-8 pt-6 border-t border-[var(--border-subtle)]">
            <p className="text-sm font-medium mb-4">18 Site-Specific Productive Work Barriers</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-[var(--text-secondary)]">
              {[
                'Waiting for Permit',
                'Waiting for Parts',
                'Waiting for Equipment',
                'Waiting for Instructions',
                'Weather Delay',
                'Equipment Failure',
                'Safety Stop',
                'Break in Work',
                'Waiting for Access',
                'Coordination Delay',
                'Material Shortage',
                'Rework Required',
                'Inspection Delay',
                'Environmental Issue',
                'Utility Delay',
                'Subcontractor Delay',
                'Design Issue',
                'Other'
              ].map((barrier) => (
                <div key={barrier} className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-destructive)]" />
                  <span>{barrier}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
