import { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Phone,
  User,
  RefreshCw,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSOSAlerts, acknowledgeSOSAlert, cancelSOSAlert, resolveSOSAlert } from '@/lib/api';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const ALERT_STATUS_CONFIG = {
  TRIGGERED: { color: '#EF4444', bgColor: '#EF444415', label: 'Active', icon: AlertTriangle },
  ACKNOWLEDGED: { color: '#F59E0B', bgColor: '#F59E0B15', label: 'Acknowledged', icon: Clock },
  CANCELED: { color: '#6B7280', bgColor: '#6B728015', label: 'Canceled', icon: XCircle },
  RESOLVED: { color: '#10B981', bgColor: '#10B98115', label: 'Resolved', icon: CheckCircle },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [actionDialog, setActionDialog] = useState({ open: false, type: null, alert: null });
  const [cancelReason, setCancelReason] = useState('');

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await getSOSAlerts(null, 100);
      setAlerts(data);
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  const handleAcknowledge = async (alert) => {
    try {
      await acknowledgeSOSAlert(alert.id, 'Dashboard Admin');
      toast.success('Alert acknowledged');
      fetchAlerts();
      setActionDialog({ open: false, type: null, alert: null });
    } catch (error) {
      toast.error('Failed to acknowledge alert');
    }
  };

  const handleCancel = async (alert) => {
    try {
      await cancelSOSAlert(alert.id, 'Dashboard Admin', cancelReason);
      toast.success('Alert canceled');
      fetchAlerts();
      setActionDialog({ open: false, type: null, alert: null });
      setCancelReason('');
    } catch (error) {
      toast.error('Failed to cancel alert');
    }
  };

  const handleResolve = async (alert) => {
    try {
      await resolveSOSAlert(alert.id);
      toast.success('Alert resolved');
      fetchAlerts();
      setActionDialog({ open: false, type: null, alert: null });
    } catch (error) {
      toast.error('Failed to resolve alert');
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'TRIGGERED' || a.status === 'ACKNOWLEDGED');
  const resolvedAlerts = alerts.filter(a => a.status === 'RESOLVED' || a.status === 'CANCELED');

  const getStatusConfig = (status) => ALERT_STATUS_CONFIG[status] || ALERT_STATUS_CONFIG.TRIGGERED;

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
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
            Emergency Alerts
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
          data-testid="refresh-alerts-btn"
        >
          <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} strokeWidth={1.5} />
          Refresh
        </Button>
      </div>

      {/* Active Alert Banner */}
      {activeAlerts.length > 0 && (
        <Card className="mb-6 border-[var(--accent-destructive)] bg-red-50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--accent-destructive)] flex items-center justify-center animate-pulse">
              <Bell className="w-6 h-6 text-white" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-bold text-[var(--accent-destructive)] text-lg">
                {activeAlerts.length} ACTIVE EMERGENCY ALERT{activeAlerts.length > 1 ? 'S' : ''}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Immediate attention required
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="active" data-testid="active-alerts-tab">
            Active ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="history-alerts-tab">
            History ({resolvedAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {activeAlerts.length === 0 ? (
            <Card className="proscan-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 bg-green-50 flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-500" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
                  No Active Alerts
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  All team members are safe
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => {
                const config = getStatusConfig(alert.status);
                return (
                  <Card 
                    key={alert.id}
                    className={cn(
                      "proscan-card border-l-4",
                      alert.status === 'TRIGGERED' && "border-l-[var(--accent-destructive)]"
                    )}
                    data-testid={`alert-${alert.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div 
                            className={cn(
                              "w-12 h-12 flex items-center justify-center",
                              alert.status === 'TRIGGERED' && "animate-pulse"
                            )}
                            style={{ backgroundColor: config.bgColor }}
                          >
                            <config.icon className="w-6 h-6" style={{ color: config.color }} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-lg">SOS Alert</h3>
                              <Badge 
                                variant="secondary"
                                style={{ backgroundColor: config.bgColor, color: config.color }}
                              >
                                {config.label}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                                <span className="font-medium">{alert.user_name || 'Unknown'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                                <span className="font-mono">{alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                                <span>{format(new Date(alert.timestamp), 'PPp')}</span>
                                <span className="text-[var(--text-secondary)]">
                                  ({formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })})
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {alert.status === 'TRIGGERED' && (
                            <Button
                              onClick={() => setActionDialog({ open: true, type: 'acknowledge', alert })}
                              className="bg-[var(--accent-warning)] hover:bg-yellow-600"
                              data-testid={`ack-btn-${alert.id}`}
                            >
                              Acknowledge
                            </Button>
                          )}
                          {(alert.status === 'TRIGGERED' || alert.status === 'ACKNOWLEDGED') && (
                            <>
                              <Button
                                onClick={() => setActionDialog({ open: true, type: 'resolve', alert })}
                                className="bg-green-600 hover:bg-green-700"
                                data-testid={`resolve-btn-${alert.id}`}
                              >
                                Resolve
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setActionDialog({ open: true, type: 'cancel', alert })}
                                data-testid={`cancel-btn-${alert.id}`}
                              >
                                Cancel Alert
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {alert.acknowledged_by && (
                        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] text-sm">
                          <span className="text-[var(--text-secondary)]">Acknowledged by:</span>{' '}
                          <span className="font-medium">{alert.acknowledged_by}</span>{' '}
                          <span className="text-[var(--text-secondary)]">
                            at {format(new Date(alert.acknowledged_at), 'PPp')}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {resolvedAlerts.length === 0 ? (
            <Card className="proscan-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-sm text-[var(--text-secondary)]">
                  No alert history
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {resolvedAlerts.map((alert) => {
                const config = getStatusConfig(alert.status);
                return (
                  <Card 
                    key={alert.id}
                    className="proscan-card"
                    data-testid={`history-alert-${alert.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 flex items-center justify-center"
                            style={{ backgroundColor: config.bgColor }}
                          >
                            <config.icon className="w-5 h-5" style={{ color: config.color }} strokeWidth={1.5} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{alert.user_name || 'Unknown'}</span>
                              <Badge 
                                variant="secondary"
                                className="text-xs"
                                style={{ backgroundColor: config.bgColor, color: config.color }}
                              >
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {format(new Date(alert.timestamp), 'PPp')}
                            </p>
                          </div>
                        </div>
                        {alert.cancellation_info && (
                          <p className="text-xs text-[var(--text-secondary)]">
                            Reason: {alert.cancellation_info}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Dialogs */}
      <AlertDialog 
        open={actionDialog.open && actionDialog.type === 'acknowledge'} 
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, alert: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Cabinet_Grotesk']">Acknowledge Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Acknowledging this alert indicates you are aware and taking action. 
              The alert will remain active until resolved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleAcknowledge(actionDialog.alert)}
              className="bg-[var(--accent-warning)]"
            >
              Acknowledge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={actionDialog.open && actionDialog.type === 'resolve'} 
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, alert: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Cabinet_Grotesk']">Resolve Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Resolving this alert confirms the emergency has been addressed and the team member is safe.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleResolve(actionDialog.alert)}
              className="bg-green-600"
            >
              Mark as Resolved
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog 
        open={actionDialog.open && actionDialog.type === 'cancel'} 
        onOpenChange={(open) => !open && setActionDialog({ open: false, type: null, alert: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Cabinet_Grotesk']">Cancel Alert</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for canceling this alert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="cancel-reason">Cancellation Reason</Label>
            <Input
              id="cancel-reason"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., False alarm, accidental trigger"
              className="mt-2"
              data-testid="cancel-reason-input"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCancel(actionDialog.alert)}
            >
              Cancel Alert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
