const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the articles and their metadata
const articles = [
  {
    file: "public/Articles/best_bpo_companies_2026.md",
    slug: "best-bpo-companies-philippines-2026",
    category: "Company Reviews",
    icon_name: "Building2",
    description: "The truth about the top BPO companies in the Philippines for 2026. Who really pays the best? Who has the best culture?",
    keywords: ["best bpo companies philippines", "top call centers 2026", "accenture vs concentrix", "taskus reviews", "bpo tier list"],
    heroType: "image",
    heroUrl: "/images/insights/best-companies-hero.jpg",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10"
  },
  {
    file: "public/Articles/bpo_benefits_rights_2026.md",
    slug: "bpo-employee-benefits-rights-philippines-2026",
    category: "Benefits & Rights",
    icon_name: "ShieldCheck",
    description: "Complete guide to your rights: 13th month pay, SSS, PhilHealth, Pag-IBIG, and holiday pay computation.",
    keywords: ["13th month pay computation", "bpo benefits philippines", "labor code philippines", "holiday pay calculator", "sss benefits"],
    heroType: "image",
    heroUrl: "/images/insights/benefits-hero.jpg",
    color: "text-green-400",
    bgColor: "bg-green-500/10"
  },
  {
    file: "public/Articles/bpo_hiring_guide_2026.md",
    slug: "how-to-get-hired-call-center-philippines-2026",
    category: "Interview Tips",
    icon_name: "Users",
    description: "Step-by-step guide to passing your BPO interview. From Versant tips to answering 'Tell me about yourself'.",
    keywords: ["call center interview tips", "how to pass versant", "bpo hiring process", "interview questions and answers", "no experience bpo"],
    heroType: "image",
    heroUrl: "/images/insights/hiring-hero.jpg",
    color: "text-purple-400",
    bgColor: "bg-purple-500/10"
  },
  {
    file: "public/Articles/bpo_jobs_guide_2026.md",
    slug: "bpo-jobs-philippines-2026-guide",
    category: "Job Search",
    icon_name: "Briefcase",
    description: "The complete guide to BPO job types: Voice vs Non-Voice, Healthcare vs Telco, and where to apply.",
    keywords: ["bpo jobs philippines", "non voice jobs", "work from home bpo", "call center job types", "hiring now"],
    heroType: "image",
    heroUrl: "/images/insights/jobs-hero.jpg",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10"
  },
  {
    file: "public/Articles/bpo_promotion_guide.md",
    slug: "how-to-get-promoted-bpo-call-center",
    category: "Career Growth",
    icon_name: "TrendingUp",
    description: "Stop staying at entry-level. Here's how efficient employees actually move up to Team Leader and Manager roles.",
    keywords: ["how to get promoted bpo", "team leader promotion", "bpo career path", "call center career growth", "salary increase tips"],
    heroType: "image",
    heroUrl: "/images/insights/promotion-hero.jpg",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10"
  },
  {
    file: "public/Articles/bpo_salary_guide_2026.md",
    slug: "bpo-salary-guide-philippines-2026",
    category: "Salary & Compensation",
    icon_name: "Banknote",
    description: "The real numbers behind BPO salaries in 2026. Entry-level rates, account allowances, and how to negotiate.",
    keywords: ["call center salary philippines", "bpo salary 2026", "entry level bpo salary", "salary negotiation tips", "bpo night differential"],
    heroType: "image",
    heroUrl: "/images/insights/salary-hero.jpg",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10"
  }
];

// Define relationships for internal linking (Source Slug -> Target Slug)
const links = [
  // Salary Guide links to Benefits Guide (context for deductions)
  { source: "bpo-salary-guide-philippines-2026", target: "bpo-employee-benefits-rights-philippines-2026", type: "related", anchor: "Learn about your mandated benefits" },
  // Jobs Guide links to Salary Guide (context for pay)
  { source: "bpo-jobs-philippines-2026-guide", target: "bpo-salary-guide-philippines-2026", type: "related", anchor: "Check the 2026 Salary Guide" },
  // Best Companies links to Hiring Guide (context for applying)
  { source: "best-bpo-companies-philippines-2026", target: "how-to-get-hired-call-center-philippines-2026", type: "related", anchor: "Read our Hiring & Interview Guide" },
  // Hiring Guide links to Jobs Guide (context for roles)
  { source: "how-to-get-hired-call-center-philippines-2026", target: "bpo-jobs-philippines-2026-guide", type: "related", anchor: "Explore different BPO job roles" },
  // Promotion Guide links to Salary Guide (context for raises)
  { source: "how-to-get-promoted-bpo-call-center", target: "bpo-salary-guide-philippines-2026", type: "related", anchor: "See salary progression for Team Leaders" }
];

