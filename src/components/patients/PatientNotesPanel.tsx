import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Plus,
  Clock,
  User,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  Info,
  CheckCircle,
  FileText,
} from "lucide-react";

export interface PatientNote {
  id: string;
  patientId: string;
  content: string;
  category: NoteCategory;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  updatedAt?: string;
  isPinned?: boolean;
}

type NoteCategory = "general" | "clinical" | "medication" | "follow-up" | "alert";

interface PatientNotesPanelProps {
  patientId: string;
  notes: PatientNote[];
  onAddNote: (note: Omit<PatientNote, "id" | "createdAt" | "createdBy" | "createdByName">) => Promise<void>;
  onUpdateNote: (id: string, updates: Partial<PatientNote>) => Promise<void>;
  onDeleteNote: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const CATEGORY_CONFIG: Record<NoteCategory, { label: string; icon: typeof Info; color: string }> = {
  general: { label: "General", icon: FileText, color: "text-gray-500 bg-gray-500/10" },
  clinical: { label: "Clinical", icon: Info, color: "text-blue-500 bg-blue-500/10" },
  medication: { label: "Medication", icon: CheckCircle, color: "text-green-500 bg-green-500/10" },
  "follow-up": { label: "Follow-up", icon: Clock, color: "text-amber-500 bg-amber-500/10" },
  alert: { label: "Alert", icon: AlertTriangle, color: "text-red-500 bg-red-500/10" },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function PatientNotesPanel({
  patientId,
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  isLoading = false,
}: PatientNotesPanelProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState<NoteCategory>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<NoteCategory | "all">("all");

  // Sort notes by creation date (most recent first), with pinned notes at top
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Filter notes by category
  const filteredNotes = categoryFilter === "all"
    ? sortedNotes
    : sortedNotes.filter((note) => note.category === categoryFilter);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddNote({
        patientId,
        content: newNoteContent.trim(),
        category: newNoteCategory,
      });
      setNewNoteContent("");
      setNewNoteCategory("general");
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditNote = async () => {
    if (!editingNote || !newNoteContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdateNote(editingNote.id, {
        content: newNoteContent.trim(),
        category: newNoteCategory,
      });
      setEditingNote(null);
      setNewNoteContent("");
      setNewNoteCategory("general");
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Failed to update note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await onDeleteNote(noteId);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleTogglePin = async (note: PatientNote) => {
    try {
      await onUpdateNote(note.id, { isPinned: !note.isPinned });
    } catch (error) {
      console.error("Failed to pin note:", error);
    }
  };

  const openEditDialog = (note: PatientNote) => {
    setEditingNote(note);
    setNewNoteContent(note.content);
    setNewNoteCategory(note.category);
    setIsEditDialogOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notes & Comments
            </CardTitle>
            <CardDescription>
              {notes.length} note{notes.length !== 1 ? "s" : ""} for this patient
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Note</DialogTitle>
                <DialogDescription>
                  Add a note or comment about this patient's care.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newNoteCategory}
                    onValueChange={(value) => setNewNoteCategory(value as NoteCategory)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                        const Icon = config.icon;
                        return (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${config.color.split(" ")[0]}`} />
                              {config.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Note Content</label>
                  <Textarea
                    placeholder="Enter your note..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNote}
                  disabled={!newNoteContent.trim() || isSubmitting}
                >
                  {isSubmitting ? "Adding..." : "Add Note"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge
            variant={categoryFilter === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </Badge>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <Badge
              key={key}
              variant={categoryFilter === key ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategoryFilter(key as NoteCategory)}
            >
              {config.label}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading notes...
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="py-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {notes.length === 0
                ? "No notes yet. Add your first note to track patient information."
                : "No notes match the selected filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {filteredNotes.map((note) => {
              const categoryConfig = CATEGORY_CONFIG[note.category];
              const CategoryIcon = categoryConfig.icon;

              return (
                <div
                  key={note.id}
                  className={`p-4 rounded-lg border ${note.isPinned ? "border-primary/50 bg-primary/5" : "border-border"}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-full ${categoryConfig.color}`}>
                        <CategoryIcon className="h-4 w-4" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {categoryConfig.label}
                      </Badge>
                      {note.isPinned && (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                          Pinned
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTogglePin(note)}>
                          {note.isPinned ? "Unpin" : "Pin to top"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(note)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
                    {note.content}
                  </p>

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{note.createdByName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatRelativeTime(note.createdAt)}</span>
                    </div>
                    {note.updatedAt && (
                      <span className="italic">(edited)</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Update this note's content or category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={newNoteCategory}
                onValueChange={(value) => setNewNoteCategory(value as NoteCategory)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color.split(" ")[0]}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Note Content</label>
              <Textarea
                placeholder="Enter your note..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="min-h-[150px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingNote(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditNote}
              disabled={!newNoteContent.trim() || isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
