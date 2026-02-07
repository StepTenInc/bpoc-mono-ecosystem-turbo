# Insights Manager - Features and Changes

## AI Content Generation

### Full Article Generation
- Added "AI Generate Full Article" button that creates content for introduction, main body, and conclusion sections
- Uses Claude 3 Haiku with "Ate Yna" persona for authentic Filipino BPO voice
- Generates SEO-optimized content with proper markdown formatting
- Content is split into three database fields: content_part1, content_part2, content_part3

### Individual Section Improvement
- Added "Improve" button to each content section (Introduction, Main Body, Conclusion)
- Allows optimizing single sections without regenerating entire article
- Context-aware prompts based on section type and goals

### AI Description Generation
- Added "Generate with AI" button for meta description field
- Generates SEO-friendly descriptions (120-155 characters)
- Includes character count indicator with optimal range display

## Image Generation

### Google Imagen 3 Integration
- Primary image generation using Google Imagen 3
- DALL-E 3 as fallback when Imagen unavailable
- Photorealistic image prompts with specific camera and lighting instructions

### Body Images
- Support for three body images: content_image0, content_image1, content_image2
- Hyper-realistic prompts with camera gear specs, lighting details, and composition guidelines
- Images displayed between content sections on article page

## Video Generation

### Google Veo 2 Integration
- AI video generation using Google Veo 2 (requires API access)
- Fallback to Imagen 3 for poster image if video generation unavailable
- Secondary fallback to Gemini for image generation
- Style selection: professional, cinematic, tech, warm, animated

### Video Upload Options
- Choice modal offering "Upload Video" or "AI Generate" when no video exists
- Video preview with replace functionality

## Individual Card Saving

### Granular Save Controls
- Individual save buttons for each editor card (Content, Hero Media, Body Images, Meta)
- Change detection showing "Unsaved" badge when modifications detected
- Loading state during save with "Saved" confirmation on success
- CardHeaderWithSave reusable component for consistent UI

## SEO Features

### SEO Health Score
- Score calculation from 0-100 based on content attributes
- Factors: title length, description length, content parts, hero media, body images, category, slug, keywords, read time
- Color-coded badges: green (80+), yellow (60-79), orange (40-59), red (below 40)
- Average SEO score displayed on insights manager page

### Clickable Article Titles
- Article titles on manager page link to edit page
- Quick navigation to individual article editors

## Navigation

### Back Button
- Added "Back to Insights Manager" button at top of editor
- Uses ghost variant with subtle styling
- Positioned above page title for easy access

## Layout and UI

### Sticky Sidebar (Article Page)
- Sidebar sticks when reaching viewport top on public article pages
- Contains Resume Builder CTA, Sign Up CTA, and Deep Dive sections
- Uses CSS sticky with proper container structure

### Sticky Sidebar (Preview)
- JavaScript-based sticky solution for admin preview
- Handles scroll position tracking with position fixed
- Maintains original width and adds placeholder to prevent layout shift
- Bypasses CSS overflow restrictions from parent containers

### PreviewSidebar Component
- Extracted sidebar cards into reusable component
- Contains Resume Builder CTA, Get Hired Faster CTA, and Deep Dive placeholder
- Self-contained sticky logic

## Author Avatar

### Ate Yna Avatar Display
- Fixed avatar display using Next.js Image component
- Shows Ate Yna avatar in article hero section
- Shows avatar in author bio section
- Shows avatar on insights main page featured card
- Fallback to gradient background with initials for other authors

## Database Schema

### New Columns Added
- content_part1: Introduction section text
- content_part2: Main body section text
- content_part3: Conclusion section text
- content_image0: Featured/intro image URL
- content_image1: Main body image URL
- content_image2: Conclusion image URL

## API Endpoints

### /api/admin/insights/analyze
- Type: generate_full - Full article generation
- Type: improve_section - Single section optimization
- Type: generate_description - Meta description generation
- Uses Anthropic Claude 3 Haiku

### /api/admin/insights/generate-image
- Primary: Google Imagen 3
- Fallback: OpenAI DALL-E 3
- Returns image URL and generation source

### /api/admin/insights/generate-video
- Primary: Google Veo 2 (video)
- Fallback 1: Google Imagen 3 (image)
- Fallback 2: Google Gemini (image)
- Uploads to Supabase Storage

## Interlinking

### How It Works
- AI analyzes article content and suggests internal links
- Links stored in applied_links JSONB field
- Contains anchor text, target slug, and original text
- Links injected into content at render time using injectLinks function
- Displays as cyan-colored clickable links in article body