async function seed() {
  console.log('🚀 Starting content migration...');

  // 1. Clear existing posts (optional, but good for clean slate if requested)
  console.log('🧹 Clearing existing insights...');
  const { error: deleteError } = await supabase.from('insights_posts').delete().neq('slug', 'keep-me'); // Deletes all
  if (deleteError) console.error('Error clearing posts:', deleteError);

  const slugToIdMap = {};

  // 2. Insert Articles
  for (const article of articles) {
    try {
      console.log(`📝 Processing: ${article.slug}`);
      
      // Read content from file
      const contentPath = path.join(process.cwd(), article.file);
      let content = fs.readFileSync(contentPath, 'utf8');

      // Basic Markdown to HTML conversion (very simple, relying on frontend markdown renderer usually, but here we store markdown text directly often, or we can wrap in basic HTML tags if needed. 
      // Based on previous seed, it stored HTML p tags. 
      // However, the new system likely supports Markdown if the frontend renders it.
      // Looking at the provided file content, it IS Markdown.
      // The schema says "content String // HTML or Markdown content".
      // Let's assume the frontend handles Markdown rendering (ReactMarkdown etc).
      // If the previous content was HTML, we might need to be careful.
      // The prompt says "Use uploaded these". I will store the raw Markdown.
      
      // Extract Title from first line if it exists as # Title
      const lines = content.split('\n');
      let title = article.title; // Default from metadata
      if (lines[0].startsWith('# ')) {
        title = lines[0].replace('# ', '').trim();
        // Remove title from content to avoid duplication if the renderer adds H1
        content = lines.slice(1).join('\n').trim();
      }

      const { data: insertedPost, error: postError } = await supabase
        .from('insights_posts')
        .upsert({
          slug: article.slug,
          title: title,
          description: article.description,
          content: content, // Storing Markdown
          category: article.category,
          author: "Ate Yna",
          author_slug: "ate-yna",
          read_time: "8 min read", // Estimate
          icon_name: article.icon_name,
          color: article.color,
          bg_color: article.bgColor,
          hero_type: article.heroType,
          hero_url: article.heroUrl,
          is_published: true,
          published_at: new Date()
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (postError) {
        console.error(`❌ Error inserting post ${article.slug}:`, postError);
        continue;
      }

      slugToIdMap[article.slug] = insertedPost.id;

      // 3. Insert SEO Metadata
      const { error: seoError } = await supabase
        .from('seo_metadata')
        .upsert({
          post_id: insertedPost.id,
          meta_title: title,
          meta_description: article.description,
          keywords: article.keywords,
          canonical_url: `https://www.bpoc.io/insights/${article.slug}`,
          og_image: article.heroUrl,
          schema_type: 'Article'
        }, { onConflict: 'post_id' });

      if (seoError) console.error(`❌ Error inserting SEO for ${article.slug}:`, seoError);

      console.log(`✅ Successfully inserted: ${title}`);

    } catch (err) {
      console.error(`Unexpected error for ${article.slug}:`, err);
    }
  }

  // 4. Create Internal Links
  console.log('🔗 Creating internal links...');
  for (const link of links) {
    const sourceId = slugToIdMap[link.source];
    const targetId = slugToIdMap[link.target];

    if (sourceId && targetId) {
      const { error: linkError } = await supabase
        .from('internal_links')
        .insert({
          source_post_id: sourceId,
          target_post_id: targetId,
          type: link.type,
          anchor_text: link.anchor
        });

      if (linkError) {
        // Ignore unique constraint errors if re-running
        if (!linkError.message.includes('unique constraint')) {
          console.error(`❌ Error linking ${link.source} to ${link.target}:`, linkError);
        }
      } else {
        console.log(`🔗 Linked ${link.source} -> ${link.target}`);
      }
    } else {
      console.warn(`⚠️ Could not find IDs for linking ${link.source} to ${link.target}`);
    }
  }

  console.log('🏁 Migration completed successfully!');
}

seed();












