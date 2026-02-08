'use client';

import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Handle,
  Position,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/shared/ui/card';
import { Badge } from '@/components/shared/ui/badge';
import { Button } from '@/components/shared/ui/button';
import { RefreshCw, ZoomIn, Info, Loader2, FileText, Crown, Layers, Plus, Pencil, ExternalLink, AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

// Types
interface Silo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  pillar_post_id: string | null;
  article_count?: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  silo_id: string | null;
  is_published: boolean;
  is_pillar: boolean;
}

// Main Pillar Node (BPOC Intelligence)
const MainPillarNode = ({ data }: any) => {
  return (
    <div className="group relative">
      <div className="px-8 py-5 rounded-2xl border-2 shadow-2xl w-[240px] text-center transition-all duration-300 bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 border-purple-400 shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105">
        <Handle type="source" position={Position.Bottom} className="!bg-purple-400 !w-4 !h-4 !-bottom-2" />

        <div className="flex items-center justify-center gap-2 mb-3">
          <Crown className="w-7 h-7 text-yellow-400" />
          <Badge className="bg-yellow-500 text-black font-bold text-xs px-3 py-1">MAIN PILLAR</Badge>
        </div>

        <div className="font-bold text-white text-xl leading-tight">
          {data.label}
        </div>
        <div className="text-purple-300 text-sm mt-2 font-medium">
          {data.siloCount} Silos • {data.articleCount} Articles
        </div>
      </div>
    </div>
  );
};

// Silo Node (Category/Topic Cluster) - Redesigned
const SiloNode = ({ data }: any) => {
  const [isCreatingPillar, setIsCreatingPillar] = useState(false);
  const color = data.color || '#3B82F6';
  const pillar = data.pillarPost;

  return (
    <div className="group relative">
      <div
        className="px-5 py-4 rounded-2xl border-2 shadow-xl w-[200px] text-center transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}`,
          boxShadow: `0 8px 32px ${color}40`
        }}
      >
        <Handle type="target" position={Position.Top} className="!w-3 !h-3 !-top-1.5" style={{ backgroundColor: color }} />
        <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !-bottom-1.5" style={{ backgroundColor: color }} />

        {/* Silo Header */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Layers className="w-5 h-5" style={{ color }} />
          <Badge
            className="text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider"
            style={{ backgroundColor: color, color: '#000' }}
          >
            SILO
          </Badge>
        </div>

        {/* Silo Name */}
        <div className="font-bold text-white text-base leading-tight mb-3">
          {data.label}
        </div>

        {/* Pillar Post Section */}
        {pillar ? (
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600/30 to-purple-900/30 border border-purple-400/50 mb-3">
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-[10px] text-purple-200 font-bold uppercase tracking-wide">Pillar Post</span>
            </div>
            <div className="text-[11px] text-white font-semibold line-clamp-2 leading-tight">
              {pillar.title}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-gray-800/30 border-2 border-dashed border-gray-600/50 mb-3">
            <div className="text-[11px] text-gray-500 font-medium">No pillar post yet</div>
          </div>
        )}

        {/* Article Count */}
        <div className="text-xs font-semibold mb-3" style={{ color }}>
          {data.articleCount} {data.articleCount === 1 ? 'Article' : 'Articles'}
        </div>

        {/* Action Button */}
        {pillar && pillar.id ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onEditPillar) data.onEditPillar(pillar.id);
            }}
            className="w-full py-2 px-3 rounded-lg text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 bg-purple-500/30 text-purple-200 border border-purple-400/50 hover:bg-purple-500/50 hover:scale-105"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit Pillar
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onCreatePillar && !isCreatingPillar) {
                setIsCreatingPillar(true);
                // Pass all silo info including any existing pillar for validation
                data.onCreatePillar(data.siloId, data.slug, data.label, data.color, data.pillarPost);
              }
            }}
            disabled={isCreatingPillar}
            className={`w-full py-2 px-3 rounded-lg text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 bg-yellow-500/30 text-yellow-200 border border-yellow-400/50 ${isCreatingPillar ? 'opacity-70 cursor-not-allowed' : 'hover:bg-yellow-500/50 hover:scale-105'}`}
          >
            {isCreatingPillar ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )} {isCreatingPillar ? 'Creating...' : 'Create Pillar'}
          </button>
        )}
      </div>
    </div>
  );
};

