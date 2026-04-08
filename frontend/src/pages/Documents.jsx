import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Folder, 
  Tag, 
  Search, 
  Plus, 
  Star,
  MoreVertical,
  Trash2,
  Edit,
  Upload,
  Grid,
  List,
  Filter,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  getDocuments, 
  getFolders, 
  getTags, 
  createDocument,
  createFolder,
  createTag,
  deleteDocument,
  deleteFolder,
  updateDocument
} from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [showStarred, setShowStarred] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  
  // Dialog states
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newTagOpen, setNewTagOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = {};
      if (selectedFolder) params.folder_id = selectedFolder;
      if (selectedTag) params.tag = selectedTag;
      if (searchQuery) params.search = searchQuery;
      if (showStarred) params.starred = true;

      const [docsData, foldersData, tagsData] = await Promise.all([
        getDocuments(params),
        getFolders(),
        getTags()
      ]);
      setDocuments(docsData);
      setFolders(foldersData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [selectedFolder, selectedTag, searchQuery, showStarred]);

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
      for (const file of files) {
        await handleFileUpload(file);
      }
    }
  };

  const handleFileUpload = async (file) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(`${file.name}: Please upload a PDF or image file`);
      return;
    }

    try {
      const fileType = file.type.includes('pdf') ? 'pdf' : file.type.split('/')[1];
      await createDocument({
        name: file.name,
        file_type: fileType,
        size: file.size,
        folder_id: selectedFolder,
        page_count: 1
      });
      toast.success(`${file.name} uploaded successfully`);
      fetchData();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(`Failed to upload ${file.name}`);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => handleFileUpload(file));
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await createFolder({ name: newFolderName });
      toast.success('Folder created');
      setNewFolderName('');
      setNewFolderOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create folder');
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      await createTag({ name: newTagName });
      toast.success('Tag created');
      setNewTagName('');
      setNewTagOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create tag');
    }
  };

  const handleDeleteDocument = async (docId, e) => {
    e.stopPropagation();
    try {
      await deleteDocument(docId);
      toast.success('Document deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete document');
    }
  };

  const handleToggleStar = async (doc, e) => {
    e.stopPropagation();
    try {
      await updateDocument(doc.id, { is_starred: !doc.is_starred });
      toast.success(doc.is_starred ? 'Removed from starred' : 'Added to starred');
      fetchData();
    } catch (error) {
      toast.error('Failed to update document');
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await deleteFolder(folderId);
      toast.success('Folder deleted');
      if (selectedFolder === folderId) {
        setSelectedFolder(null);
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to delete folder');
    }
  };

  const clearFilters = () => {
    setSelectedFolder(null);
    setSelectedTag(null);
    setShowStarred(false);
    setSearchQuery('');
  };

  const hasActiveFilters = selectedFolder || selectedTag || showStarred || searchQuery;

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
    <div 
      className="flex min-h-[calc(100vh-56px)] lg:min-h-screen"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {/* Sidebar Filters */}
      <aside className="hidden md:block w-64 border-r border-[var(--border-subtle)] bg-[var(--surface-main)] p-4">
        <div className="space-y-6">
          {/* Folders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="proscan-label">Folders</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setNewFolderOpen(true)}
                data-testid="new-folder-btn"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedFolder(null)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                    !selectedFolder 
                      ? "bg-white text-[var(--text-primary)] border border-[var(--border-subtle)]" 
                      : "text-[var(--text-secondary)] hover:bg-white"
                  )}
                  data-testid="all-documents-filter"
                >
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  All Documents
                </button>
              </li>
              {folders.map((folder) => (
                <li key={folder.id} className="group">
                  <button
                    onClick={() => setSelectedFolder(folder.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                      selectedFolder === folder.id 
                        ? "bg-white text-[var(--text-primary)] border border-[var(--border-subtle)]" 
                        : "text-[var(--text-secondary)] hover:bg-white"
                    )}
                    data-testid={`folder-${folder.id}`}
                  >
                    <Folder className="w-4 h-4" strokeWidth={1.5} style={{ color: folder.color }} />
                    <span className="flex-1 text-left truncate">{folder.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-[var(--text-secondary)]" strokeWidth={1.5} />
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="proscan-label">Tags</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setNewTagOpen(true)}
                data-testid="new-tag-btn"
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant={selectedTag === tag.name ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                  data-testid={`tag-${tag.id}`}
                >
                  <Tag className="w-3 h-3 mr-1" strokeWidth={1.5} />
                  {tag.name}
                </Badge>
              ))}
              {tags.length === 0 && (
                <p className="text-xs text-[var(--text-secondary)]">No tags yet</p>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <span className="proscan-label block mb-3">Quick Filters</span>
            <button
              onClick={() => setShowStarred(!showStarred)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors",
                showStarred 
                  ? "bg-white text-[var(--text-primary)] border border-[var(--border-subtle)]" 
                  : "text-[var(--text-secondary)] hover:bg-white"
              )}
              data-testid="starred-filter"
            >
              <Star className={cn("w-4 h-4", showStarred && "fill-[var(--accent-warning)] text-[var(--accent-warning)]")} strokeWidth={1.5} />
              Starred
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-['Cabinet_Grotesk'] text-[var(--text-primary)]">
              Documents
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
                  className="ml-2 text-[var(--accent-primary)] hover:underline"
                  data-testid="clear-filters"
                >
                  Clear filters
                </button>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-[var(--border-subtle)]"
                data-testid="search-input"
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-[var(--border-subtle)]">
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 rounded-none", viewMode === 'grid' && "bg-[var(--surface-secondary)]")}
                onClick={() => setViewMode('grid')}
                data-testid="grid-view-btn"
              >
                <Grid className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-9 w-9 rounded-none", viewMode === 'list' && "bg-[var(--surface-secondary)]")}
                onClick={() => setViewMode('list')}
                data-testid="list-view-btn"
              >
                <List className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>

            {/* Upload Button */}
            <Button
              className="proscan-btn-primary"
              onClick={() => document.getElementById('doc-file-upload').click()}
              data-testid="upload-btn"
            >
              <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
              Upload
            </Button>
            <input
              id="doc-file-upload"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>

        {/* Drop Zone Overlay */}
        {dragActive && (
          <div className="fixed inset-0 bg-[var(--accent-primary)]/10 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-white border-2 border-dashed border-[var(--accent-primary)] p-12 text-center">
              <Upload className="w-16 h-16 text-[var(--accent-primary)] mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-xl font-semibold">Drop files here</p>
            </div>
          </div>
        )}

        {/* Documents Grid/List */}
        {documents.length === 0 ? (
          <Card className="proscan-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 bg-[var(--surface-secondary)] flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-[var(--text-secondary)]" strokeWidth={1.5} />
              </div>
              <p className="text-lg font-medium text-[var(--text-primary)] mb-1">
                No documents found
              </p>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Upload your first document to get started'}
              </p>
              {!hasActiveFilters && (
                <Button
                  onClick={() => document.getElementById('doc-file-upload').click()}
                  className="proscan-btn-primary"
                  data-testid="empty-upload-btn"
                >
                  <Plus className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  Upload Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {documents.map((doc, index) => (
              <Card 
                key={doc.id}
                className={`proscan-card cursor-pointer animate-stagger stagger-${(index % 6) + 1}`}
                onClick={() => navigate(`/documents/${doc.id}`)}
                data-testid={`doc-card-${doc.id}`}
              >
                <CardContent className="p-3">
                  <div className="doc-thumbnail aspect-[3/4] mb-3 relative">
                    <button
                      onClick={(e) => handleToggleStar(doc, e)}
                      className="absolute top-2 left-2 z-10"
                      data-testid={`star-btn-${doc.id}`}
                    >
                      <Star 
                        className={cn(
                          "w-4 h-4 transition-colors",
                          doc.is_starred 
                            ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]" 
                            : "text-[var(--text-secondary)] hover:text-[var(--accent-warning)]"
                        )} 
                        strokeWidth={1.5}
                      />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="absolute top-2 right-2 z-10 p-1 hover:bg-white/80 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`doc-menu-${doc.id}`}
                        >
                          <MoreVertical className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}>
                          <Edit className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          View / Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="text-[var(--accent-destructive)]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
        ) : (
          <div className="space-y-2">
            {documents.map((doc, index) => (
              <Card 
                key={doc.id}
                className={`proscan-card cursor-pointer animate-stagger stagger-${(index % 6) + 1}`}
                onClick={() => navigate(`/documents/${doc.id}`)}
                data-testid={`doc-row-${doc.id}`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="doc-thumbnail w-12 h-16 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] uppercase">
                        {doc.file_type}
                      </Badge>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {doc.page_count} page{doc.page_count !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleToggleStar(doc, e)}
                      data-testid={`star-btn-list-${doc.id}`}
                    >
                      <Star 
                        className={cn(
                          "w-5 h-5 transition-colors",
                          doc.is_starred 
                            ? "fill-[var(--accent-warning)] text-[var(--accent-warning)]" 
                            : "text-[var(--text-secondary)] hover:text-[var(--accent-warning)]"
                        )} 
                        strokeWidth={1.5}
                      />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}>
                          <Edit className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          View / Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteDocument(doc.id, e)}
                          className="text-[var(--accent-destructive)]"
                        >
                          <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* New Folder Dialog */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Cabinet_Grotesk']">Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="mt-2"
              data-testid="folder-name-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="proscan-btn-primary" 
              onClick={handleCreateFolder}
              data-testid="create-folder-submit"
            >
              Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Tag Dialog */}
      <Dialog open={newTagOpen} onOpenChange={setNewTagOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-['Cabinet_Grotesk']">Create New Tag</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="tag-name">Tag Name</Label>
            <Input
              id="tag-name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Enter tag name"
              className="mt-2"
              data-testid="tag-name-input"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTagOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="proscan-btn-primary" 
              onClick={handleCreateTag}
              data-testid="create-tag-submit"
            >
              Create Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
