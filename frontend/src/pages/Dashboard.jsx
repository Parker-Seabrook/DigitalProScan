import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ScanLine, 
  Layers, 
  HardDrive,
  Upload,
  Clock,
  Star,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getStats, getDocuments, createDocument } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_documents: 0,
    total_scans_today: 0,
    total_pages: 0,
    storage_used_mb: 0,
    recent_activity: []
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, docsData] = await Promise.all([
        getStats(),
        getDocuments()
      ]);
      setStats(statsData);
      setRecentDocs(docsData.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or image file');
      return;
    }

    try {
      const fileType = file.type.includes('pdf') ? 'pdf' : file.type.split('/')[1];
      await createDocument({
        name: file.name,
        file_type: fileType,
        size: file.size,
        page_count: 1
      });
      toast.success('Document uploaded successfully');
      fetchData();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const statCards = [
    { 
      label: 'Total Documents', 
      value: stats.total_documents, 
      icon: FileText,
      color: '#002FA7'
    },
    { 
      label: 'Scans Today', 
      value: stats.total_scans_today, 
      icon: ScanLine,
      color: '#10B981'
    },
    { 
      label: 'Total Pages', 
      value: stats.total_pages, 
      icon: Layers,
      color: '#F59E0B'
    },
    { 
      label: 'Storage Used', 
      value: `${stats.storage_used_mb} MB`, 
      icon: HardDrive,
      color: '#8B5CF6'
    },
  ];

  const getActionLabel = (action) => {
    switch (action) {
      case 'uploaded': return 'Uploaded';
      case 'ocr_extracted': return 'OCR Extracted';
      case 'edited': return 'Edited';
      case 'deleted': return 'Deleted';
      default: return action;
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
    <div className="p-6 md:p-8 lg:p-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
          Dashboard
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          Welcome to Digital ProScan. Manage and organize your documents.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.label} 
            className={`proscan-card stat-card animate-stagger stagger-${index + 1}`}
            data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="proscan-label mb-2">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold tracking-tight font-['Cabinet_Grotesk']">
                    {stat.value}
                  </p>
                </div>
                <div 
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: `${stat.color}10` }}
                >
                  <stat.icon 
                    className="w-5 h-5" 
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
        {/* Upload Zone */}
        <Card className="lg:col-span-2 proscan-card animate-stagger stagger-5">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
              <Upload className="w-5 h-5" strokeWidth={1.5} />
              Quick Upload
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`proscan-upload-zone flex flex-col items-center justify-center p-8 md:p-12 cursor-pointer ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload').click()}
              data-testid="upload-zone"
            >
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileInput}
                className="hidden"
                data-testid="file-input"
              />
              <div className="w-16 h-16 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
                <Upload className="w-8 h-8 text-[var(--text-secondary)]" strokeWidth={1.5} />
              </div>
              <p className="text-base font-medium text-[var(--text-primary)] mb-1">
                Drop files here or click to upload
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                Supports PDF, PNG, JPG files
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="proscan-card animate-stagger stagger-6">
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
              <ul className="space-y-3">
                {stats.recent_activity.map((activity, index) => (
                  <li 
                    key={activity.id || index}
                    className="flex items-start gap-3 pb-3 border-b border-[var(--border-subtle)] last:border-0 last:pb-0"
                  >
                    <div className="w-8 h-8 bg-[var(--surface-secondary)] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {activity.document_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {getActionLabel(activity.action)}
                        </Badge>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold font-['Cabinet_Grotesk'] flex items-center gap-2">
            <FileText className="w-5 h-5" strokeWidth={1.5} />
            Recent Documents
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/documents')}
            className="text-[var(--accent-primary)] hover:text-[var(--accent-hover)]"
            data-testid="view-all-docs"
          >
            View All
            <ArrowUpRight className="w-4 h-4 ml-1" strokeWidth={1.5} />
          </Button>
        </div>

        {recentDocs.length === 0 ? (
          <Card className="proscan-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-[var(--text-secondary)]" strokeWidth={1.5} />
              </div>
              <p className="text-base font-medium text-[var(--text-primary)] mb-1">
                No documents yet
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Upload your first document to get started
              </p>
              <Button
                onClick={() => document.getElementById('file-upload').click()}
                className="proscan-btn-primary"
                data-testid="upload-first-doc"
              >
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Upload Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentDocs.map((doc, index) => (
              <Card 
                key={doc.id}
                className={`proscan-card cursor-pointer animate-stagger stagger-${(index % 6) + 1}`}
                onClick={() => navigate(`/documents/${doc.id}`)}
                data-testid={`doc-card-${doc.id}`}
              >
                <CardContent className="p-3">
                  <div className="doc-thumbnail aspect-[3/4] mb-3 relative">
                    {doc.is_starred && (
                      <div className="absolute top-2 right-2 z-10">
                        <Star className="w-4 h-4 fill-[var(--accent-warning)] text-[var(--accent-warning)]" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 z-10">
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {doc.file_type}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
