# 🔧 INSIGHTS SYSTEM - QUICK FIXES (Priority Order)

## ❌ CRITICAL - Fix Immediately

### 1. **SEO Query Bug (Breaking Keywords Display)**
**File**: `src/app/(admin)/admin/insights/page.tsx`  
**Line**: 27

**Current (BROKEN)**:
```typescript
const { data, error } = await supabase
  .from('insights_posts')
  .select('*, seo:seo_metadata(meta_title, keywords)')
  .order('created_at', { ascending: false });
```

**Fix**:
```typescript
const { data, error } = await supabase
  .from('insights_posts')
  .select(`
    *,
    seo_metadata (
      meta_title,
      keywords
    )
  `)
  .order('created_at', { ascending: false });

// Then update line 194 to:
<span>{post.seo_metadata?.keywords?.length || 0} Keywords</span>
```

---

### 2. **Add Admin Authentication to ALL API Routes**
**Files**: All 11 routes in `/api/admin/insights/`

**Create this helper first**:
```typescript
// src/lib/admin-auth.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function requireAdmin(req: NextRequest): Promise<{ error?: NextResponse; userId?: string }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { 
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { 
      error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) 
    };
  }

  // Check admin role (adjust based on your auth setup)
  const role = user.user_metadata?.role || user.app_metadata?.role;
  if (role !== 'admin') {
    return { 
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) 
    };
  }

  return { userId: user.id };
}
```

**Then add to EVERY API route**:
```typescript
import { requireAdmin } from '@/lib/admin-auth';

export async function POST(req: NextRequest) {
  // Add this at the top of every handler
  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  // Rest of your code...
}
```

**Routes to update**:
- `/api/admin/insights/publish/route.ts`
- `/api/admin/insights/ideas/route.ts`
- `/api/admin/insights/generate/route.ts`
- `/api/admin/insights/generate-image/route.ts`
- `/api/admin/insights/humanize/route.ts`
- `/api/admin/insights/research/route.ts`
- `/api/admin/insights/refine-direction/route.ts`
- `/api/admin/insights/analyze/route.ts`
- `/api/admin/insights/links/route.ts`
- `/api/admin/insights/upload-image/route.ts`
- `/api/admin/insights/upload-video/route.ts`

---

### 3. **Add Error Boundaries**
**File**: `src/app/(admin)/admin/insights/page.tsx`

**Create**: `src/components/admin/insights/ErrorBoundary.tsx`
```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/shared/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class InsightsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`[${this.props.componentName}] Error:`, error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-bold text-red-400">
              Component Error: {this.props.componentName}
            </h3>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button 
            onClick={() => this.setState({ hasError: false, error: undefined })}
            variant="outline"
            className="border-red-500/30 text-red-400"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Then wrap each tab** in `page.tsx`:
```typescript
import { InsightsErrorBoundary } from '@/components/admin/insights/ErrorBoundary';

// Line 269-283, wrap each TabsContent:
<TabsContent value="health">
  <InsightsErrorBoundary componentName="SEO Dashboard">
    <SEODashboard />
  </InsightsErrorBoundary>
</TabsContent>

<TabsContent value="silo">
  <InsightsErrorBoundary componentName="Silo Visualization">
    <SiloVisualization />
  </InsightsErrorBoundary>
</TabsContent>

<TabsContent value="research">
  <InsightsErrorBoundary componentName="Outbound Research">
    <OutboundResearch />
  </InsightsErrorBoundary>
</TabsContent>

<TabsContent value="generate">
  <InsightsErrorBoundary componentName="Article Generator">
    <ArticleGenerator />
  </InsightsErrorBoundary>
