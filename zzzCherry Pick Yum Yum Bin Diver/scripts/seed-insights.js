const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); // Load env vars

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Data from src/data/insights.ts (replicated here to avoid import issues)
const insightsData = [
  {
    slug: "13th-month-pay-computation-guide",
    category: "Benefits & Rights",
    title: "13th Month Pay: How to Compute Yours (With Examples)",
    description: "Confused about your 13th-month pay? Ate Yna breaks down the computation, eligibility, and when to expect it. Don't get shortchanged!",
    keywords: ["13th month pay computation", "13th month pay philippines", "bpo benefits", "call center bonus", "13th month calculator"],
    content: `
      <p class="lead text-xl text-gray-300 mb-8">Let's talk about the most awaited time of the year — and no, I don't mean Christmas itself. I mean the <strong>13th Month Pay</strong>.</p>
      
      <p>I remember my first year in BPO. December came, and everyone was buzzing. "Uy, may bonus na ba?" I was clueless. I thought it was just a gift the company gave if they felt like it. Spoiler alert: It's not a gift. It's your right.</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">What Is 13th Month Pay, Anyway?</h2>
      <p>Simply put, it's an additional monetary benefit given to rank-and-file employees. By law (thank you, PD 851), it must be at least <strong>one-twelfth (1/12) of your total basic salary earned</strong> within a calendar year.</p>
      
      <p>Hot take: Many people confuse this with the "Christmas Bonus." They are NOT the same. 13th month is mandatory. Christmas bonus is voluntary (discretion ng company). If you get both? Grabe, winner!</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Who Is Eligible?</h2>
      <p>Here's the rule: If you have worked for at least <strong>one (1) month</strong> during the calendar year, you are entitled to it. Yes, even if you're probationary. Yes, even if you're a "floater" (floating status) for part of the year.</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">How to Compute: The Math Part</h2>
      <p>Don't panic, it's simple math. The formula is:</p>
      
      <div class="bg-white/5 p-6 rounded-xl border border-white/10 my-6 font-mono text-cyan-400">
        Total Basic Salary Earned During the Year ÷ 12 = 13th Month Pay
      </div>

      <h3 class="text-xl font-bold text-white mt-8 mb-4">Example Scenario:</h3>
      <p>Let's say your basic salary is <strong>₱20,000</strong> per month.</p>
      <ul class="list-disc pl-6 space-y-2 mb-6 text-gray-300">
        <li><strong>Scenario A (Complete Year):</strong> You worked from January to December without absences/LWOP (Leave Without Pay).<br>
        <em>Calculation:</em> (₱20,000 x 12 months) ÷ 12 = <strong>₱20,000</strong></li>
        
        <li><strong>Scenario B (Started Mid-Year):</strong> You started in July.<br>
        <em>Calculation:</em> (₱20,000 x 6 months) ÷ 12 = <strong>₱10,000</strong></li>
      </ul>

      <p><strong>Important Note:</strong> It's based on <em>Basic Salary</em> only. Allowances, overtime pay, and night differential are usually excluded (unless your company policy says otherwise).</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">When Should You Receive It?</h2>
      <p>The law says it must be paid <strong>not later than December 24</strong> of each year. Most BPO companies release it as early as November or the first week of December to help with holiday shopping. Diskarte tip: Don't spend it all in one go!</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Common Questions (FAQ)</h2>
      
      <h3 class="text-lg font-bold text-white mt-6 mb-2">I resigned in October. Do I still get it?</h3>
      <p><strong>YES.</strong> It's called "pro-rated" 13th month pay. It will usually be released together with your back pay (final pay).</p>

      <h3 class="text-lg font-bold text-white mt-6 mb-2">Is it taxable?</h3>
      <p>Generally, <strong>NO</strong>, as long as it (plus other benefits) doesn't exceed ₱90,000. If your 13th month + bonuses go over ₱90k, only the excess is taxable. Sana all, di ba?</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Ate Yna's Final Advice</h2>
      <p>Check your payslip. Do the math yourself. If something looks off, ask HR nicely. It's your money, you worked hard for those graveyard shifts! Now, go enjoy your Noche Buena.</p>
    `,
    icon_name: "Calculator",
    date: "Dec 15, 2025",
    author: "Ate Yna",
    authorSlug: "ate-yna",
    readTime: "6 min read",
    color: "text-neon-green",
    bgColor: "bg-emerald-500/10",
    heroType: "image",
    heroUrl: "/images/insights/13th-month-pay.jpg" 
  },
  {
    slug: "bpo-jobs-hiring-2025-no-experience",
    category: "BPO Jobs & Careers",
    title: "BPO Jobs Hiring 2025 — No Experience Needed (Beginner's Guide)",
    description: "Fresh grad? Shifting careers? Here's your guide to BPO companies hiring with no experience in 2025. Plus tips to get hired fast!",
    keywords: ["bpo jobs no experience", "call center hiring 2025", "fresh grad jobs philippines", "entry level bpo", "non voice jobs no experience"],
    content: `
      <p class="lead text-xl text-gray-300 mb-8">"Required: 2 years experience." Seeing this on every job post is heartbreaking, 'di ba? You need a job to get experience, but you need experience to get a job. Make it make sense!</p>

      <p>But here's the good news: The BPO industry is one of the few places where "No Experience" is actually okay. In fact, many companies <em>prefer</em> fresh talent they can train from scratch.</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Top Roles for Beginners in 2025</h2>
      <p>If you're just starting out, look for these specific job titles. They are the gateway to your BPO career.</p>

      <div class="grid md:grid-cols-2 gap-6 my-8">
        <div class="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 class="text-lg font-bold text-cyan-400 mb-2">Customer Service Rep (CSR)</h3>
          <p class="text-sm text-gray-400">The classic entry point. You handle inquiries, billing, or complaints. High hiring volume!</p>
        </div>
        <div class="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 class="text-lg font-bold text-purple-400 mb-2">Technical Support Rep (TSR)</h3>
          <p class="text-sm text-gray-400">If you're good with gadgets or basic troubleshooting. Usually pays higher than CSR.</p>
        </div>
        <div class="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 class="text-lg font-bold text-pink-400 mb-2">Content Moderator</h3>
          <p class="text-sm text-gray-400">Non-voice role. You review videos/posts to ensure they follow guidelines. Very in demand.</p>
        </div>
        <div class="bg-white/5 p-6 rounded-xl border border-white/10">
          <h3 class="text-lg font-bold text-yellow-400 mb-2">Data Entry Specialist</h3>
          <p class="text-sm text-gray-400">Pure back-office. Fast typing speed is your main weapon here.</p>
        </div>
      </div>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Companies Known for Hiring Newbies</h2>
      <p>Based on our 2025 hiring data, these companies are currently aggressive in hiring fresh grads and career shifters:</p>
      <ul class="list-disc pl-6 space-y-2 mb-6 text-gray-300">
        <li><strong>Alorica:</strong> Very beginner-friendly training programs.</li>
        <li><strong>Concentrix:</strong> Huge presence nationwide, lots of accounts to choose from.</li>
        <li><strong>Foundever (formerly Sitel):</strong> Great culture for first-timers.</li>
        <li><strong>TaskUs:</strong> Known for "cool" offices and non-voice accounts.</li>
      </ul>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">How to Stand Out (Even Without Experience)</h2>
      <p>Since you don't have a work history to brag about, focus on your <strong>skills</strong> and <strong>attitude</strong>.</p>
      
      <p>1. <strong>English Proficiency:</strong> You don't need a fake accent. You just need to be understood. Practice grammar and pronunciation.</p>
      <p>2. <strong>Typing Speed:</strong> Aim for at least 35-40 WPM. (Have you tried our typing game yet? It helps!)</p>
      <p>3. <strong>Diskarte & Resilience:</strong> Share stories from school or life where you solved a problem. That counts as experience!</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Real Talk from Ate Yna</h2>
      <p>My first BPO application? I failed. I froze during the mock call. Nakakahiya. But I applied to another one the next day. And another. The key is persistence. Every "No" brings you closer to that one "You're Hired!"</p>
      
      <p>So update that resume (use our builder if you're stuck!), and start applying. You got this!</p>
    `,
    icon_name: "Briefcase",
    date: "Dec 14, 2025",
    author: "Ate Yna",
    authorSlug: "ate-yna",
    readTime: "5 min read",
    color: "text-cyber-blue",
    bgColor: "bg-sky-500/10",
    heroType: "image",
    heroUrl: "/images/insights/hiring-2025.jpg"
  },
  {
    slug: "call-center-interview-questions-answers",
    category: "Interview & Application",
    title: "Call Center Interview Questions & Answers: Pass Your First Try",
    description: "Nervous about your BPO interview? Ate Yna reveals the most common questions and the best answers to impress recruiters.",
    keywords: ["call center interview questions", "bpo interview tips", "tell me about yourself bpo", "why do you want to work in a call center", "bpo hiring process"],
    content: `
      <p class="lead text-xl text-gray-300 mb-8">Palms sweating? Heart racing? Yep, it's interview day. I've been there. The interviewer stares at you and asks, "So, tell me about yourself," and suddenly your mind goes blank.</p>

      <p>Relax. Most BPO interviews follow a pattern. If you know the pattern, you can hack the interview. Here are the top questions and how to answer them like a pro.</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">1. "Tell me something about yourself."</h2>
      <p><strong>The Trap:</strong> Reciting your biodata. "I am Juan, I live in Quezon City, my mother is..." Stop! They have your resume.</p>
      <p><strong>The Ate Yna Strategy:</strong> Past, Present, Future.</p>
      <ul class="list-disc pl-6 space-y-2 mb-6 text-gray-300">
        <li><strong>Past:</strong> "I recently graduated with a degree in..." or "I used to work as..."</li>
        <li><strong>Present:</strong> "Currently, I'm looking to start a career in the BPO industry because..."</li>
        <li><strong>Future:</strong> "I want to develop my communication skills and grow with a stable company."</li>
      </ul>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">2. "Why do you want to work in a call center?"</h2>
      <p><strong>The Trap:</strong> "Because the salary is high." (Too honest!) or "I have no other choice." (Desperate!)</p>
      <p><strong>The Winning Answer:</strong> Focus on the industry and skills.</p>
      <blockquote class="border-l-4 border-electric-purple pl-4 my-4 italic text-gray-400">
        "I want to work in a fast-paced environment where I can be challenged. I know the BPO industry offers great career growth, and I want to be part of a global industry that helps people solve problems every day."
      </blockquote>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">3. "What is your idea of BPO?"</h2>
      <p><strong>Simple Answer:</strong> "Business Process Outsourcing is when a company hires a third-party organization to handle specific business operations, like customer service, to focus on their core business." (Memorize the thought, not the words!)</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">4. "How do you handle stress?"</h2>
      <p>They ask this because, let's be real, BPO *is* stressful. They want to know you won't quit after one irate call.</p>
      <p><strong>Good Answer:</strong> "I handle stress by staying organized and not taking things personally. When a customer is angry, I understand they are upset at the situation, not at me. After work, I decompress by [insert healthy hobby like gaming/reading/exercise]."</p>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Quick Tips for the "Versant" or English Test</h2>
      <ul class="list-disc pl-6 space-y-2 mb-6 text-gray-300">
        <li><strong>Speak clearly, not fast.</strong> Speed is not fluency.</li>
        <li><strong>Complete your sentences.</strong> Avoid one-word answers.</li>
        <li><strong>Listen carefully.</strong> Instructions are usually given once.</li>
      </ul>

      <h2 class="text-2xl font-bold text-white mt-12 mb-6">Final Pep Talk</h2>
      <p>Remember, the recruiter is just a person. They want you to pass because they have a hiring quota to meet! Help them help you. Smile, breathe, and show them you have the <em>diskarte</em> to handle the job.</p>
    `,
    icon_name: "Mic",
    date: "Dec 13, 2025",
    author: "Ate Yna",
    authorSlug: "ate-yna",
    readTime: "7 min read",
    color: "text-electric-purple",
    bgColor: "bg-purple-500/10",
    heroType: "image",
    heroUrl: "/images/insights/interview-tips.jpg"
  }
];

