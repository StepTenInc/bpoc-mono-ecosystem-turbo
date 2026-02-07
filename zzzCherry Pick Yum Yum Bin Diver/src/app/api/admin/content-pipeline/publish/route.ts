/**
 * PUBLISH PIPELINE
 * Move completed pipeline content to insights_posts table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logError } from '@/lib/error-logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      pipelineId,
      isDraft,
      sectionImages: requestSectionImages,
      uploadedSectionUrls,
      contentSections: requestContentSections,
      coverImageAlt,
      isPillar,
      heroUrl: requestHeroUrl,
    } = await req.json();

    if (!pipelineId) {
      return NextResponse.json({ success: false, error: 'Pipeline ID required' }, { status: 400 });
    }

    console.log(`📤 Publishing pipeline ${pipelineId} (isDraft: ${isDraft}, isPillar: ${isPillar})`);
    console.log(`📤 Received sectionImages:`, requestSectionImages?.length || 0);
    console.log(`📤 Received uploadedSectionUrls:`, uploadedSectionUrls?.length || 0);
    console.log(`📤 Received heroUrl:`, requestHeroUrl || 'none');

    // Fetch the pipeline
    const { data: pipeline, error: fetchError } = await supabase
      .from('content_pipelines')
      .select('*')
      .eq('id', pipelineId)
      .single();

    if (fetchError || !pipeline) {
      return NextResponse.json({ 
        success: false, 
        error: fetchError?.message || 'Pipeline not found' 
      }, { status: 404 });
    }

    // Validate pipeline is ready - allow publish if at stage 8 OR if we have content
    const hasContent = pipeline.seo_article || pipeline.humanized_article || pipeline.raw_article;
    if (pipeline.current_stage < 7 && !isDraft && !hasContent) {
      return NextResponse.json({ 
        success: false, 
        error: `Pipeline at stage ${pipeline.current_stage}, need at least stage 7 or content to publish` 
      }, { status: 400 });
    }

    // Extract data from pipeline
    const articlePlan = pipeline.article_plan || {};
    const metaData = pipeline.meta_data || {};
    const selectedIdea = pipeline.selected_idea || {};

    // Resolve isPillar — trust request body first, then pipeline meta_data
    const resolvedIsPillar = isPillar || metaData.isSiloPage || false;
    console.log(`📤 isPillar resolved: ${resolvedIsPillar} (request: ${isPillar}, meta: ${metaData.isSiloPage})`);


    // Use request sectionImages if provided, fallback to pipeline's generated_images
    let generatedImages = pipeline.generated_images || [];

    // Merge in request section images (these have higher priority - freshly generated)
    if (requestSectionImages && requestSectionImages.length > 0) {
      console.log('📤 Using section images from request:', requestSectionImages.length);
      // Map request images to the expected format
      const requestImagesFormatted = requestSectionImages.map((img: any, idx: number) => ({
        url: img.url,
        alt: img.alt || `Section ${idx + 1}`,
        position: img.position || `section${idx + 1}`,
      }));

      // Replace or append section images
      generatedImages = [
        ...generatedImages.filter((img: any) => img.position === 'hero'),
        ...requestImagesFormatted,
      ];
    }

    // Get final content (prefer SEO optimized > humanized > raw)
    const finalContent = pipeline.seo_article || pipeline.humanized_article || pipeline.raw_article || '';

    // Get content parts - prioritize: request > pipeline > split from finalContent
    let contentPart1 = requestContentSections?.[0] || pipeline.content_section1 || '';
    let contentPart2 = requestContentSections?.[1] || pipeline.content_section2 || '';
    let contentPart3 = requestContentSections?.[2] || pipeline.content_section3 || '';

    console.log(`📤 [PUBLISH] Content sections from request: ${requestContentSections?.length || 0}`);

    // If content parts are still empty, split the finalContent
    if (!contentPart1 && !contentPart2 && !contentPart3 && finalContent) {
      console.log('📤 [PUBLISH] Splitting content into 3 parts...');
      const h2Sections = finalContent.split(/(?=^##\s)/m);

      if (h2Sections.length >= 3) {
        const sectionsPerPart = Math.ceil(h2Sections.length / 3);
        contentPart1 = h2Sections.slice(0, sectionsPerPart).join('\n\n');
        contentPart2 = h2Sections.slice(sectionsPerPart, sectionsPerPart * 2).join('\n\n');
        contentPart3 = h2Sections.slice(sectionsPerPart * 2).join('\n\n');
      } else {
        // Fallback: split by paragraphs
        const paragraphs = finalContent.split('\n\n');
        const third = Math.floor(paragraphs.length / 3);
        contentPart1 = paragraphs.slice(0, third).join('\n\n');
        contentPart2 = paragraphs.slice(third, third * 2).join('\n\n');
        contentPart3 = paragraphs.slice(third * 2).join('\n\n');
      }
    }
    console.log(`📤 [PUBLISH] Content: Part1=${contentPart1.length}chars, Part2=${contentPart2.length}chars, Part3=${contentPart3.length}chars`);

    // Get title - NEVER use "Untitled Article" default, get from existing article if needed
    let title = articlePlan.title || selectedIdea.title;

    // If no title from pipeline data, check if we have an existing article
    if (!title && pipeline.insight_id) {
      const { data: existingArticle } = await supabase
        .from('insights_posts')
        .select('title, slug')
        .eq('id', pipeline.insight_id)
        .single();
      if (existingArticle) {
        title = existingArticle.title;
      }
    }

    // Final fallback - should rarely happen
    if (!title) {
      title = 'New Article ' + new Date().toISOString().slice(0, 10);
    }

    // Generate slug based on whether this is a pillar page or supporting article
    let slug: string;
    
    if (resolvedIsPillar) {
      // PILLAR PAGE: Use silo slug directly — NOT generated from title
      // Resolve silo slug from pipeline data
      const siloKey = pipeline.selected_silo;
      const SILO_SLUG_MAP: Record<string, string> = {
        salary: 'bpo-salary-compensation',
        career: 'bpo-career-growth',
        jobs: 'bpo-jobs',
        interview: 'interview-tips',
        'employment-guide': 'bpo-employment-guide',
        benefits: 'bpo-employment-guide',
        companies: 'bpo-company-reviews',
        training: 'training-and-certifications',
        worklife: 'work-life-balance',
      };
      
      // Try canonical slug from meta first (set by silo mode), then silo map, then fallback
      const siloSlugFromMeta = metaData.canonicalSlug;
      const siloSlugFromMap = siloKey ? SILO_SLUG_MAP[siloKey] : null;
      slug = siloSlugFromMeta || siloSlugFromMap || title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // For pillar pages, slug should NOT have a silo prefix (it IS the silo)
      if (slug.includes('/')) {
        slug = slug.split('/').pop() || slug;
      }
      
      console.log(`📌 PILLAR PAGE: Using silo slug "${slug}" (source: ${siloSlugFromMeta ? 'meta' : siloSlugFromMap ? 'silo-map' : 'fallback'})`);
    } else {
      // SUPPORTING ARTICLE: Use the short keyword slug from meta generation
      slug = metaData.canonicalSlug || title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      // Strip silo prefix if accidentally included (e.g. "bpo-salary-compensation/article-slug" → "article-slug")
      if (slug.includes('/')) {
        slug = slug.split('/').pop() || slug;
      }
      console.log(`📄 SUPPORTING ARTICLE: Using slug "${slug}"`);
    }

    // Video hero - we only use video, no hero image needed
    const videoUrl = requestHeroUrl || pipeline.video_url || generatedImages.find((img: any) => img.position === 'hero')?.url;

    // All generated images are section images (not hero)
    let sectionImages: any[] = generatedImages.filter((img: any) => img.position !== 'hero');
    if (sectionImages.length === 0) {
      sectionImages = generatedImages;
    }

    // Build section image URLs - prioritize by position, then by index, then uploadedSectionUrls as fallback
    const section1Url = sectionImages.find((img: any) => img.position === 'section1')?.url
      || sectionImages[0]?.url
      || uploadedSectionUrls?.[0]
      || null;
    const section2Url = sectionImages.find((img: any) => img.position === 'section2')?.url
      || sectionImages[1]?.url
      || uploadedSectionUrls?.[1]
      || null;
    const section3Url = sectionImages.find((img: any) => img.position === 'section3')?.url
      || sectionImages[2]?.url
      || uploadedSectionUrls?.[2]
      || null;

    console.log('📤 [PUBLISH] URLs being saved:');
    console.log('   - video_url:', videoUrl);
    console.log('   - content_image0:', section1Url);
    console.log('   - content_image1:', section2Url);
    console.log('   - content_image2:', section3Url);

    // Build the article data
    const articleData: Record<string, any> = {
      slug,
      title,
      description: metaData.metaDescription || '',
      content: finalContent,
      content_part1: contentPart1,
      content_part2: contentPart2,
      content_part3: contentPart3,
      category: pipeline.selected_silo || 'General',
      author: 'Ate Yna',
      author_slug: 'ate-yna',
      hero_type: 'video', // Always video since we don't use hero images
      hero_url: null, // Not using hero images
      video_url: videoUrl,
      content_image0: section1Url,
      content_image1: section2Url,
      content_image2: section3Url,
      meta_description: metaData.metaDescription,
      silo_topic: pipeline.selected_silo,
      content_type: resolvedIsPillar ? 'pillar' : 'supporting',
      is_published: !isDraft,
      is_pillar: resolvedIsPillar || false,
      published_at: isDraft ? null : new Date().toISOString(),
      pipeline_stage: isDraft ? 'draft' : 'published',
      serper_research: pipeline.serper_results,
      personality_profile: pipeline.personality_profile,
      humanization_score: pipeline.human_score,
      generation_metadata: {
        pipelineId: pipeline.id,
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o',
        humanized: !!pipeline.humanized_article,
        seoOptimized: !!pipeline.seo_article,
        heroType: pipeline.hero_type,
        imageSource: pipeline.image_source || 'generate',
        metaTitle: metaData.metaTitle,
        schema: metaData.schema,
        isPillar: resolvedIsPillar,
      },
      ai_logs: pipeline.ai_logs,
    };

    // Add silo_id — resolve from UUID, or look up by slug/name if needed
    if (pipeline.selected_silo_id) {
      articleData.silo_id = pipeline.selected_silo_id;
    } else if (pipeline.selected_silo) {
      // Resolve silo UUID from slug or short name (e.g. "companies" → "Company Reviews" silo)
      const siloKey = pipeline.selected_silo;
      // Try multiple strategies: exact match, partial slug, partial name, singular form
      const singularKey = siloKey.replace(/ies$/, 'y').replace(/s$/, '');
      const { data: siloResults } = await supabase
        .from('insights_silos')
        .select('id, slug, name')
        .or(`slug.eq.${siloKey},slug.ilike.%${siloKey}%,name.ilike.%${siloKey}%,slug.ilike.%${singularKey}%,name.ilike.%${singularKey}%`)
        .limit(5);
      
      const siloData = siloResults?.[0] || null;
      if (siloData) {
        articleData.silo_id = siloData.id;
        console.log(`📌 Resolved silo_id from "${siloKey}": ${siloData.id} (${siloData.slug})`);
      } else {
        console.log(`⚠️ Could not resolve silo for "${siloKey}"`);
      }
    }

    // Always set author for Ate Yna
    articleData.author_name = articleData.author_name || 'Ate Yna';
    articleData.author_avatar = articleData.author_avatar || '/images/ate-yna-avatar.webp';

    let article: any;
    let insertError: any;

    // IMPORTANT: If pipeline already has insight_id, UPDATE that article instead of creating new one
    if (pipeline.insight_id) {
      console.log(`📝 Updating existing article ${pipeline.insight_id}`);
      const result = await supabase
        .from('insights_posts')
        .update(articleData)
        .eq('id', pipeline.insight_id)
        .select()
        .single();

      article = result.data;
      insertError = result.error;
    } else {
      // No existing article - use upsert with slug conflict
      console.log(`📝 Creating new article with slug: ${slug}`);
      const result = await supabase
        .from('insights_posts')
        .upsert(articleData, { onConflict: 'slug' })
        .select()
        .single();

      article = result.data;
      insertError = result.error;
    }

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 });
    }

    // Update pipeline with insight_id and status - mark as complete
    const { error: updateError } = await supabase
      .from('content_pipelines')
      .update({
        insight_id: article.id,
        status: isDraft ? 'draft' : 'published',
        current_stage: 8, // Ensure we're at final stage
        completed_at: isDraft ? null : new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ai_logs: [
          ...(pipeline.ai_logs || []),
          {
            stage: 'published',
            timestamp: new Date().toISOString(),
            message: isDraft ? 'Saved as draft' : 'Published to insights',
            insightId: article.id,
            slug: article.slug,
          },
        ],
      })
      .eq('id', pipelineId);

    if (updateError) {
      console.error('⚠️ Pipeline update error (non-fatal):', updateError);
    }

    // Store SEO metadata if available
    if (metaData.schema) {
      await supabase.from('seo_metadata').upsert({
        post_id: article.id,
        schema_markup: metaData.schema,
        focus_keyword: metaData.focusKeyword,
        secondary_keywords: metaData.secondaryKeywords,
      }, { onConflict: 'post_id' });
    }

    // If this is a pillar post, update the silo to link to it
    const siloIdForLink = articleData.silo_id || pipeline.selected_silo_id;
    if (resolvedIsPillar && siloIdForLink && !isDraft) {
      console.log(`📌 Linking pillar post ${article.id} to silo ${siloIdForLink}`);
      const { error: siloUpdateError } = await supabase
        .from('insights_silos')
        .update({ pillar_post_id: article.id })
        .eq('id', siloIdForLink);

      if (siloUpdateError) {
        console.error('⚠️ Failed to link pillar post to silo:', siloUpdateError);
      } else {
        console.log('✅ Pillar post linked to silo successfully');
      }
    }

    console.log(`✅ ${isDraft ? 'Draft saved' : 'Published'}: ${article.slug}${resolvedIsPillar ? ' (PILLAR)' : ''}`);

    // Build the full URL based on pillar vs supporting article
    let siloSlug = '';
    if (articleData.silo_id) {
      const { data: siloInfo } = await supabase
        .from('insights_silos')
        .select('slug')
        .eq('id', articleData.silo_id)
        .single();
      siloSlug = siloInfo?.slug || '';
    }
    
    let articleUrl: string;
    if (resolvedIsPillar && siloSlug) {
      // Pillar page: /insights/{silo-slug} (no article slug — it IS the silo page)
      articleUrl = `/insights/${siloSlug}`;
    } else if (siloSlug) {
      // Supporting article: /insights/{silo-slug}/{article-slug}
      articleUrl = `/insights/${siloSlug}/${article.slug}`;
    } else {
      // No silo: /insights/{article-slug}
      articleUrl = `/insights/${article.slug}`;
    }

    return NextResponse.json({
      success: true,
      article: {
        id: article.id,
        slug: article.slug,
        siloSlug,
        title: article.title,
        url: articleUrl,
        isPublished: !isDraft,
      },
    });

  } catch (error: any) {
    console.error('❌ Publish error:', error);
    await logError(error, {
      endpoint: '/api/admin/content-pipeline/publish',
      http_method: 'POST',
      external_service: 'supabase',
    });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

