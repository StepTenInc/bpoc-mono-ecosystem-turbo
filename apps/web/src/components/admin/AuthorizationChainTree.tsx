'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, User, Shield, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/shared/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/shared/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface RecruiterNode {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  verificationStatus: string;
  children?: RecruiterNode[];
}

interface AuthorizationChainTreeProps {
  agencyId: string;
  currentRecruiterId?: string;
}

export default function AuthorizationChainTree({
  agencyId,
  currentRecruiterId,
}: AuthorizationChainTreeProps) {
  const [treeData, setTreeData] = useState<RecruiterNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAuthorizationTree();
  }, [agencyId]);

  const fetchAuthorizationTree = async () => {
    try {
      const response = await fetch(`/api/admin/recruiters/authorization-tree?agencyId=${agencyId}`);
      const data = await response.json();

      if (response.ok) {
        setTreeData(data.tree || []);
        // Auto-expand nodes that lead to current recruiter
        if (currentRecruiterId && data.tree) {
          const nodesToExpand = findPathToNode(data.tree, currentRecruiterId);
          setExpandedNodes(new Set(nodesToExpand));
        }
      }
    } catch (error) {
      console.error('Failed to fetch authorization tree:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find path from root to target node (for auto-expanding)
  const findPathToNode = (nodes: RecruiterNode[], targetId: string, path: string[] = []): string[] => {
    for (const node of nodes) {
      const currentPath = [...path, node.id];
      if (node.id === targetId) {
        return currentPath;
      }
      if (node.children && node.children.length > 0) {
        const childPath = findPathToNode(node.children, targetId, currentPath);
        if (childPath.length > 0) return childPath;
      }
    }
    return [];
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      verified: { label: 'Verified', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
      rejected: { label: 'Rejected', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
      pending_documents: { label: 'Needs Docs', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
      pending_admin_review: { label: 'Review', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
      pending_authorization_head: { label: 'Auth Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500/20 text-gray-400' };
    return <Badge className={`${config.className} text-xs`}>{config.label}</Badge>;
  };

  const getRoleIcon = (role: string) => {
    if (role === 'owner' || role === 'admin') {
      return <Shield className="h-4 w-4 text-purple-400" />;
    }
    return <User className="h-4 w-4 text-cyan-400" />;
  };

  const renderNode = (node: RecruiterNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isCurrent = node.id === currentRecruiterId;

    return (
      <div key={node.id} className="relative">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: depth * 0.05 }}
          className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
            isCurrent
              ? 'bg-cyan-500/10 border-cyan-500/30 shadow-lg shadow-cyan-500/20'
              : 'bg-white/5 border-white/10 hover:bg-white/10'
          }`}
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-400" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Node Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            node.role === 'owner' || node.role === 'admin'
              ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
              : 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20'
          }`}>
            {getRoleIcon(node.role)}
          </div>

          {/* Node Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/recruiters/${node.id}`}
                className="text-white font-medium hover:text-cyan-400 transition-colors truncate"
              >
                {node.firstName} {node.lastName}
              </Link>
              {isCurrent && (
                <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-xs">
                  Current
                </Badge>
              )}
            </div>
            <p className="text-gray-400 text-xs truncate">{node.email}</p>
          </div>

          {/* Role & Status */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/5 text-gray-400 border-white/10 text-xs capitalize">
              {node.role}
            </Badge>
            {getStatusBadge(node.verificationStatus)}
          </div>

          {/* Children Count */}
          {hasChildren && (
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Users className="h-3 w-3" />
              {node.children!.length}
            </div>
          )}
        </motion.div>

        {/* Render Children */}
        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 space-y-2"
            >
              {node.children!.map((child) => renderNode(child, depth + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white text-sm">Authorization Chain</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 text-cyan-400 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (treeData.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardHeader className="border-b border-white/10">
          <CardTitle className="text-white text-sm">Authorization Chain</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No authorization chain found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader className="border-b border-white/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-400" />
            Authorization Chain
          </CardTitle>
          <button
            onClick={() => {
              if (expandedNodes.size > 0) {
                setExpandedNodes(new Set());
              } else {
                // Expand all
                const allIds = new Set<string>();
                const collectIds = (nodes: RecruiterNode[]) => {
                  nodes.forEach((node) => {
                    allIds.add(node.id);
                    if (node.children) collectIds(node.children);
                  });
                };
                collectIds(treeData);
                setExpandedNodes(allIds);
              }
            }}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {expandedNodes.size > 0 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-2">
          {treeData.map((node) => renderNode(node, 0))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-gray-500 text-xs mb-2">Legend:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Shield className="h-3 w-3 text-purple-400" />
              <span className="text-gray-400">Admin/Owner</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3 w-3 text-cyan-400" />
              <span className="text-gray-400">Recruiter</span>
            </div>
            <div className="flex items-center gap-2">
              <ChevronRight className="h-3 w-3 text-gray-400" />
              <span className="text-gray-400">Has invited members</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
