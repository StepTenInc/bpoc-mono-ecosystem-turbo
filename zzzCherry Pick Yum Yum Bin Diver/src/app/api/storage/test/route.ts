import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * GET /api/storage/test
 * Test storage bucket configuration and permissions
 *
 * Returns diagnostic information about the storage setup
 */
export async function GET() {
  const results: {
    bucket: { exists: boolean; public: boolean; error?: string };
    policies: { count: number; names: string[]; error?: string };
    upload: { success: boolean; url?: string; error?: string };
    cleanup: { success: boolean; error?: string };
    columns: { avatar_url: boolean; cover_photo: boolean; error?: string };
  } = {
    bucket: { exists: false, public: false },
    policies: { count: 0, names: [] },
    upload: { success: false },
    cleanup: { success: false },
    columns: { avatar_url: false, cover_photo: false },
  }

  try {
    // Test 1: Check if bucket exists
    console.log('🔍 Testing storage bucket...')
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets()

    if (bucketError) {
      results.bucket.error = bucketError.message
    } else {
      const candidateBucket = buckets?.find(b => b.id === 'candidate')
      if (candidateBucket) {
        results.bucket.exists = true
        results.bucket.public = candidateBucket.public || false
        console.log('✅ Bucket found:', candidateBucket)
      } else {
        results.bucket.error = 'Bucket "candidate" not found. Run migration: 20260126_fix_candidate_storage_complete.sql'
        console.error('❌ Bucket not found')
      }
    }

    // Test 2: Check RLS policies (query pg_policies)
    console.log('🔍 Checking RLS policies...')
    const { data: policies, error: policyError } = await supabaseAdmin
      .from('pg_policies')
      .select('policyname')
      .eq('tablename', 'objects')
      .ilike('policyname', '%candidate%')

    if (policyError) {
      // pg_policies might not be accessible, try alternative
      results.policies.error = 'Unable to query policies (this is normal if not superuser)'
    } else if (policies) {
      results.policies.count = policies.length
      results.policies.names = policies.map(p => p.policyname)
    }

    // Test 3: Try uploading a test file (only if bucket exists)
    if (results.bucket.exists) {
      console.log('🔍 Testing file upload...')
      const testContent = new Blob(['test'], { type: 'text/plain' })
      const testFileName = `profile_photos/test-${Date.now()}.txt`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('candidate')
        .upload(testFileName, testContent, { upsert: true })

      if (uploadError) {
        results.upload.error = uploadError.message
        console.error('❌ Upload test failed:', uploadError)
      } else {
        results.upload.success = true
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('candidate')
          .getPublicUrl(testFileName)
        results.upload.url = publicUrl
        console.log('✅ Upload test successful:', publicUrl)

        // Cleanup test file
        const { error: deleteError } = await supabaseAdmin.storage
          .from('candidate')
          .remove([testFileName])

        if (deleteError) {
          results.cleanup.error = deleteError.message
        } else {
          results.cleanup.success = true
        }
      }
    }

    // Test 4: Check database columns exist
    console.log('🔍 Checking database columns...')
    const { error: candidateColError } = await supabaseAdmin
      .from('candidates')
      .select('avatar_url')
      .limit(1)

    if (!candidateColError) {
      results.columns.avatar_url = true
    } else if (candidateColError.message.includes('avatar_url')) {
      results.columns.avatar_url = false
      results.columns.error = 'avatar_url column missing from candidates table'
    }

    const { error: profileColError } = await supabaseAdmin
      .from('candidate_profiles')
      .select('cover_photo')
      .limit(1)

    if (!profileColError) {
      results.columns.cover_photo = true
    } else if (profileColError.message.includes('cover_photo')) {
      results.columns.cover_photo = false
      results.columns.error = (results.columns.error || '') + ' cover_photo column missing from candidate_profiles table'
    }

    // Summary
    const allPassed =
      results.bucket.exists &&
      results.bucket.public &&
      results.upload.success &&
      results.columns.avatar_url &&
      results.columns.cover_photo

    return NextResponse.json({
      success: allPassed,
      message: allPassed
        ? '✅ Storage is properly configured!'
        : '⚠️ Some storage checks failed. See details below.',
      timestamp: new Date().toISOString(),
      results,
      recommendations: !allPassed ? [
        !results.bucket.exists && 'Run migration: 20260126_fix_candidate_storage_complete.sql in Supabase SQL Editor',
        !results.bucket.public && 'Bucket should be public for profile photos',
        !results.upload.success && `Upload failed: ${results.upload.error}`,
        !results.columns.avatar_url && 'Add avatar_url column to candidates table',
        !results.columns.cover_photo && 'Add cover_photo column to candidate_profiles table',
      ].filter(Boolean) : [],
    })

  } catch (error) {
    console.error('❌ Storage test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Storage test failed with error',
      error: error instanceof Error ? error.message : String(error),
      results,
    }, { status: 500 })
  }
}
