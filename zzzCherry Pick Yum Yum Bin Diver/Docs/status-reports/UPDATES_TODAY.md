Updates Today

Live Preview
- Added real-time preview that shows exactly how articles look on the live site
- Three view modes: editor only, split view, or full preview
- Preview updates automatically as you edit

Split Content Sections
- Split article body into three separate sections instead of one big text box
- Makes it easier to organize content and place images
- Old articles automatically split their content when loaded

Split Content Sections
- Split article body into three separate sections instead of one big text box
- Makes it easier to organize content and place images
- Old articles automatically split their content when loaded
- Note: content_part1, content_part2, content_part3 already exist in database

Body Images
- Added three image slots throughout articles
- Featured image after title (yellow section)
- Image 1 after first content section (cyan section)
- Image 2 after second content section (purple section)
- Each slot has upload and AI generate options
- Note: content_image1 and content_image2 already exist in database

Database update needed:
```sql
ALTER TABLE insights_posts 
ADD COLUMN IF NOT EXISTS content_image0 TEXT;
```

AI Image Generation
- Added AI generate button for each image slot
- Uses DALL-E to create images based on article title
- Takes about 15 seconds and saves automatically

Bug Fixes
- Fixed content loss when saving old articles with new split structure
- Fixed bug where uploading one image would remove another image
- Both issues resolved with better state management

Files Changed
- Created ArticlePreview.tsx for live preview
- Modified InsightsEditor.tsx with all new features

Notes
- All changes are backward compatible
- Existing articles will work fine
- Run the SQL migrations in Supabase before using new features
