/**
 * Setup Supabase Storage Buckets for Onboarding
 * Run with: node scripts/setup-storage-buckets.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

async function setupBuckets() {
    console.log('🪣 Setting up Supabase Storage Buckets...\n');

    const bucketsToCreate = [
        {
            name: 'candidates',
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
        }
    ];

    for (const bucketConfig of bucketsToCreate) {
        console.log(`Checking bucket: ${bucketConfig.name}`);

        // Check if bucket exists
        const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

        if (listError) {
            console.error('  ❌ Error listing buckets:', listError.message);
            continue;
        }

        const bucketExists = buckets.some(b => b.name === bucketConfig.name);

        if (bucketExists) {
            console.log(`  ✅ Bucket '${bucketConfig.name}' already exists\n`);
            continue;
        }

        // Create bucket
        console.log(`  Creating bucket '${bucketConfig.name}'...`);
        const { data, error } = await supabaseAdmin.storage.createBucket(bucketConfig.name, {
            public: bucketConfig.public,
            fileSizeLimit: bucketConfig.fileSizeLimit,
            allowedMimeTypes: bucketConfig.allowedMimeTypes
        });

        if (error) {
            console.error(`  ❌ Error creating bucket:`, error.message);
        } else {
            console.log(`  ✅ Created bucket '${bucketConfig.name}'\n`);
        }
    }

    // Create RLS policies for candidates bucket
    console.log('Setting up RLS policies for candidates bucket...');
    console.log('⚠️  Note: RLS policies must be created via SQL in Supabase dashboard');
    console.log('\nRun this SQL in Supabase SQL Editor:\n');
    console.log(`
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'candidates' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidates' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access (for public resumes, etc)
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'candidates');

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'candidates' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'candidates' AND (storage.foldername(name))[1] = auth.uid()::text);
    `);

    console.log('\n✅ Bucket setup complete!');
}

setupBuckets().catch(console.error);
