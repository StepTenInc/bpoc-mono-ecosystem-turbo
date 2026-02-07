/**
 * Admin Notes API - Individual Note Operations
 *
 * PUT    /api/admin/notes/[id]  - Update a note
 * DELETE /api/admin/notes/[id]  - Delete a note
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { logAdminAction, getAdminUser, ADMIN_ACTIONS } from '@/lib/admin-audit';


// PUT - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);

    // 2. Check if user is admin
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. Get note to verify it exists and user owns it
    const { data: existingNote, error: noteError } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (noteError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only allow updating own notes (unless super admin)
    const isSuperAdmin = adminUser.role === 'super_admin';
    if (existingNote.admin_id !== user.id && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'You can only edit your own notes' },
        { status: 403 }
      );
    }

    // 4. Parse request body
    const body = await request.json();
    const { note, isInternal } = body;

    if (!note) {
      return NextResponse.json(
        { error: 'Missing required field: note' },
        { status: 400 }
      );
    }

    // 5. Update note
    const { data: updatedNote, error: updateError } = await supabase
      .from('admin_notes')
      .update({
        note,
        is_internal: isInternal !== undefined ? isInternal : existingNote.is_internal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select(`
        *,
        candidates!admin_notes_admin_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating note:', updateError);
      return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
    }

    // 6. Log action to audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
      adminEmail: adminUser.user.email || undefined,
      action: ADMIN_ACTIONS.UPDATE_ADMIN_NOTE,
      entityType: existingNote.entity_type as any,
      entityId: existingNote.entity_id,
      details: {
        noteId: params.id,
        previousNote: existingNote.note.substring(0, 100),
        newNote: note.substring(0, 100),
      },
    });

    // 7. Format response
    const formattedNote = {
      id: updatedNote.id,
      entityType: updatedNote.entity_type,
      entityId: updatedNote.entity_id,
      note: updatedNote.note,
      isInternal: updatedNote.is_internal,
      createdAt: updatedNote.created_at,
      updatedAt: updatedNote.updated_at,
      admin: updatedNote.candidates ? {
        id: updatedNote.candidates.id,
        name: `${updatedNote.candidates.first_name} ${updatedNote.candidates.last_name}`,
        email: updatedNote.candidates.email,
        avatar: updatedNote.candidates.avatar_url,
      } : null,
    };

    return NextResponse.json({ note: formattedNote });
  } catch (error) {
    console.error('Error updating admin note:', error);
    return NextResponse.json(
      { error: 'Failed to update note' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);

    // 2. Check if user is admin
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. Get note to verify it exists and user owns it
    const { data: existingNote, error: noteError } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('id', params.id)
      .single();

    if (noteError || !existingNote) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Only allow deleting own notes (unless super admin)
    const isSuperAdmin = adminUser.role === 'super_admin';
    if (existingNote.admin_id !== user.id && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'You can only delete your own notes' },
        { status: 403 }
      );
    }

    // 4. Delete note
    const { error: deleteError } = await supabase
      .from('admin_notes')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting note:', deleteError);
      return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
    }

    // 5. Log action to audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
      adminEmail: adminUser.user.email || undefined,
      action: ADMIN_ACTIONS.DELETE_ADMIN_NOTE,
      entityType: existingNote.entity_type as any,
      entityId: existingNote.entity_id,
      details: {
        noteId: params.id,
        deletedNote: existingNote.note.substring(0, 100),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}