</TabsContent>
```

---

### 4. **Fix ArticleGenerator Race Condition**
**File**: `src/components/admin/insights/ArticleGenerator.tsx`  
**Lines**: 410-459

**Replace the save logic**:
```typescript
const saveArticle = async () => {
  if (!generatedTitle || !generatedContent) {
    toast({ title: '❌ Missing title or content', variant: 'destructive' });
    return;
  }

  setLoading(true);
  setSaveStatus({ stage: 'checking', message: 'Preparing to save...' });

  try {
    const silo = SILOS.find(s => s.id === selectedSilo);
    const baseSlug = generatedSlug?.trim() || slugify(generatedTitle);

    setSaveStatus({ stage: 'creating', message: 'Creating article...' });
    
    const postData = {
      title: generatedTitle,
      slug: baseSlug,
      content: generatedContent,
      category: silo?.name || 'Uncategorized',
      author: 'Ate Yna',
      author_slug: 'ate-yna',
      is_published: false,
      hero_type: 'image',
      hero_url: heroUrl || null,
      icon_name: 'FileText'
    };

    // Try to insert with base slug
    let { data: post, error: postError } = await supabase
      .from('insights_posts')
      .insert(postData)
      .select()
      .single();

    // If duplicate slug, retry with timestamp suffix
    if (postError?.code === '23505') {
      const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;
      const retryData = { ...postData, slug: uniqueSlug };
      
      const { data: retryPost, error: retryError } = await supabase
        .from('insights_posts')
        .insert(retryData)
        .select()
        .single();

      if (retryError) {
        throw new Error(`Failed to create post: ${retryError.message}`);
      }
      
      post = retryPost;
      toast({ title: `⚠️ Slug modified to: ${uniqueSlug}` });
    } else if (postError) {
      throw new Error(`Post creation failed: ${postError.message}`);
    }

    // Create SEO metadata
    setSaveStatus({ stage: 'seo', message: 'Adding SEO metadata...' });
    
    const seoData = {
      post_id: post.id,
      meta_title: generatedTitle,
      meta_description: generatedMeta || generatedTitle,
      keywords: [targetKeyword, ...secondaryKeywords.split(',').map(k => k.trim()).filter(Boolean)],
      canonical_url: `https://www.bpoc.io/insights/${post.slug}`
    };
    
    const { error: seoError } = await supabase
      .from('seo_metadata')
      .insert(seoData);

    if (seoError) {
      console.warn('⚠️ SEO metadata failed:', seoError);
      // Don't throw - post is saved, SEO is optional
    }

    setSaveStatus({ stage: 'done', message: 'Article saved successfully!' });
    setLastSaved({ id: post.id, slug: post.slug });
    toast({ title: '✅ Article saved as draft!' });

  } catch (error: any) {
    console.error('❌ Save failed:', error);
    setSaveStatus({ 
      stage: 'error', 
      message: 'Save failed!', 
      error: error.message 
    });
    toast({ 
      title: '❌ Save failed', 
      description: error.message,
      variant: 'destructive' 
    });
  } finally {
    setLoading(false);
  }
};
```

---

## ⚠️ HIGH PRIORITY - Fix This Week

### 5. **Environment Variable Validation**

**Create**: `src/lib/env-check.ts`
```typescript
export interface EnvCheckResult {
  isValid: boolean;
  missing: string[];
  optional: string[];
}

export function checkInsightsEnv(): EnvCheckResult {
  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'ANTHROPIC_API_KEY': process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY,
  };

  const optional = {
    'SERPER_API_KEY': process.env.SERPER_API_KEY,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
    'GROK_API_KEY': process.env.GROK_API_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const missingOptional = Object.entries(optional)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  return {
    isValid: missing.length === 0,
    missing,
    optional: missingOptional
  };
}
```

**Create API route**: `src/app/api/admin/insights/check-env/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkInsightsEnv } from '@/lib/env-check';

export async function GET(req: NextRequest) {
  const result = checkInsightsEnv();
  return NextResponse.json(result);
}
```

**Add to ArticleGenerator.tsx** (around line 110):
```typescript
useEffect(() => {
  async function checkEnv() {
    try {
      const res = await fetch('/api/admin/insights/check-env');
      const data = await res.json();
      
      if (!data.isValid) {
        toast({
          title: '⚠️ Missing Required API Keys',
          description: `Required: ${data.missing.join(', ')}`,
          variant: 'destructive',
          duration: 10000
        });
      } else if (data.optional.length > 0) {
        toast({
          title: '⚠️ Optional Features Disabled',
          description: `Missing: ${data.optional.join(', ')}`,
          duration: 5000
        });
      }
    } catch (err) {
      console.error('Env check failed:', err);
    }
  }
  
  checkEnv();
}, []);
```

---

### 6. **Add Loading States for All API Calls**

**Pattern to apply everywhere**:
```typescript
// BEFORE (in many components):
const handleSomething = async () => {
  const res = await fetch('/api/...');
  const data = await res.json();
  // No error handling!
};

