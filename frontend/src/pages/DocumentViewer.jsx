import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Star,
  Download,
  Share2,
  Trash2,
  FileText,
  ScanLine,
  Edit,
  Copy,
  Tag,
  Folder,
  MoreVertical,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { getDocument, updateDocument, deleteDocument, extractOCR, getTags, getFolders } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [tags, setTags] = useState([]);
  const [folders, setFolders] = useState([]);

  const fetchDocument = useCallback(async () => {
    try {
      const [doc, tagsData, foldersData] = await Promise.all([
        getDocument(id),
        getTags(),
        getFolders()
      ]);
      setDocument(doc);
      setEditName(doc.name);
      setTags(tagsData);
      setFolders(foldersData);
    } catch (error) {
      console.error('Failed to fetch document:', error);
      toast.error('Document not found');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleToggleStar = async () => {
    try {
      const updated = await updateDocument(id, { is_starred: !document.is_starred });
      setDocument(updated);
      toast.success(updated.is_starred ? 'Added to starred' : 'Removed from starred');
    } catch (error) {
      toast.error('Failed to update document');
    }
  };

  const handleExtractOCR = async () => {
    setOcrLoading(true);
    try {
      const result = await extractOCR(id);
      setDocument(prev => ({ ...prev, ocr_text: result.ocr_text }));
      toast.success('OCR text extracted successfully');
    } catch (error) {
      toast.error('Failed to extract OCR text');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleCopyOCR = () => {
    if (document?.ocr_text) {
      navigator.clipboard.writeText(document.ocr_text);
      toast.success('OCR text copied to clipboard');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument(id);
      toast.success('Document deleted');
      navigate('/documents');
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleSaveName = async () => {
    if (!editName.trim() || editName === document.name) {
      setIsEditing(false);
      return;
    }
    try {
      const updated = await updateDocument(id, { name: editName });
      setDocument(updated);
      setIsEditing(false);
      toast.success('Document renamed');
    } catch (error) {
      toast.error('Failed to rename document');
    }
  };

  const handleAddTag = async (tagName) => {
    const currentTags = document.tags || [];
    if (currentTags.includes(tagName)) {
      const newTags = currentTags.filter(t => t !== tagName);
      try {
        const updated = await updateDocument(id, { tags: newTags });
        setDocument(updated);
        toast.success('Tag removed');
      } catch (error) {
        toast.error('Failed to update tags');
      }
    } else {
      try {
        const updated = await updateDocument(id, { tags: [...currentTags, tagName] });
        setDocument(updated);
        toast.success('Tag added');
      } catch (error) {
        toast.error('Failed to update tags');
      }
    }
  };

  const handleMoveToFolder = async (folderId) => {
    try {
      const updated = await updateDocument(id, { folder_id: folderId });
      setDocument(updated);
      toast.success(folderId ? 'Moved to folder' : 'Removed from folder');
    } catch (error) {
      toast.error('Failed to move document');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

  if (!document) return null;

  const currentFolder = folders.find(f => f.id === document.folder_id);

  return (
    <div className="min-h-[calc(100vh-56px)] lg:min-h-screen bg-[var(--surface-main)]">
      {/* Header */}
      <header className="proscan-header h-14 md:h-16 flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/documents')}
            data-testid="back-btn"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="h-8 w-48 md:w-64"
                autoFocus
                data-testid="edit-name-input"
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName}>
                <Check className="w-4 h-4 text-green-600" strokeWidth={1.5} />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { setIsEditing(false); setEditName(document.name); }}>
                <X className="w-4 h-4 text-red-600" strokeWidth={1.5} />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-base md:text-lg font-semibold font-['Cabinet_Grotesk'] truncate">
                {document.name}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={() => setIsEditing(true)}
                data-testid="edit-name-btn"
              >
                <Edit className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleStar}
            data-testid="star-doc-btn"
          >
            <Star 
              className={cn(
                "w-5 h-5",
                document.is_starred 
                  ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]" 
                  : "text-[var(--text-secondary)]"
              )} 
              strokeWidth={1.5}
            />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="doc-actions-menu">
                <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Share
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-[var(--accent-destructive)]"
              >
                <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="viewer-container">
        {/* Document Preview */}
        <div className="bg-white border-r border-[var(--border-subtle)] p-6 md:p-8 overflow-auto">
          <div className="max-w-2xl mx-auto">
            <div className="doc-thumbnail aspect-[3/4] w-full max-w-md mx-auto mb-6 shadow-lg">
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-24 h-24 text-[var(--text-secondary)]" strokeWidth={1} />
              </div>
            </div>

            <div className="text-center">
              <Badge variant="secondary" className="text-xs uppercase">
                {document.file_type}
              </Badge>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Document preview placeholder
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Actual document rendering would require file storage integration
              </p>
            </div>
          </div>
        </div>

        {/* Details & OCR Panel */}
        <div className="bg-white p-4 md:p-6 overflow-auto">
          <Tabs defaultValue="details" className="h-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="details" data-testid="details-tab">Details</TabsTrigger>
              <TabsTrigger value="ocr" data-testid="ocr-tab">OCR Text</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-0 space-y-6">
              {/* Document Info */}
              <Card className="proscan-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium font-['Cabinet_Grotesk']">
                    Document Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">File Type</span>
                    <span className="font-medium uppercase">{document.file_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Size</span>
                    <span className="font-medium">{formatFileSize(document.size)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Pages</span>
                    <span className="font-medium">{document.page_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Created</span>
                    <span className="font-medium">{format(new Date(document.created_at), 'PPp')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Modified</span>
                    <span className="font-medium">{format(new Date(document.updated_at), 'PPp')}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Folder */}
              <Card className="proscan-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium font-['Cabinet_Grotesk'] flex items-center gap-2">
                    <Folder className="w-4 h-4" strokeWidth={1.5} />
                    Folder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-start" data-testid="folder-select">
                        <Folder className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        {currentFolder ? currentFolder.name : 'No folder'}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuItem onClick={() => handleMoveToFolder(null)}>
                        <X className="w-4 h-4 mr-2" strokeWidth={1.5} />
                        No folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {folders.map((folder) => (
                        <DropdownMenuItem 
                          key={folder.id}
                          onClick={() => handleMoveToFolder(folder.id)}
                        >
                          <Folder className="w-4 h-4 mr-2" strokeWidth={1.5} style={{ color: folder.color }} />
                          {folder.name}
                          {document.folder_id === folder.id && (
                            <Check className="w-4 h-4 ml-auto" strokeWidth={1.5} />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>

              {/* Tags */}
              <Card className="proscan-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium font-['Cabinet_Grotesk'] flex items-center gap-2">
                    <Tag className="w-4 h-4" strokeWidth={1.5} />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={document.tags?.includes(tag.name) ? "default" : "secondary"}
                        className="cursor-pointer"
                        onClick={() => handleAddTag(tag.name)}
                        data-testid={`tag-toggle-${tag.id}`}
                      >
                        {document.tags?.includes(tag.name) && (
                          <Check className="w-3 h-3 mr-1" strokeWidth={1.5} />
                        )}
                        {tag.name}
                      </Badge>
                    ))}
                    {tags.length === 0 && (
                      <p className="text-sm text-[var(--text-secondary)]">
                        No tags available. Create tags from the Documents page.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ocr" className="mt-0 space-y-4">
              {/* OCR Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={handleExtractOCR}
                  disabled={ocrLoading}
                  className="proscan-btn-primary flex-1"
                  data-testid="extract-ocr-btn"
                >
                  {ocrLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.5} />
                  ) : (
                    <ScanLine className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  )}
                  {ocrLoading ? 'Extracting...' : 'Extract OCR'}
                </Button>
                {document.ocr_text && (
                  <Button
                    variant="outline"
                    onClick={handleCopyOCR}
                    data-testid="copy-ocr-btn"
                  >
                    <Copy className="w-4 h-4 mr-2" strokeWidth={1.5} />
                    Copy
                  </Button>
                )}
              </div>

              {/* OCR Text */}
              {document.ocr_text ? (
                <Card className="proscan-card">
                  <CardContent className="p-4">
                    <Textarea
                      value={document.ocr_text}
                      readOnly
                      className="min-h-[400px] font-mono text-sm resize-none border-0 focus-visible:ring-0"
                      data-testid="ocr-text-area"
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card className="proscan-card">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
                      <ScanLine className="w-8 h-8 text-[var(--text-secondary)]" strokeWidth={1.5} />
                    </div>
                    <p className="text-base font-medium text-[var(--text-primary)] mb-1">
                      No OCR text extracted
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] text-center">
                      Click "Extract OCR" to extract text from this document
                    </p>
                  </CardContent>
                </Card>
              )}

              <p className="text-xs text-[var(--text-secondary)] text-center">
                Note: OCR extraction is currently mocked for demonstration purposes
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-['Cabinet_Grotesk']">Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[var(--accent-destructive)] hover:bg-red-600"
              data-testid="confirm-delete-btn"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