// Article Node - Compact and clean
const ArticleNode = ({ data }: any) => {
  const color = data.siloColor || '#06b6d4';
  const isPillar = data.isPillar;

  return (
    <div className="group relative">
      <div
        className={`px-3 py-2.5 rounded-xl border-2 shadow-lg w-[160px] text-center transition-all duration-300 hover:scale-105 ${isPillar ? 'bg-gradient-to-br from-purple-900/80 to-purple-950/80' : 'bg-gradient-to-br from-slate-800/90 to-slate-900/90'
          }`}
        style={{ borderColor: isPillar ? '#a855f7' : `${color}60` }}
      >
        <Handle type="target" position={Position.Top} className="!w-2 !h-2 !-top-1" style={{ backgroundColor: color }} />

        {/* Status badges */}
        <div className="flex items-center justify-center gap-1.5 mb-1.5">
          {isPillar ? (
            <>
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <Badge className="bg-purple-500/40 text-purple-200 text-[8px] px-1.5 py-0.5 border-purple-400/50 font-bold">PILLAR</Badge>
            </>
          ) : (
            <FileText className="w-3.5 h-3.5" style={{ color }} />
          )}
          {!data.isPublished && !isPillar && (
            <Badge className="bg-amber-500/30 text-amber-300 text-[8px] px-1.5 py-0.5 border-amber-400/50 font-semibold">DRAFT</Badge>
          )}
          {data.isPublished && !isPillar && (
            <Badge className="bg-emerald-500/30 text-emerald-300 text-[8px] px-1.5 py-0.5 border-emerald-400/50 font-semibold">LIVE</Badge>
          )}
        </div>

        {/* Title */}
        <div className={`font-semibold text-[10px] leading-tight line-clamp-2 ${isPillar ? 'text-purple-100' : 'text-white'}`}>
          {data.label}
        </div>
      </div>

      {/* Hover Tooltip */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[220px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[100]">
        <div className={`bg-black/95 border-2 rounded-xl p-3 shadow-2xl backdrop-blur-md ${isPillar ? 'border-purple-500/50' : 'border-white/20'}`}>
          {isPillar && <div className="text-[9px] text-purple-400 font-bold mb-1 uppercase tracking-wider">Pillar Post</div>}
          <h4 className="text-xs font-bold text-white mb-2 leading-tight">{data.fullTitle}</h4>
          <div className="text-[9px] text-cyan-400 font-mono break-all bg-cyan-500/10 px-2 py-1 rounded">/insights/{data.slug}</div>
        </div>
      </div>
    </div>
  );
};

// Empty Slot Node / Add Article Button
const EmptySlotNode = ({ data }: any) => {
  const color = data.siloColor || '#6B7280';
  const label = data.label || '+ Add Article';
  const isAddButton = label.includes('Add') || label.includes('+');

  const handleClick = () => {
    if (data.onAddArticle && data.siloId && data.siloName) {
      data.onAddArticle(data.siloId, data.siloName);
    }
  };

  return (
    <div className="group relative">
      <div
        onClick={isAddButton ? handleClick : undefined}
        className={`px-3 py-2 rounded-xl border-2 border-dashed w-[140px] text-center transition-all duration-300 ${isAddButton
          ? 'opacity-70 hover:opacity-100 cursor-pointer hover:scale-105 hover:border-solid'
          : 'opacity-50'
          }`}
        style={{
          borderColor: isAddButton ? `${color}80` : `${color}60`,
          backgroundColor: isAddButton ? `${color}15` : `${color}10`
        }}
      >
        <Handle type="target" position={Position.Top} className="!bg-gray-600 !w-2 !h-2 !-top-1" />

        <div
          className={`text-[10px] font-semibold flex items-center justify-center gap-1 ${isAddButton ? 'font-bold' : ''}`}
          style={{ color }}
        >
          {isAddButton && <Plus className="w-3 h-3" />}
          {label}
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  mainPillar: MainPillarNode,
  silo: SiloNode,
  article: ArticleNode,
  emptySlot: EmptySlotNode,
};

// Modal state interface
interface ExistingPillarModal {
  isOpen: boolean;
  siloId: string;
  siloSlug: string;
  siloName: string;
  siloColor: string;
  existingPillar: {
    id: string;
    title: string;
  } | null;
}

export default function SiloVisualization() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ silos: 0, articles: 0, published: 0 });
  const [existingPillarModal, setExistingPillarModal] = useState<ExistingPillarModal>({
    isOpen: false,
    siloId: '',
    siloSlug: '',
    siloName: '',
    siloColor: '',
    existingPillar: null,
  });
  const router = useRouter();

  const handleAddArticle = useCallback((siloId: string, siloName: string) => {
    const params = new URLSearchParams({ siloId, siloName });
    router.push(`/admin/insights/create?${params.toString()}`);
  }, [router]);

  // Check if silo has existing pillar before creating (with fresh database check)
  const handleCreatePillar = useCallback(async (siloId: string, siloSlug: string, siloName?: string, siloColor?: string, cachedPillar?: { id: string; title: string } | null) => {
    // If UI already shows there's a pillar, use that
    if (cachedPillar) {
      setExistingPillarModal({
        isOpen: true,
        siloId,
        siloSlug,
        siloName: siloName || siloSlug,
        siloColor: siloColor || '#3B82F6',
        existingPillar: cachedPillar,
      });
      return;
    }

    // Fresh database check for race conditions (another user may have created a pillar)
    try {
      const { data: freshCheck } = await supabase
        .from('insights_posts')
        .select('id, title')
        .eq('silo_id', siloId)
        .eq('is_pillar', true)
        .single();

      if (freshCheck) {
        // Pillar was created by someone else, show modal
        setExistingPillarModal({
          isOpen: true,
          siloId,
          siloSlug,
          siloName: siloName || siloSlug,
          siloColor: siloColor || '#3B82F6',
          existingPillar: { id: freshCheck.id, title: freshCheck.title },
        });
        return;
      }
    } catch {
      // No pillar found (expected case), proceed to create
    }

    // No existing pillar, proceed to create
    router.push(`/admin/insights/create?siloId=${siloId}&silo=${siloSlug}&pillar=true`);
  }, [router]);

  const handleEditPillar = useCallback((pillarId: string) => {
    router.push(`/admin/insights/${pillarId}`);
  }, [router]);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const { data: silos } = await supabase
        .from('insights_silos')
        .select('id, name, slug, description, icon, color, pillar_post_id')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      const { data: articles } = await supabase
        .from('insights_posts')
        .select('id, title, slug, silo_id, is_published, is_pillar')
        .order('created_at', { ascending: false });

      if (!silos) {
        setLoading(false);
        return;
      }

      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];

      const publishedArticles = articles?.filter(a => a.is_published) || [];
      const orphanedArticles = articles?.filter(a => !a.silo_id) || [];

      setStats({
        silos: silos.length,
        articles: articles?.length || 0,
        published: publishedArticles.length
      });

      // ========================================
      // IMPROVED LAYOUT CONFIGURATION
      // ========================================
      const SILO_WIDTH = 200;
      const SILO_SPACING = 280; // Spacing between silos
      const ARTICLE_HEIGHT = 80;
      const ARTICLE_SPACING_X = 180; // Horizontal spacing for articles
      const MAX_ARTICLES_PER_ROW = 3; // Articles per row under each silo

      const totalSilos = silos.length + (orphanedArticles.length > 0 ? 1 : 0);
      const startX = 100; // Left padding for silos

      // Main Pillar at TOP CENTER - centered above the 8 silos only
      const mainPillarWidth = 240;
      // Calculate center based on the 8 silos, not including orphaned articles
      const silosOnlyWidth = silos.length * SILO_SPACING;
      const mainPillarX = startX + (silosOnlyWidth / 2) - (mainPillarWidth / 2);
      const mainPillarY = 50; // Top position for main pillar

      newNodes.push({
        id: 'main-pillar',
        type: 'mainPillar',
        data: {
          label: 'BPOC Intelligence',
          siloCount: silos.length,
          articleCount: publishedArticles.length
        },
        position: { x: mainPillarX, y: mainPillarY },
        draggable: true,
      });

      // ========================================
      // SILOS - Arranged horizontally below the main pillar
      // All silos at same Y position for leveled connection lines
      // ========================================
      const siloY = 220; // Fixed Y position for all silos to ensure leveled lines

      silos.forEach((silo, index) => {
        const siloArticles = articles?.filter(a => a.silo_id === silo.id) || [];
        // Silos arranged horizontally from left to right
        const siloX = startX + (index * SILO_SPACING);

        const pillarPost = siloArticles.find(a => a.is_pillar || silo.pillar_post_id === a.id);
        const regularArticles = siloArticles.filter(a => !a.is_pillar && silo.pillar_post_id !== a.id);

        // Silo Node
        newNodes.push({
          id: `silo-${silo.id}`,
          type: 'silo',
          data: {
            label: silo.name,
            fullName: silo.name,
            slug: silo.slug,
            description: silo.description,
            color: silo.color,
            articleCount: regularArticles.length,
            pillarPost: pillarPost ? { id: pillarPost.id, title: pillarPost.title, slug: pillarPost.slug } : null,
            siloId: silo.id,
            onAddArticle: handleAddArticle,
            onCreatePillar: handleCreatePillar,
            onEditPillar: handleEditPillar,
          },
          position: { x: siloX, y: siloY },
          draggable: true,
        });

        // Edge: Main Pillar -> Silo
        newEdges.push({
          id: `e-main-silo-${silo.id}`,
          source: 'main-pillar',
          target: `silo-${silo.id}`,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: silo.color || '#a855f7',
            strokeWidth: 3,
            opacity: 0.7
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: silo.color || '#a855f7',
          },
        });

        // ========================================
        // ARTICLES - Grid layout below each silo
        // Silo node is approximately 250px tall with pillar section
        // ========================================
        const SILO_NODE_HEIGHT = 260;
        const articleStartY = siloY + SILO_NODE_HEIGHT;
        const maxArticlesToShow = 6;
        const displayArticles = regularArticles.slice(0, maxArticlesToShow);

        displayArticles.forEach((article, artIndex) => {
          const row = Math.floor(artIndex / MAX_ARTICLES_PER_ROW);
          const col = artIndex % MAX_ARTICLES_PER_ROW;

          // Center the articles under the silo
          const articlesInRow = Math.min(MAX_ARTICLES_PER_ROW, displayArticles.length - (row * MAX_ARTICLES_PER_ROW));
          const rowWidth = articlesInRow * ARTICLE_SPACING_X;
          const rowStartX = siloX + (SILO_WIDTH / 2) - (rowWidth / 2);

          const articleX = rowStartX + (col * ARTICLE_SPACING_X);
          const articleY = articleStartY + (row * ARTICLE_HEIGHT);

          newNodes.push({
            id: `article-${article.id}`,
            type: 'article',
            data: {
              label: article.title.length > 25 ? article.title.substring(0, 25) + '...' : article.title,
              fullTitle: article.title,
              slug: article.slug,
              siloColor: silo.color,
              isPublished: article.is_published,
              isPillar: false,
            },
            position: { x: articleX, y: articleY },
            draggable: true,
          });

          newEdges.push({
            id: `e-silo-article-${article.id}`,
            source: `silo-${silo.id}`,
            target: `article-${article.id}`,
            type: 'smoothstep',
            style: {
              stroke: silo.color || '#06b6d4',
              strokeWidth: 1.5,
              opacity: 0.4
            },
          });
        });

        // Calculate position for "Add Article" button
        const displayedCount = Math.min(regularArticles.length, maxArticlesToShow);
        const lastArticleRow = displayedCount > 0 ? Math.floor((displayedCount - 1) / MAX_ARTICLES_PER_ROW) : -1;
        let addButtonY = articleStartY;

        if (regularArticles.length === 0) {
          // No articles - show add button directly below silo
          addButtonY = articleStartY;
        } else if (regularArticles.length > maxArticlesToShow) {
          // Has "more" indicator - add button goes after that
          const moreRow = Math.floor(maxArticlesToShow / MAX_ARTICLES_PER_ROW);
          addButtonY = articleStartY + ((moreRow + 1) * ARTICLE_HEIGHT) + 10;
        } else {
          // Articles exist but less than max - add button after last row
          addButtonY = articleStartY + ((lastArticleRow + 1) * ARTICLE_HEIGHT) + 10;
        }

        // "More" indicator (if more than max articles)
        if (regularArticles.length > maxArticlesToShow) {
          const moreCount = regularArticles.length - maxArticlesToShow;
          const moreRow = Math.floor(maxArticlesToShow / MAX_ARTICLES_PER_ROW);

          newNodes.push({
            id: `more-${silo.id}`,
            type: 'emptySlot',
            data: {
              siloColor: silo.color,
              label: `+${moreCount} more`
            },
            position: { x: siloX + 40, y: articleStartY + (moreRow * ARTICLE_HEIGHT) },
            draggable: false,
          });
        }

        // Always show "Add Article" button at the end
        newNodes.push({
          id: `add-article-${silo.id}`,
          type: 'emptySlot',
          data: {
            siloColor: silo.color,
            siloId: silo.id,
            siloName: silo.name,
            label: '+ Add Article',
            onAddArticle: handleAddArticle,
          },
          position: { x: siloX + 40, y: addButtonY },
          draggable: false,
        });

        // Edge from silo to add button (or from last article)
        if (regularArticles.length === 0) {
          newEdges.push({
            id: `e-silo-add-${silo.id}`,
            source: `silo-${silo.id}`,
            target: `add-article-${silo.id}`,
            type: 'smoothstep',
            style: {
              stroke: silo.color || '#6B7280',
              strokeWidth: 1,
              opacity: 0.3,
              strokeDasharray: '5,5'
            },
          });
        }
      });

      // ========================================
      // ORPHANED ARTICLES
      // ========================================
      if (orphanedArticles.length > 0) {
        // Position orphan container after all silos
        const orphanX = startX + (silos.length * SILO_SPACING);

        newNodes.push({
          id: 'orphan-container',
          type: 'silo',
          data: {
            label: 'Unassigned',
            fullName: 'Unassigned Articles',
            slug: 'unassigned',
            description: 'Articles without a silo',
            color: '#6B7280',
            articleCount: orphanedArticles.length,
            pillarPost: null,
          },
          position: { x: orphanX, y: siloY },
          draggable: true,
        });

        newEdges.push({
          id: 'e-main-orphan',
          source: 'main-pillar',
          target: 'orphan-container',
          type: 'smoothstep',
          style: {
            stroke: '#6B7280',
            strokeWidth: 2,
            opacity: 0.4,
            strokeDasharray: '8,4'
          },
        });

        const SILO_NODE_HEIGHT = 260;
        const orphanArticleStartY = siloY + SILO_NODE_HEIGHT;
        orphanedArticles.slice(0, 6).forEach((article, idx) => {
          const row = Math.floor(idx / 2);
          const col = idx % 2;

          newNodes.push({
            id: `orphan-${article.id}`,
            type: 'article',
            data: {
              label: article.title.length > 25 ? article.title.substring(0, 25) + '...' : article.title,
              fullTitle: article.title,
              slug: article.slug,
              siloColor: '#6B7280',
              isPublished: article.is_published,
              isPillar: article.is_pillar,
            },
            position: { x: orphanX + (col * 180), y: orphanArticleStartY + (row * 70) },
            draggable: true,
          });

          newEdges.push({
            id: `e-orphan-article-${article.id}`,
            source: 'orphan-container',
            target: `orphan-${article.id}`,
            type: 'smoothstep',
            style: {
              stroke: '#6B7280',
              strokeWidth: 1.5,
              opacity: 0.3
            },
          });
        });
      }

      setNodes(newNodes);
      setEdges(newEdges);

    } catch (err) {
      console.error('Error fetching graph:', err);
    }
    setLoading(false);
  }, [setNodes, setEdges, handleAddArticle, handleCreatePillar, handleEditPillar]);

  // Modal actions (defined after fetchGraph so they can reference it)
  const handleEditExistingPillar = useCallback(() => {
    if (existingPillarModal.existingPillar) {
      router.push(`/admin/insights/${existingPillarModal.existingPillar.id}`);
    }
    setExistingPillarModal(prev => ({ ...prev, isOpen: false }));
  }, [router, existingPillarModal.existingPillar]);

  const handleReplaceExistingPillar = useCallback(() => {
    router.push(`/admin/insights/create?siloId=${existingPillarModal.siloId}&silo=${existingPillarModal.siloSlug}&pillar=true&replace=true`);
    setExistingPillarModal(prev => ({ ...prev, isOpen: false }));
  }, [router, existingPillarModal]);

  const closeModal = useCallback(() => {
    setExistingPillarModal(prev => ({ ...prev, isOpen: false }));
    // Refresh graph to reset any loading states in SiloNodes
    fetchGraph();
  }, [fetchGraph]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ZoomIn className="w-6 h-6 text-purple-400" />
            </div>
            Content Silo Visualization
          </h2>
          <p className="text-gray-400 text-sm mt-1 ml-12">
            Interactive knowledge graph • Drag nodes to rearrange • Scroll to zoom
          </p>
        </div>
        <Button
          onClick={fetchGraph}
          variant="outline"
          className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-900/40 to-purple-950/40 border border-purple-500/30 rounded-xl text-center">
          <div className="text-3xl font-black text-purple-400">1</div>
          <div className="text-xs text-gray-400 font-medium mt-1">Main Hub</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-cyan-900/40 to-cyan-950/40 border border-cyan-500/30 rounded-xl text-center">
          <div className="text-3xl font-black text-cyan-400">{stats.silos}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">Topic Silos</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-emerald-900/40 to-emerald-950/40 border border-emerald-500/30 rounded-xl text-center">
          <div className="text-3xl font-black text-emerald-400">{stats.published}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">Published</div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-900/40 to-amber-950/40 border border-amber-500/30 rounded-xl text-center">
          <div className="text-3xl font-black text-amber-400">{stats.articles - stats.published}</div>
          <div className="text-xs text-gray-400 font-medium mt-1">Drafts</div>
        </div>
      </div>

      {/* Graph Canvas - Tall enough to show all content */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-950/80 border-white/10 h-[800px] overflow-hidden relative rounded-2xl">
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
              <p className="text-gray-300 font-medium">Building Knowledge Graph...</p>
            </div>
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 0.9 }}
          minZoom={0.15}
          maxZoom={1.5}
          attributionPosition="bottom-right"
          className="bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/50 via-slate-900/50 to-black/50"
        >
          <Background color="#334155" gap={40} size={1} />
          <Controls
            className="bg-slate-800/80 border-slate-600/50 rounded-xl overflow-hidden [&>button]:bg-slate-700/80 [&>button]:border-slate-600/50 [&>button]:text-white [&>button:hover]:bg-slate-600/80"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'mainPillar') return '#a855f7';
              if (node.type === 'silo') return node.data?.color || '#06b6d4';
              return '#64748b';
            }}
            maskColor="rgba(0, 0, 0, 0.7)"
            className="bg-slate-900/80 border-slate-600/50 rounded-xl"
          />
        </ReactFlow>
      </Card>

      {/* Legend */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-purple-500/30 rounded-lg">
            <Crown className="w-5 h-5 text-yellow-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">BPOC Intelligence</div>
            <div className="text-xs text-gray-400">Central Hub</div>
          </div>
        </div>
        <div className="p-4 bg-cyan-900/20 border border-cyan-500/30 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-cyan-500/30 rounded-lg">
            <Layers className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Topic Silos</div>
            <div className="text-xs text-gray-400">Category Clusters</div>
          </div>
        </div>
        <div className="p-4 bg-slate-800/50 border border-slate-600/30 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-slate-600/30 rounded-lg">
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Articles</div>
            <div className="text-xs text-gray-400">Individual Posts</div>
          </div>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <Info className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-xs text-gray-400">
            <strong className="text-white">SEO Tip:</strong> Link articles back to silo pages
          </div>
        </div>
      </div>

      {/* Existing Pillar Confirmation Modal */}
      <AnimatePresence>
        {existingPillarModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={closeModal}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md"
            >
              <div
                className="bg-slate-900/95 backdrop-blur-xl border-2 rounded-2xl overflow-hidden shadow-2xl"
                style={{ borderColor: `${existingPillarModal.siloColor}40` }}
              >
                {/* Header with gradient */}
                <div
                  className="p-6 pb-4"
                  style={{
                    background: `linear-gradient(135deg, ${existingPillarModal.siloColor}20 0%, transparent 100%)`,
                  }}
                >
                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Warning Icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${existingPillarModal.siloColor}30` }}
                    >
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Pillar Already Exists</h3>
                      <p className="text-sm text-gray-400">{existingPillarModal.siloName} silo</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">
                  {/* Existing pillar info */}
                  <div
                    className="p-4 rounded-xl mb-6 border"
                    style={{
                      backgroundColor: `${existingPillarModal.siloColor}10`,
                      borderColor: `${existingPillarModal.siloColor}30`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Current Pillar Article</span>
                    </div>
                    <p className="text-white font-medium text-sm leading-snug">
                      {existingPillarModal.existingPillar?.title || 'Untitled'}
                    </p>
                  </div>

                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    This silo already has a main pillar article. Would you like to <strong className="text-white">edit the existing pillar</strong> or <strong className="text-yellow-400">replace it with a new one</strong>?
                  </p>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleEditExistingPillar}
                      className="flex-1 h-11 bg-purple-600 hover:bg-purple-700 text-white border-0 font-semibold"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Edit Existing
                    </Button>
                    <Button
                      onClick={handleReplaceExistingPillar}
                      variant="outline"
                      className="flex-1 h-11 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-400 font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Replace
                    </Button>
                  </div>

                  {/* Cancel link */}
                  <button
                    onClick={closeModal}
                    className="w-full mt-4 text-center text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
