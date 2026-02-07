/**
 * Quick script to delete the orphaned pipeline
 * Run this in the browser console while on localhost:3000
 */

async function deleteOrphanedPipeline() {
    const pipelineId = '0a01c4a2'; // Partial ID from the UI

    console.log('🗑️ Searching for pipeline starting with:', pipelineId);

    // First, list all in-progress pipelines to find the full ID
    const listRes = await fetch('/api/admin/content-pipeline/list?status=in_progress');
    const listData = await listRes.json();

    console.log('📋 Found pipelines:', listData);

    if (listData.success && listData.pipelines?.length > 0) {
        // Find the pipeline that starts with our partial ID
        const targetPipeline = listData.pipelines.find(p => p.id.startsWith(pipelineId));

        if (targetPipeline) {
            console.log('🎯 Found target pipeline:', targetPipeline.id);
            console.log('   Created:', targetPipeline.created_at);
            console.log('   Stage:', targetPipeline.current_stage);

            // Delete it
            const deleteRes = await fetch(`/api/admin/content-pipeline/delete?id=${targetPipeline.id}`, {
                method: 'DELETE'
            });

            const deleteData = await deleteRes.json();
            console.log('✅ Delete result:', deleteData);

            if (deleteData.success) {
                console.log('🎉 Pipeline deleted successfully!');
                console.log('💡 Refresh the page to start fresh');
            } else {
                console.error('❌ Failed to delete:', deleteData.error);
            }
        } else {
            console.log('⚠️ No pipeline found starting with:', pipelineId);
            console.log('Available pipelines:', listData.pipelines.map(p => ({ id: p.id, stage: p.current_stage })));
        }
    } else {
        console.log('ℹ️ No in-progress pipelines found');
    }
}

// Run it
deleteOrphanedPipeline();