async function seed() {
  console.log('🌱 Starting seeding of insights...');

  for (const post of insightsData) {
    try {
      console.log(`Processing: ${post.title}`);

      // 1. Insert/Upsert Post
      const { data: insertedPost, error: postError } = await supabase
        .from('insights_posts')
        .upsert({
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          category: post.category,
          author: post.author,
          author_slug: post.authorSlug || 'ate-yna', // Default if missing
          read_time: post.readTime,
          icon_name: post.icon_name || 'FileText',
          color: post.color,
          bg_color: post.bgColor,
          hero_type: post.heroType || 'image',
          hero_url: post.heroUrl,
          is_published: true, // Auto publish imported content
          published_at: new Date(post.date || new Date())
        }, { onConflict: 'slug' })
        .select()
        .single();

      if (postError) {
        console.error(`❌ Error inserting post ${post.slug}:`, postError);
        continue;
      }

      // 2. Insert SEO Metadata
      if (insertedPost) {
        const { error: seoError } = await supabase
          .from('seo_metadata')
          .upsert({
            post_id: insertedPost.id,
            meta_title: post.title,
            meta_description: post.description,
            keywords: post.keywords || [],
            canonical_url: `https://www.bpoc.io/insights/${post.slug}`,
            og_image: post.heroUrl,
            schema_type: 'Article'
          }, { onConflict: 'post_id' });

        if (seoError) {
          console.error(`❌ Error inserting SEO for ${post.slug}:`, seoError);
        } else {
          console.log(`✅ Successfully seeded: ${post.title}`);
        }
      }
      
    } catch (err) {
      console.error(`Unexpected error for ${post.slug}:`, err);
    }
  }

  console.log('🏁 Seeding completed.');
}

seed();