// AFTER (better):
const handleSomething = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/...');
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Request failed');
    }
    
    const data = await res.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Success handling...
    toast({ title: '✅ Success!' });
    
  } catch (error: any) {
    console.error('Operation failed:', error);
    toast({ 
      title: '❌ Error', 
      description: error.message,
      variant: 'destructive' 
    });
  } finally {
    setLoading(false);
  }
};
```

**Apply to these files**:
- `SEODashboard.tsx` (line 49)
- `OutboundResearch.tsx` (line 91)
- `SiloVisualization.tsx` (line 90)

---

## 📊 MEDIUM PRIORITY - Fix This Month

### 7. **Optimize SEO Dashboard Query**

**Create**: `src/app/api/admin/insights/health/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    // Server-side aggregation
    const { data, error } = await supabaseAdmin
      .rpc('calculate_health_scores');

    if (error) throw error;

    return NextResponse.json({ posts: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

**Create database function** (run in Supabase SQL editor):
```sql
CREATE OR REPLACE FUNCTION calculate_health_scores()
RETURNS TABLE (
  post_id UUID,
  title TEXT,
  slug TEXT,
  is_published BOOLEAN,
  applied_links_count INT,
  inbound_count BIGINT,
  outbound_count BIGINT,
  health_score INT,
  issues TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id AS post_id,
    p.title,
    p.slug,
    p.is_published,
    jsonb_array_length(COALESCE(p.applied_links, '[]'::jsonb)) AS applied_links_count,
    COUNT(DISTINCT il_in.id) AS inbound_count,
    COUNT(DISTINCT il_out.id) AS outbound_count,
    CASE
      WHEN COUNT(DISTINCT il_in.id) = 0 THEN 50
      WHEN COUNT(DISTINCT il_out.id) = 0 AND jsonb_array_length(COALESCE(p.applied_links, '[]'::jsonb)) = 0 THEN 70
      WHEN COUNT(DISTINCT il_out.id) > 10 THEN 80
      WHEN NOT p.is_published THEN 80
      ELSE 100
    END AS health_score,
    ARRAY_REMOVE(ARRAY[
      CASE WHEN COUNT(DISTINCT il_in.id) = 0 THEN 'Orphan page - no inbound links' END,
      CASE WHEN COUNT(DISTINCT il_out.id) = 0 AND jsonb_array_length(COALESCE(p.applied_links, '[]'::jsonb)) = 0 
           THEN 'No outbound links' END,
      CASE WHEN COUNT(DISTINCT il_out.id) > 10 THEN 'Too many outbound links (>10)' END,
      CASE WHEN NOT p.is_published THEN 'Not published' END
    ], NULL) AS issues
  FROM insights_posts p
  LEFT JOIN internal_links il_in ON il_in.target_post_id = p.id
  LEFT JOIN internal_links il_out ON il_out.source_post_id = p.id
  GROUP BY p.id, p.title, p.slug, p.is_published, p.applied_links
  ORDER BY health_score ASC;
END;
$$ LANGUAGE plpgsql;
```

**Update SEODashboard.tsx**:
```typescript
const fetchData = async () => {
  setLoading(true);
  
  try {
    const res = await fetch('/api/admin/insights/health');
    const data = await res.json();
    
    if (data.error) throw new Error(data.error);
    
    const posts = data.posts as PostHealth[];
    
    // Calculate stats
    const totalLinks = posts.reduce((sum, p) => sum + p.outbound_count + p.inbound_count, 0);
    const orphanPages = posts.filter(p => p.inbound_count === 0).length;
    const avgHealth = posts.reduce((sum, p) => sum + p.health_score, 0) / posts.length;
    
    setStats({
      totalPosts: posts.length,
      totalLinks,
      avgLinksPerPost: totalLinks / posts.length,
      orphanPages,
      healthScore: Math.round(avgHealth)
    });
    
    setPosts(posts);
  } catch (err) {
    console.error('Failed to fetch health data:', err);
  } finally {
    setLoading(false);
  }
};
```

---

## 🧹 CLEANUP TASKS

### 8. **Remove Legacy Files**
```bash
# Remove duplicate/legacy code
rm -rf INSIGHT_MANAGER_FILES/

# Check if anything still imports from it
grep -r "INSIGHT_MANAGER_FILES" src/
# If nothing found, safe to delete
```

### 9. **Create .env.example**
```env
# Required for all features
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required for AI article generation
ANTHROPIC_API_KEY=your_claude_key

# Optional: Research features
SERPER_API_KEY=your_serper_key

# Optional: Image generation
OPENAI_API_KEY=your_openai_key

# Optional: Content humanization
GROK_API_KEY=your_grok_key
```

---

## ✅ TESTING CHECKLIST

After applying fixes, test:

- [ ] Create new article via AI Generator
- [ ] Edit existing article in InsightsEditor
- [ ] Publish/unpublish/delete article
- [ ] View SEO Health Dashboard
- [ ] Use Silo Visualization
- [ ] Run Link Research
- [ ] Generate hero image
- [ ] Humanize content with Grok
- [ ] Verify all tabs load without errors
- [ ] Check keywords display correctly

---

## 🚀 DEPLOYMENT NOTES

1. Run database function creation SQL first
2. Deploy code changes
3. Test in staging environment
4. Monitor error logs for 24 hours
5. Roll out to production

---

**Priority Order**: Fix items 1-4 immediately, then work down the list.

