'use client';

/**
 * Admin Notes Component
 *
 * Reusable component for displaying and managing admin notes on any entity.
 * Can be embedded in agency, candidate, job, or application detail pages.
 *
 * Features:
 * - View all notes for an entity
 * - Add new notes
 * - Edit own notes
 * - Delete own notes (or any notes if super admin)
 * - Chronological timeline display
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  Send,
  X,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';

interface AdminNote {
  id: string;
  note: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
  admin: {
    id: string;
    name: string;
    email: string | null;
    avatar: string | null;
  };
}

interface AdminNotesProps {
  entityType: 'agency' | 'candidate' | 'job' | 'application' | 'offer' | 'counter_offer' | 'onboarding_task';
  entityId: string;
  entityName?: string;
}

export function AdminNotes({ entityType, entityId, entityName }: AdminNotesProps) {
  const supabase = createClient();

  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
    getCurrentUser();
  }, [entityType, entityId]);

  const getCurrentUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setCurrentUserId(session?.user?.id || null);
  };

  const fetchNotes = async () => {
    try {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(
        `/api/admin/notes?entityType=${entityType}&entityId=${entityId}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          entityType,
          entityId,
          note: newNote,
          isInternal: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add note');
      }

      const data = await response.json();
      setNotes([data.note, ...notes]);
      setNewNote('');
      setIsAdding(false);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note');
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`/api/admin/notes/${noteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          note: editingNoteText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update note');
      }

      const data = await response.json();
      setNotes(notes.map((n) => (n.id === noteId ? data.note : n)));
      setEditingNoteId(null);
      setEditingNoteText('');
    } catch (error) {
      console.error('Error updating note:', error);
      alert('Failed to update note');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) return;

      const response = await fetch(`/api/admin/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Admin Notes</h3>
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
            {notes.length}
          </Badge>
        </div>
        {!isAdding && (
          <Button
            size="sm"
            onClick={() => setIsAdding(true)}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        )}
      </div>

      {/* Add Note Form */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-white/5 border border-cyan-500/30 rounded-lg p-4">
              <p className="text-sm text-white/70 mb-2">New Internal Note</p>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this entity..."
                className="
                  w-full mb-3
                  bg-white/5 border-white/10
                  text-white placeholder:text-white/50
                  focus:border-cyan-500/30
                  min-h-[100px]
                "
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!newNote.trim()}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Save Note
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setNewNote('');
                  }}
                  className="text-white/70 hover:text-white"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Timeline */}
      <div className="space-y-4">
        {notes.map((note) => {
          const isEditing = editingNoteId === note.id;
          const canEdit = note.admin.id === currentUserId;

          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <Avatar className="w-8 h-8 border-2 border-white/20 flex-shrink-0">
                  <AvatarImage src={note.admin.avatar || undefined} />
                  <AvatarFallback className="bg-cyan-500/20 text-cyan-400 text-xs">
                    {note.admin.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {note.admin.name}
                      </p>
                      <p className="text-xs text-white/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(note.createdAt)}
                        {note.createdAt !== note.updatedAt && (
                          <span>(edited)</span>
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    {canEdit && !isEditing && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingNoteText(note.note);
                          }}
                          className="text-white/70 hover:text-white p-2 h-auto"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-400 hover:text-red-300 p-2 h-auto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Note Text */}
                  {isEditing ? (
                    <div>
                      <Textarea
                        value={editingNoteText}
                        onChange={(e) => setEditingNoteText(e.target.value)}
                        className="
                          w-full mb-2
                          bg-white/5 border-white/10
                          text-white
                          focus:border-cyan-500/30
                          min-h-[80px]
                        "
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdateNote(note.id)}
                          disabled={!editingNoteText.trim()}
                          className="bg-cyan-500 hover:bg-cyan-600 text-white"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditingNoteText('');
                          }}
                          className="text-white/70 hover:text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-white/90 whitespace-pre-wrap">
                      {note.note}
                    </p>
                  )}

                  {/* Internal Badge */}
                  {note.isInternal && (
                    <Badge
                      variant="outline"
                      className="mt-2 border-white/20 text-white/50 text-xs"
                    >
                      Internal Only
                    </Badge>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {notes.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <FileText className="w-10 h-10 text-white/30 mb-2" />
            <p className="text-white/70 text-sm">No notes yet</p>
            <p className="text-white/50 text-xs">
              Add a note to document important information
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
