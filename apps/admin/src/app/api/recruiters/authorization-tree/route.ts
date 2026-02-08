import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/admin';

interface RecruiterNode {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  verification_status: string;
  invited_by_recruiter_id: string | null;
  children?: RecruiterNode[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return NextResponse.json(
        { error: 'Agency ID is required' },
        { status: 400 }
      );
    }

    // Fetch all recruiters for this agency
    const { data: recruiters, error } = await supabase
      .from('agency_recruiters')
      .select(`
        id,
        first_name,
        last_name,
        email,
        role,
        verification_status,
        invited_by_recruiter_id
      `)
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching recruiters:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recruiters' },
        { status: 500 }
      );
    }

    if (!recruiters || recruiters.length === 0) {
      return NextResponse.json({ tree: [] });
    }

    // Transform to node structure
    const nodes: Map<string, RecruiterNode> = new Map();

    recruiters.forEach((recruiter) => {
      nodes.set(recruiter.id, {
        id: recruiter.id,
        first_name: recruiter.first_name,
        last_name: recruiter.last_name,
        email: recruiter.email,
        role: recruiter.role,
        verification_status: recruiter.verification_status,
        invited_by_recruiter_id: recruiter.invited_by_recruiter_id,
        children: [],
      });
    });

    // Build tree structure
    const rootNodes: RecruiterNode[] = [];

    nodes.forEach((node) => {
      if (node.invited_by_recruiter_id) {
        // This recruiter was invited by someone
        const parent = nodes.get(node.invited_by_recruiter_id);
        if (parent) {
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        } else {
          // Parent not found in this agency (shouldn't happen, but handle it)
          rootNodes.push(node);
        }
      } else {
        // This is a root node (authorization head)
        rootNodes.push(node);
      }
    });

    // Sort children by role (admin/owner first) and then by name
    const sortNodes = (nodes: RecruiterNode[]) => {
      nodes.sort((a, b) => {
        // Admins/Owners first
        const roleOrder = { owner: 0, admin: 1, recruiter: 2 };
        const roleA = roleOrder[a.role as keyof typeof roleOrder] ?? 3;
        const roleB = roleOrder[b.role as keyof typeof roleOrder] ?? 3;
        if (roleA !== roleB) return roleA - roleB;

        // Then by name
        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
      });

      // Recursively sort children
      nodes.forEach((node) => {
        if (node.children && node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(rootNodes);

    return NextResponse.json({ tree: rootNodes });

  } catch (error) {
    console.error('Authorization tree API error:', error);
    return NextResponse.json(
      { error: 'Failed to build authorization tree' },
      { status: 500 }
    );
  }
}
