import { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2,
  Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { getGeofences, createGeofence, deleteGeofence } from '@/lib/api';
import { toast } from 'sonner';

const COLORS = [
  '#002FA7', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
];

export default function Geofences() {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, geofence: null });
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    description: '',
    center_lat: '',
    center_lng: '',
    radius: '',
    color: COLORS[0]
  });

  const fetchGeofences = useCallback(async () => {
    try {
      const data = await getGeofences(false);
      setGeofences(data);
    } catch (error) {
      console.error('Failed to fetch geofences:', error);
      toast.error('Failed to load geofences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGeofences();
  }, [fetchGeofences]);

  const handleCreate = async () => {
    if (!newGeofence.name.trim() || !newGeofence.center_lat || !newGeofence.center_lng || !newGeofence.radius) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createGeofence({
        ...newGeofence,
        center_lat: parseFloat(newGeofence.center_lat),
        center_lng: parseFloat(newGeofence.center_lng),
        radius: parseFloat(newGeofence.radius)
      });
      toast.success('Geofence created');
      setNewGeofence({ name: '', description: '', center_lat: '', center_lng: '', radius: '', color: COLORS[0] });
      setAddDialogOpen(false);
      fetchGeofences();
    } catch (error) {
      toast.error('Failed to create geofence');
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog.geofence) return;
    try {
      await deleteGeofence(deleteDialog.geofence.id);
      toast.success('Geofence deleted');
      setDeleteDialog({ open: false, geofence: null });
      fetchGeofences();
    } catch (error) {
      toast.error('Failed to delete geofence');
    }
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
            Geofences
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            {geofences.length} geofence{geofences.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Button
          onClick={() => setAddDialogOpen(true)}
          className="proscan-btn-primary"
          data-testid="add-geofence-btn"
        >
          <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
          Add Geofence
        </Button>
      </div>

      {/* Geofences Grid */}
      {geofences.length === 0 ? (
        <Card className="proscan-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10 text-[var(--text-secondary)]" strokeWidth={1.5} />
            </div>
            <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
              No geofences configured
            </p>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Create geofences to track team member locations within specific areas
            </p>
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="proscan-btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Add Geofence
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {geofences.map((gf, index) => (
            <Card 
              key={gf.id}
              className={`proscan-card animate-stagger stagger-${(index % 6) + 1}`}
              data-testid={`geofence-card-${gf.id}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 flex items-center justify-center"
                      style={{ backgroundColor: `${gf.color}20` }}
                    >
                      <Circle 
                        className="w-5 h-5" 
                        style={{ color: gf.color, fill: gf.color }}
                        strokeWidth={0}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{gf.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">Radius: {gf.radius}m</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-8 w-8 text-[var(--text-secondary)] hover:text-[var(--accent-destructive)]"
                    onClick={() => setDeleteDialog({ open: true, geofence: gf })}
                    data-testid={`delete-gf-${gf.id}`}
                  >
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </div>

                {gf.description && (
                  <p className="text-sm text-[var(--text-secondary)] mb-3">
                    {gf.description}
                  </p>
                )}

                <div className="text-xs font-mono text-[var(--text-secondary)] bg-[var(--surface-main)] p-2">
                  Center: {gf.center_lat.toFixed(5)}, {gf.center_lng.toFixed(5)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Geofence Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Cabinet_Grotesk']">Add Geofence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="gf-name">Name *</Label>
              <Input
                id="gf-name"
                value={newGeofence.name}
                onChange={(e) => setNewGeofence({ ...newGeofence, name: e.target.value })}
                placeholder="e.g., Plant 1, Office"
                data-testid="gf-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gf-description">Description</Label>
              <Input
                id="gf-description"
                value={newGeofence.description}
                onChange={(e) => setNewGeofence({ ...newGeofence, description: e.target.value })}
                placeholder="Optional description"
                data-testid="gf-description-input"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gf-lat">Center Latitude *</Label>
                <Input
                  id="gf-lat"
                  type="number"
                  step="any"
                  value={newGeofence.center_lat}
                  onChange={(e) => setNewGeofence({ ...newGeofence, center_lat: e.target.value })}
                  placeholder="e.g., 37.7749"
                  data-testid="gf-lat-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gf-lng">Center Longitude *</Label>
                <Input
                  id="gf-lng"
                  type="number"
                  step="any"
                  value={newGeofence.center_lng}
                  onChange={(e) => setNewGeofence({ ...newGeofence, center_lng: e.target.value })}
                  placeholder="e.g., -122.4194"
                  data-testid="gf-lng-input"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="gf-radius">Radius (meters) *</Label>
              <Input
                id="gf-radius"
                type="number"
                value={newGeofence.radius}
                onChange={(e) => setNewGeofence({ ...newGeofence, radius: e.target.value })}
                placeholder="e.g., 100"
                data-testid="gf-radius-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 transition-transform ${
                      newGeofence.color === color ? 'border-[var(--text-primary)] scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewGeofence({ ...newGeofence, color })}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="proscan-btn-primary" 
              onClick={handleCreate}
              data-testid="submit-geofence-btn"
            >
              Create Geofence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, geofence: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Cabinet_Grotesk']">Delete Geofence</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.geofence?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[var(--accent-destructive)] hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
