import { useState } from 'react';
import { 
  User,
  Bell,
  Shield,
  Palette,
  Cloud,
  HardDrive,
  Info,
  Save,
  Check
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
    userName: 'John Doe',
    email: 'john.doe@example.com',
    notifications: {
      email: true,
      desktop: false,
      scanComplete: true,
      weeklyDigest: false
    },
    appearance: {
      theme: 'light',
      defaultView: 'grid'
    },
    storage: {
      autoDelete: false,
      deleteAfterDays: 30
    },
    privacy: {
      analytics: true,
      crashReports: true
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
          Manage your account preferences and application settings.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <Card className="proscan-card animate-stagger stagger-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <User className="w-5 h-5" strokeWidth={1.5} />
              Profile
            </CardTitle>
            <CardDescription>Your personal information and account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={settings.userName}
                  onChange={(e) => updateSetting('userName', e.target.value)}
                  data-testid="settings-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateSetting('email', e.target.value)}
                  data-testid="settings-email-input"
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
            <CardDescription>Configure how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-[var(--text-secondary)]">Receive updates via email</p>
              </div>
              <Switch
                checked={settings.notifications.email}
                onCheckedChange={(checked) => updateSetting('notifications.email', checked)}
                data-testid="email-notifications-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Desktop Notifications</p>
                <p className="text-xs text-[var(--text-secondary)]">Show browser notifications</p>
              </div>
              <Switch
                checked={settings.notifications.desktop}
                onCheckedChange={(checked) => updateSetting('notifications.desktop', checked)}
                data-testid="desktop-notifications-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Scan Complete Alerts</p>
                <p className="text-xs text-[var(--text-secondary)]">Notify when OCR extraction completes</p>
              </div>
              <Switch
                checked={settings.notifications.scanComplete}
                onCheckedChange={(checked) => updateSetting('notifications.scanComplete', checked)}
                data-testid="scan-complete-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Weekly Digest</p>
                <p className="text-xs text-[var(--text-secondary)]">Summary of your document activity</p>
              </div>
              <Switch
                checked={settings.notifications.weeklyDigest}
                onCheckedChange={(checked) => updateSetting('notifications.weeklyDigest', checked)}
                data-testid="weekly-digest-toggle"
              />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="proscan-card animate-stagger stagger-3">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Palette className="w-5 h-5" strokeWidth={1.5} />
              Appearance
            </CardTitle>
            <CardDescription>Customize how the application looks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settings.appearance.theme}
                  onValueChange={(value) => updateSetting('appearance.theme', value)}
                >
                  <SelectTrigger data-testid="theme-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default View</Label>
                <Select
                  value={settings.appearance.defaultView}
                  onValueChange={(value) => updateSetting('appearance.defaultView', value)}
                >
                  <SelectTrigger data-testid="default-view-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="list">List</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="proscan-card animate-stagger stagger-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <HardDrive className="w-5 h-5" strokeWidth={1.5} />
              Storage
            </CardTitle>
            <CardDescription>Manage document storage settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Auto-delete Old Documents</p>
                <p className="text-xs text-[var(--text-secondary)]">Automatically remove documents after a period</p>
              </div>
              <Switch
                checked={settings.storage.autoDelete}
                onCheckedChange={(checked) => updateSetting('storage.autoDelete', checked)}
                data-testid="auto-delete-toggle"
              />
            </div>
            {settings.storage.autoDelete && (
              <div className="pl-4 border-l-2 border-[var(--border-subtle)]">
                <div className="space-y-2">
                  <Label>Delete documents after</Label>
                  <Select
                    value={String(settings.storage.deleteAfterDays)}
                    onValueChange={(value) => updateSetting('storage.deleteAfterDays', parseInt(value))}
                  >
                    <SelectTrigger className="w-48" data-testid="delete-after-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="proscan-card animate-stagger stagger-5">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Shield className="w-5 h-5" strokeWidth={1.5} />
              Privacy
            </CardTitle>
            <CardDescription>Control your data and privacy settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Usage Analytics</p>
                <p className="text-xs text-[var(--text-secondary)]">Help improve ProScan with anonymous usage data</p>
              </div>
              <Switch
                checked={settings.privacy.analytics}
                onCheckedChange={(checked) => updateSetting('privacy.analytics', checked)}
                data-testid="analytics-toggle"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Crash Reports</p>
                <p className="text-xs text-[var(--text-secondary)]">Send crash reports to help fix bugs</p>
              </div>
              <Switch
                checked={settings.privacy.crashReports}
                onCheckedChange={(checked) => updateSetting('privacy.crashReports', checked)}
                data-testid="crash-reports-toggle"
              />
            </div>
          </CardContent>
        </Card>

        {/* Cloud Integration */}
        <Card className="proscan-card animate-stagger stagger-6">
          <CardHeader>
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Cloud className="w-5 h-5" strokeWidth={1.5} />
              Cloud Integration
            </CardTitle>
            <CardDescription>Connect to cloud storage services.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border border-dashed border-[var(--border-subtle)] bg-[var(--surface-main)]">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-10 h-10 bg-[var(--surface-secondary)] flex items-center justify-center mb-2">
                    <Cloud className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">Google Drive</p>
                  <Button variant="outline" size="sm" className="mt-3" data-testid="connect-gdrive">
                    Connect
                  </Button>
                </CardContent>
              </Card>
              <Card className="border border-dashed border-[var(--border-subtle)] bg-[var(--surface-main)]">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-10 h-10 bg-[var(--surface-secondary)] flex items-center justify-center mb-2">
                    <Cloud className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">Dropbox</p>
                  <Button variant="outline" size="sm" className="mt-3" data-testid="connect-dropbox">
                    Connect
                  </Button>
                </CardContent>
              </Card>
              <Card className="border border-dashed border-[var(--border-subtle)] bg-[var(--surface-main)]">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-10 h-10 bg-[var(--surface-secondary)] flex items-center justify-center mb-2">
                    <Cloud className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium">iCloud</p>
                  <Button variant="outline" size="sm" className="mt-3" data-testid="connect-icloud">
                    Connect
                  </Button>
                </CardContent>
              </Card>
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
                <span className="text-[var(--text-secondary)]">Version</span>
                <span className="font-medium">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Build</span>
                <span className="font-medium">2026.01.06</span>
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
