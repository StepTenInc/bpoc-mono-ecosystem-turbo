
import { NextRequest, NextResponse } from 'next/server'
import { getProfileByCandidate, updateProfile, createProfile } from '@/lib/db/profiles'

export async function PUT(request: NextRequest) {
    try {
        const data = await request.json()
        const { userId, ...workStatusData } = data

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
        }

        console.log('🔄 API: Updating work status for user:', userId, workStatusData)

        const profileData: any = {}
        
        // Only add fields that are provided
        if (workStatusData.workStatus) profileData.work_status = workStatusData.workStatus
        if (workStatusData.currentEmployer) profileData.current_employer = workStatusData.currentEmployer
        if (workStatusData.currentPosition) profileData.current_position = workStatusData.currentPosition
        
        // Sanitize and convert salary values
        if (workStatusData.currentSalary) {
            const sanitized = String(workStatusData.currentSalary).replace(/[₱$,\s]/g, '')
            const num = parseFloat(sanitized)
            profileData.current_salary = isNaN(num) ? null : num
        }
        
        if (workStatusData.noticePeriod !== undefined && workStatusData.noticePeriod !== null && workStatusData.noticePeriod !== '') {
            const num = parseInt(String(workStatusData.noticePeriod))
            profileData.notice_period_days = isNaN(num) ? null : num
        }
        
        if (workStatusData.minimumSalaryRange) {
            const sanitized = String(workStatusData.minimumSalaryRange).replace(/[₱$,\s]/g, '')
            const num = parseFloat(sanitized)
            profileData.expected_salary_min = isNaN(num) ? null : num
        }
        
        if (workStatusData.maximumSalaryRange) {
            const sanitized = String(workStatusData.maximumSalaryRange).replace(/[₱$,\s]/g, '')
            const num = parseFloat(sanitized)
            profileData.expected_salary_max = isNaN(num) ? null : num
        }
        
        if (workStatusData.preferredShift) profileData.preferred_shift = workStatusData.preferredShift
        if (workStatusData.workSetup) profileData.preferred_work_setup = workStatusData.workSetup
        if (workStatusData.currentMood) profileData.current_mood = workStatusData.currentMood
        if (workStatusData.completed_data !== undefined) profileData.profile_completed = workStatusData.completed_data

        // Clean up undefined, null or NaN values
        Object.keys(profileData).forEach(key => {
            if (profileData[key] === undefined || profileData[key] === null || Number.isNaN(profileData[key])) {
                delete profileData[key]
            }
        })

        // Additional cleanup for specific fields to ensure they are null if empty
        if (workStatusData.noticePeriod === '' || workStatusData.noticePeriod === null) {
            profileData.notice_period_days = null;
        }

        // Check if profile exists
        const existingProfile = await getProfileByCandidate(userId, true)

        let updatedProfile
        if (existingProfile) {
            updatedProfile = await updateProfile(userId, profileData, true)
        } else {
            updatedProfile = await createProfile(userId, { ...profileData, candidate_id: userId })
        }

        return NextResponse.json({ success: true, profile: updatedProfile })

    } catch (error) {
        console.error('❌ API: Error updating work status:', error)
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}

// POST alias
export async function POST(request: NextRequest) {
    return PUT(request)
}
