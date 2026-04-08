import { useState } from 'react';
import { 
  User,
  Bell,
  Shield,
  Palette,
  Info,
  Save,
  Check,
  Radio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

export default function Settings() {
  const [settings, setSettings] = useState({
    companyName: 'Digital ProScan',
    adminEmail: 'admin@proscan.com',
    notifications: {
      sosAlerts: true,
      workDelayAlerts: true,
      geofenceAlerts: true,
      emailNotifications: true,
      smsNotifications: false,
      dailyDigest: true
    },
    tracking: {
      updateInterval: '15',
      speedThreshold: '5',
      workDelayThreshold: '30'
    },
    privacy: {
      dataRetention: '90',
      anonymizeReports: false
    }
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    toast.success('Settings saved successfully');
    setTimeout(() => setSaved(false), 2000);
  };

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  return (
    <div className="p-6 md:p-8 lg:p-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
          Settings
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Configure system preferences and notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* General */}
        <Card className="proscan-card animate-stagger stagger-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Radio className="w-5 h-5" strokeWidth={1.5} />
              General
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={settings.companyName}
                  onChange={(e) => updateSetting('companyName', e.target.value)}
                  data-testid="company-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => updateSetting('adminEmail', e.target.value)}
                  data-testid="admin-email-input"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="proscan-card animate-stagger stagger-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              Notifications
            </CardTitle>
            <CardDescription>Configure alert and notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">SOS Alert Notifications</p>
                <p className="text-xs text-[var(--text-secondary)]">Receive immediate alerts for emergencies</p>
              </div>
              <Switch
                checked={settings.notifications.sosAlerts}
                onCheckedChange={(checked) => updateSetting('notifications.sosAlerts', checked)}
                data-testid="sos-alerts-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Work Delay Alerts</p>
                <p className="text-xs text-[var(--text-secondary)]">Notify when team members report work delays</p>
              </div>
              <Switch
                checked={settings.notifications.workDelayAlerts}
                onCheckedChange={(checked) => updateSetting('notifications.workDelayAlerts', checked)}
                data-testid="work-delay-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Geofence Alerts</p>
                <p className="text-xs text-[var(--text-secondary)]">Notify when team members enter/exit geofences</p>
              </div>
              <Switch
                checked={settings.notifications.geofenceAlerts}
                onCheckedChange={(checked) => updateSetting('notifications.geofenceAlerts', checked)}
                data-testid="geofence-alerts-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-[var(--text-secondary)]">Receive alerts via email</p>
              </div>
              <Switch
                checked={settings.notifications.emailNotifications}
                onCheckedChange={(checked) => updateSetting('notifications.emailNotifications', checked)}
                data-testid="email-notifications-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">SMS Notifications</p>
                <p className="text-xs text-[var(--text-secondary)]">Receive alerts via text message</p>
              </div>
              <Switch
                checked={settings.notifications.smsNotifications}
                onCheckedChange={(checked) => updateSetting('notifications.smsNotifications', checked)}
                data-testid="sms-notifications-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Daily Digest</p>
                <p className="text-xs text-[var(--text-secondary)]">Receive daily summary of team activity</p>
              </div>
              <Switch
                checked={settings.notifications.dailyDigest}
                onCheckedChange={(checked) => updateSetting('notifications.dailyDigest', checked)}
                data-testid="daily-digest-toggle"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tracking Settings */}
        <Card className="proscan-card animate-stagger stagger-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Palette className="w-5 h-5" strokeWidth={1.5} />
              Tracking Configuration
            </CardTitle>
            <CardDescription>Configure GPS and status tracking parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Location Update Interval</Label>
                <Select
                  value={settings.tracking.updateInterval}
                  onValueChange={(value) => updateSetting('tracking.updateInterval', value)}
                >
                  <SelectTrigger data-testid="update-interval-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 seconds</SelectItem>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Traveling Speed Threshold</Label>
                <Select
                  value={settings.tracking.speedThreshold}
                  onValueChange={(value) => updateSetting('tracking.speedThreshold', value)}
                >
                  <SelectTrigger data-testid="speed-threshold-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 mph</SelectItem>
                    <SelectItem value="5">5 mph</SelectItem>
                    <SelectItem value="10">10 mph</SelectItem>
                    <SelectItem value="15">15 mph</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--text-secondary)]">
                  Auto-set "Traveling" status when speed exceeds this value
                </p>
              </div>
              <div className="space-y-2">
                <Label>Work Delay Alert Threshold</Label>
                <Select
                  value={settings.tracking.workDelayThreshold}
                  onValueChange={(value) => updateSetting('tracking.workDelayThreshold', value)}
                >
                  <SelectTrigger data-testid="delay-threshold-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-[var(--text-secondary)]">
                  Send alert when work delay exceeds this duration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="proscan-card animate-stagger stagger-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Shield className="w-5 h-5" strokeWidth={1.5} />
              Privacy & Data
            </CardTitle>
            <CardDescription>Data retention and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Data Retention Period</Label>
              <Select
                value={settings.privacy.dataRetention}
                onValueChange={(value) => updateSetting('privacy.dataRetention', value)}
              >
                <SelectTrigger className="w-48" data-testid="data-retention-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--text-secondary)]">
                Location and activity data older than this will be automatically deleted
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Anonymize Reports</p>
                <p className="text-xs text-[var(--text-secondary)]">Hide employee names in exported reports</p>
              </div>
              <Switch
                checked={settings.privacy.anonymizeReports}
                onCheckedChange={(checked) => updateSetting('privacy.anonymizeReports', checked)}
                data-testid="anonymize-toggle"
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="proscan-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Info className="w-5 h-5" strokeWidth={1.5} />
              About
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Application</span>
                <span className="font-medium">Digital ProScan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Build</span>
                <span className="font-medium">2026.01.06</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Based On</span>
                <span className="font-medium">PocketRastrac</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            className="proscan-btn-primary min-w-32"
            data-testid="save-settings-btn"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
