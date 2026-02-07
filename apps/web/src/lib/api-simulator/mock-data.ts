import { supabaseAdmin } from '@/lib/supabase/admin';
import crypto from 'crypto';

/**
 * Mock data generators for API testing simulator
 */

export interface MockJobData {
    title: string;
    description: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
    salaryMin: number;
    salaryMax: number;
    currency: string;
    workArrangement: 'remote' | 'hybrid' | 'onsite';
    workType: 'full_time' | 'part_time' | 'contract';
    shift: 'day' | 'night' | 'flexible';
    experienceLevel: 'entry_level' | 'mid_level' | 'senior_level';
    skills?: string[];
}

export interface MockCandidateData {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
}

/**
 * Generate a realistic mock job posting
 */
export function generateMockJob(overrides?: Partial<MockJobData>): MockJobData {
    const jobTitles = [
        'Customer Service Representative',
        'Technical Support Specialist',
        'Sales Development Representative',
        'Data Entry Specialist',
        'Virtual Assistant',
        'Call Center Agent',
        'Account Manager',
        'Quality Assurance Analyst',
    ];

    const title = overrides?.title || jobTitles[Math.floor(Math.random() * jobTitles.length)];

    return {
        title,
        description: `We are seeking a talented ${title} to join our dynamic team. This role offers excellent growth opportunities and competitive compensation.`,
        requirements: [
            'Excellent communication skills in English',
            '2+ years of relevant experience',
            'Strong problem-solving abilities',
            'Ability to work in a fast-paced environment',
            'Proficiency in Microsoft Office Suite',
        ],
        responsibilities: [
            'Handle customer inquiries and resolve issues promptly',
            'Maintain detailed records of customer interactions',
            'Collaborate with team members to improve processes',
            'Meet or exceed performance metrics',
            'Provide exceptional customer service',
        ],
        benefits: [
            'Competitive salary + performance bonuses',
            'Health insurance coverage',
            'Paid time off and holidays',
            'Work-from-home setup allowance',
            'Career development opportunities',
        ],
        salaryMin: 25000,
        salaryMax: 35000,
        currency: 'PHP',
        workArrangement: 'remote',
        workType: 'full_time',
        shift: 'day',
        experienceLevel: 'mid_level',
        skills: ['Customer Service', 'Communication', 'Time Management', 'Problem Solving'],
        ...overrides,
    };
}

/**
 * Generate a realistic mock candidate
 */
export function generateMockCandidate(overrides?: Partial<MockCandidateData>): MockCandidateData {
    const firstNames = ['Juan', 'Maria', 'Jose', 'Ana', 'Carlos', 'Sofia', 'Miguel', 'Isabella'];
    const lastNames = ['Santos', 'Reyes', 'Cruz', 'Garcia', 'Gonzales', 'Rivera', 'Torres', 'Flores'];

    const firstName = overrides?.firstName || firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = overrides?.lastName || lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomId = Math.random().toString(36).substring(2, 8);

    return {
        email: overrides?.email || `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${randomId}@test.bpoc.io`,
        firstName,
        lastName,
        phone: overrides?.phone || `+63 9${Math.floor(Math.random() * 100000000).toString().padStart(9, '0')}`,
    };
}

/**
 * Generate a test API key
 */
export function generateTestApiKey(): string {
    const prefix = 'bpoc_test_';
    const randomBytes = crypto.randomBytes(24).toString('hex');
    return `${prefix}${randomBytes}`;
}

/**
 * Create a complete test agency with client and API access
 */
export async function createTestAgency(options: {
    name: string;
    description?: string;
    createdBy: string;
}): Promise<{
    agency: any;
    client: any;
    apiKey: string;
    testAgencyRecord: any;
}> {
    const { name, description, createdBy } = options;

    // 1. Create agency
    const { data: agency, error: agencyError } = await supabaseAdmin
        .from('agencies')
        .insert({
            name: `TEST - ${name}`,
            email: `test.${name.toLowerCase().replace(/\s+/g, '-')}@simulator.bpoc.io`,
            api_enabled: true,
            api_tier: 'enterprise', // Give full access for testing
            status: 'active',
        })
        .select()
        .single();

    if (agencyError || !agency) {
        throw new Error(`Failed to create test agency: ${agencyError?.message}`);
    }

    // 2. Generate and store API key
    const apiKey = generateTestApiKey();

    const { error: updateError } = await supabaseAdmin
        .from('agencies')
        .update({ api_key: apiKey })
        .eq('id', agency.id);

    if (updateError) {
        throw new Error(`Failed to set API key: ${updateError.message}`);
    }

    // 3. Create a default client for the agency
    const { data: client, error: clientError } = await supabaseAdmin
        .from('agency_clients')
        .insert({
            agency_id: agency.id,
            name: `${name} - Test Client`,
            email: `client.${name.toLowerCase().replace(/\s+/g, '-')}@simulator.bpoc.io`,
            status: 'active',
        })
        .select()
        .single();

    if (clientError || !client) {
        throw new Error(`Failed to create test client: ${clientError?.message}`);
    }

    // 4. Create test agency tracking record
    const { data: testAgencyRecord, error: trackingError } = await supabaseAdmin
        .from('developer_test_agencies')
        .insert({
            agency_id: agency.id,
            name: `TEST - ${name}`,
            api_key: apiKey,
            description: description || `Test agency created via API simulator`,
            created_by: createdBy,
            is_active: true,
        })
        .select()
        .single();

    if (trackingError || !testAgencyRecord) {
        throw new Error(`Failed to create test agency record: ${trackingError?.message}`);
    }

    return {
        agency,
        client,
        apiKey,
        testAgencyRecord,
    };
}

/**
 * Clean up test data
 */
export async function cleanupTestData(testAgencyId: string): Promise<void> {
    // Get the agency ID
    const { data: testAgency } = await supabaseAdmin
        .from('developer_test_agencies')
        .select('agency_id')
        .eq('id', testAgencyId)
        .single();

    if (!testAgency) {
        throw new Error('Test agency not found');
    }

    // Delete the agency (cascade will handle related data)
    await supabaseAdmin
        .from('agencies')
        .delete()
        .eq('id', testAgency.agency_id);

    // Delete the test agency record
    await supabaseAdmin
        .from('developer_test_agencies')
        .delete()
        .eq('id', testAgencyId);
}
