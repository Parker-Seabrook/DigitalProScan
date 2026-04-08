import { useState, useEffect, useCallback } from 'react';
import { 
  Map as MapIcon, 
  Users,
  Activity,
  Wrench,
  PauseCircle,
  Truck,
  Clock,
  RefreshCw,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getCurrentStatuses, getGeofences } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  WORKING: { color: '#10B981', bgColor: '#10B98115', label: 'Working', icon: Activity },
  SUPPORT_ACTIVITY: { color: '#F59E0B', bgColor: '#F59E0B15', label: 'Support', icon: Wrench },
  WORK_DELAY: { color: '#EF4444', bgColor: '#EF444415', label: 'Delayed', icon: PauseCircle },
  TRAVELING: { color: '#3B82F6', bgColor: '#3B82F615', label: 'Traveling', icon: Truck },
  IDLE: { color: '#6B7280', bgColor: '#6B728015', label: 'Idle', icon: Clock },
  OFFLINE: { color: '#9CA3AF', bgColor: '#9CA3AF15', label: 'Offline', icon: Clock },
};

export default function LiveMap() {
  const [statuses, setStatuses] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [statusesData, geofencesData] = await Promise.all([
        getCurrentStatuses(),
        getGeofences()
      ]);
      setStatuses(statusesData);
      setGeofences(geofencesData);
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      toast.error('Failed to load map data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;

  const membersWithLocation = statuses.filter(s => s.last_location);

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
    <div className="h-[calc(100vh-56px)] lg:h-screen flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-[var(--border-subtle)] bg-white flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold font-['Cabinet_Grotesk']">Live Map</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={refreshing}
              data-testid="refresh-map-btn"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} strokeWidth={1.5} />
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="show-geofences" className="text-sm">Show Geofences</Label>
            <Switch
              id="show-geofences"
              checked={showGeofences}
              onCheckedChange={setShowGeofences}
              data-testid="geofence-toggle"
            />
          </div>
        </div>

        {/* Team List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <p className="proscan-label mb-3">
              Team Members ({membersWithLocation.length} with location)
            </p>
            {statuses.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-8">
                No team members
              </p>
            ) : (
              <div className="space-y-2">
                {statuses.map((member) => {
                  const config = getStatusConfig(member.status);
                  const hasLocation = member.last_location;
                  return (
                    <div
                      key={member.user_id}
                      className={cn(
                        "p-3 border border-[var(--border-subtle)] cursor-pointer transition-colors",
                        selectedMember === member.user_id && "border-[var(--accent-primary)] bg-[var(--surface-main)]",
                        !hasLocation && "opacity-50"
                      )}
                      onClick={() => setSelectedMember(member.user_id)}
                      data-testid={`map-member-${member.user_id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 flex items-center justify-center text-sm font-semibold"
                            style={{ backgroundColor: config.bgColor, color: config.color }}
                          >
                            {member.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{member.employee_id}</p>
                          </div>
                        </div>
                        <Badge 
                          variant="secondary" 
                          className="text-[10px]"
                          style={{ backgroundColor: config.bgColor, color: config.color }}
                        >
                          {config.label}
                        </Badge>
                      </div>
                      {hasLocation && (
                        <p className="text-xs text-[var(--text-secondary)] mt-2">
                          {member.last_location.lat.toFixed(4)}, {member.last_location.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Geofences */}
          {showGeofences && geofences.length > 0 && (
            <div className="p-4 border-t border-[var(--border-subtle)]">
              <p className="proscan-label mb-3">Geofences ({geofences.length})</p>
              <div className="space-y-2">
                {geofences.map((gf) => (
                  <div
                    key={gf.id}
                    className="p-2 border border-[var(--border-subtle)] text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: gf.color }}
                      />
                      <span className="font-medium">{gf.name}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">
                      Radius: {gf.radius}m
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 bg-[var(--surface-main)] relative">
        {/* Map Placeholder */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
            <MapIcon className="w-12 h-12 text-[var(--text-secondary)]" strokeWidth={1} />
          </div>
          <h2 className="text-xl font-semibold font-['Cabinet_Grotesk'] mb-2">Map View</h2>
          <p className="text-sm text-[var(--text-secondary)] text-center max-w-md px-4">
            Interactive map integration required. This would display real-time GPS locations 
            of team members and geofence boundaries using a mapping library like Mapbox or Google Maps.
          </p>
          
          {membersWithLocation.length > 0 && (
            <Card className="mt-6 w-96">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {membersWithLocation.slice(0, 5).map((member) => {
                  const config = getStatusConfig(member.status);
                  return (
                    <div key={member.user_id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span>{member.name}</span>
                      </div>
                      <span className="text-xs font-mono text-[var(--text-secondary)]">
                        {member.last_location.lat.toFixed(4)}, {member.last_location.lng.toFixed(4)}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white border border-[var(--border-subtle)] p-3 shadow-sm">
          <p className="text-xs font-medium mb-2">Legend</p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className="text-xs">{config.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
