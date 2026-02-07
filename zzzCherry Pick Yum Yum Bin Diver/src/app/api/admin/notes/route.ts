/**
 * Admin Notes API
 *
 * Allows admins to add, view, and manage internal notes on any entity.
 * Notes can be used to document decisions, track issues, or share knowledge.
 *
 * GET    /api/admin/notes?entityType=agency&entityId=123  - Get notes for an entity
 * POST   /api/admin/notes                                  - Create a new note
 * PUT    /api/admin/notes/[id]                            - Update a note
 * DELETE /api/admin/notes/[id]                            - Delete a note
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserFromRequest } from '@/lib/supabase/auth';
import { logAdminAction, isAdmin, getAdminUser, ADMIN_ACTIONS } from '@/lib/admin-audit';


// GET - Fetch notes for an entity
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);

    // 2. Check if user is admin
    const adminCheck = await isAdmin(user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. Get query parameters
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const adminId = searchParams.get('adminId');

    // 4. Fetch notes with Supabase
    let query = supabase
      .from('admin_notes')
      .select(`
        id,
        entity_type,
        entity_id,
        note,
        is_internal,
        created_at,
        updated_at,
        admin_id,
        admin_name,
        candidates!admin_notes_admin_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (entityType) query = query.eq('entity_type', entityType);
    if (entityId) query = query.eq('entity_id', entityId);
    if (adminId) query = query.eq('admin_id', adminId);

    const { data: notes, error } = await query;

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    // 5. Format response
    const formattedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      entityType: note.entity_type,
      entityId: note.entity_id,
      note: note.note,
      isInternal: note.is_internal,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
      admin: note.candidates ? {
        id: note.candidates.id,
        name: `${note.candidates.first_name} ${note.candidates.last_name}`,
        email: note.candidates.email,
        avatar: note.candidates.avatar_url,
      } : {
        id: note.admin_id,
        name: note.admin_name,
        email: null,
        avatar: null,
      },
    }));

    return NextResponse.json({ notes: formattedNotes });
  } catch (error) {
    console.error('Error fetching admin notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

// POST - Create a new note
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const user = await getUserFromRequest(request);

    // 2. Check if user is admin
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 3. Parse request body
    const body = await request.json();
    const { entityType, entityId, note, isInternal = true } = body;

    // Validate required fields
    if (!entityType || !entityId || !note) {
      return NextResponse.json(
        { error: 'Missing required fields: entityType, entityId, note' },
        { status: 400 }
      );
    }

    // 4. Create note with Supabase
    const { data: newNote, error } = await supabase
      .from('admin_notes')
      .insert({
        admin_id: user.id,
        admin_name: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
        entity_type: entityType,
        entity_id: entityId,
        note,
        is_internal: isInternal,
      })
      .select(`
        id,
        entity_type,
        entity_id,
        note,
        is_internal,
        created_at,
        updated_at,
        admin_id,
        candidates!admin_notes_admin_id_fkey (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    // 5. Log action to audit trail
    await logAdminAction({
      adminId: user.id,
      adminName: `${adminUser.user.first_name} ${adminUser.user.last_name}`,
      adminEmail: adminUser.user.email || undefined,
      action: ADMIN_ACTIONS.ADD_ADMIN_NOTE,
      entityType: entityType as any,
      entityId,
      details: {
        noteId: newNote.id,
        notePreview: note.substring(0, 100),
        isInternal,
      },
    });

    // 6. Format response
    const formattedNote = {
      id: newNote.id,
      entityType: newNote.entity_type,
      entityId: newNote.entity_id,
      note: newNote.note,
      isInternal: newNote.is_internal,
      createdAt: newNote.created_at,
      updatedAt: newNote.updated_at,
      admin: newNote.candidates ? {
        id: newNote.candidates.id,
        name: `${newNote.candidates.first_name} ${newNote.candidates.last_name}`,
        email: newNote.candidates.email,
        avatar: newNote.candidates.avatar_url,
      } : null,
    };

    return NextResponse.json({ note: formattedNote }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin note:', error);
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
