/**
 * BPOC TypeScript SDK
 * 
 * Official TypeScript/JavaScript client for BPOC API v1
 * 
 * Installation:
 * npm install @bpoc/sdk
 * 
 * Usage:
 * import { BPOCClient } from '@bpoc/sdk';
 * const client = new BPOCClient({ apiKey: 'your-key-here' });
 */

// ============================================================================
// Types
// ============================================================================

export interface BPOCConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  experienceYears?: number;
  bio?: string;
  skills?: string[];
  resumeUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCandidateInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  experienceYears?: number;
  skills?: string[];
  resumeUrl?: string;
}

export interface UpdateCandidateInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  headline?: string;
  location?: string;
  experienceYears?: number;
  bio?: string;
  skills?: string[];
  resumeUrl?: string;
}

export interface Client {
  id: string;
  companyName: string;
  industry?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrCreateClientInput {
  name: string;
  email?: string;
  industry?: string;
  website?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Job {
  id: string;
  clientId: string;
  title: string;
  description: string;
  slug: string;
  employmentType: string;
  workLocation: string;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  experienceLevel?: string;
  requiredSkills?: string[];
  niceToHaveSkills?: string[];
  benefits?: string[];
  applicationDeadline?: string;
  startDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  title: string;
  description: string;
  clientId?: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  workArrangement?: 'remote' | 'onsite' | 'hybrid';
  workType?: 'full_time' | 'part_time' | 'contract';
  shift?: 'day' | 'night' | 'flexible';
  experienceLevel?: 'entry_level' | 'mid_level' | 'senior_level';
  skills?: string[];
}

export interface Application {
  id: string;
  candidateId: string;
  jobId: string;
  status: string;
  releasedToClient: boolean;
  appliedAt: string;
  releasedAt?: string;
  candidate?: Candidate;
}

export interface BPOCError {
  message: string;
  code: string;
  details?: any;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: number;
}

// ============================================================================
// SDK Client
// ============================================================================

export class BPOCClient {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  public rateLimit?: RateLimitInfo;

  constructor(config: BPOCConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://bpoc.io/api/v1';
    this.timeout = config.timeout || 30000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async request<T>(
    method: string,
    endpoint: string,
    body?: any,
    attempt: number = 1
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(this.timeout),
      });

      // Update rate limit info from headers
      const rateLimitHeader = response.headers.get('X-RateLimit-Limit');
      if (rateLimitHeader) {
        this.rateLimit = {
          limit: parseInt(rateLimitHeader),
          remaining: parseInt(response.headers.get('X-RateLimit-Remaining') || '0'),
          resetAt: parseInt(response.headers.get('X-RateLimit-Reset') || '0'),
        };
      }

      // Handle rate limiting with retry
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60');
        
        if (attempt < this.retryAttempts) {
          await this.sleep(retryAfter * 1000);
          return this.request<T>(method, endpoint, body, attempt + 1);
        }

        const error = await response.json();
        throw new BPOCAPIError(
          error.error?.message || 'Rate limit exceeded',
          error.error?.code || 'RATE_LIMIT_EXCEEDED',
          response.status,
          error.error?.details
        );
      }

      // Handle other errors
      if (!response.ok) {
        const error = await response.json();
        throw new BPOCAPIError(
          error.error?.message || error.error || 'API request failed',
          error.error?.code || 'UNKNOWN_ERROR',
          response.status,
          error.error?.details
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof BPOCAPIError) {
        throw error;
      }

      // Network or timeout error
      if (attempt < this.retryAttempts) {
        await this.sleep(1000 * attempt); // Exponential backoff
        return this.request<T>(method, endpoint, body, attempt + 1);
      }

      throw new BPOCAPIError(
        error instanceof Error ? error.message : 'Network error',
        'NETWORK_ERROR',
        0
      );
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Candidates
  // ============================================================================

  async createCandidate(input: CreateCandidateInput): Promise<Candidate> {
    return this.request<Candidate>('POST', '/candidates', input);
  }

  async getCandidate(candidateId: string): Promise<Candidate> {
    return this.request<Candidate>('GET', `/candidates/${candidateId}`);
  }

  async updateCandidate(
    candidateId: string,
    input: UpdateCandidateInput
  ): Promise<Candidate> {
    return this.request<Candidate>('PUT', `/candidates/${candidateId}`, input);
  }

  async listCandidates(params?: {
    search?: string;
    skills?: string[];
    hasResume?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    candidates: Candidate[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.set('search', params.search);
    if (params?.skills) queryParams.set('skills', params.skills.join(','));
    if (params?.hasResume) queryParams.set('hasResume', 'true');
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.offset) queryParams.set('offset', params.offset.toString());

    const query = queryParams.toString();
    return this.request('GET', `/candidates${query ? `?${query}` : ''}`);
  }

  // ============================================================================
  // Clients
  // ============================================================================

  async getOrCreateClient(input: GetOrCreateClientInput): Promise<{
    clientId: string;
    companyId: string;
    name: string;
    created: boolean;
    message: string;
  }> {
    return this.request('POST', '/clients/get-or-create', input);
  }

  async listClients(): Promise<Client[]> {
    return this.request('GET', '/clients');
  }

  // ============================================================================
  // Jobs
  // ============================================================================

  async createJob(input: CreateJobInput): Promise<{
    success: boolean;
    job: Job;
    message: string;
  }> {
    return this.request('POST', '/jobs/create', input);
  }

  async getJob(jobId: string): Promise<Job> {
    return this.request('GET', `/jobs/${jobId}`);
  }

  async listJobs(params?: {
    clientId?: string;
    status?: string;
  }): Promise<Job[]> {
    const queryParams = new URLSearchParams();
    if (params?.clientId) queryParams.set('clientId', params.clientId);
    if (params?.status) queryParams.set('status', params.status);

    const query = queryParams.toString();
    return this.request('GET', `/jobs${query ? `?${query}` : ''}`);
  }

  // ============================================================================
  // Applications
  // ============================================================================

  async submitApplication(input: {
    jobId: string;
    candidate: {
      firstName: string;
      lastName: string;
      email: string;
    };
    source?: string;
  }): Promise<{
    success: boolean;
    message: string;
    applicationId: string;
  }> {
    return this.request('POST', '/applications', input);
  }

  async listApplications(params?: {
    mode?: 'recruiter' | 'client';
    jobId?: string;
    status?: string;
    releasedToClient?: boolean;
  }): Promise<Application[]> {
    const queryParams = new URLSearchParams();
    if (params?.mode) queryParams.set('mode', params.mode);
    if (params?.jobId) queryParams.set('jobId', params.jobId);
    if (params?.status) queryParams.set('status', params.status);
    if (params?.releasedToClient !== undefined) {
      queryParams.set('releasedToClient', params.releasedToClient.toString());
    }

    const query = queryParams.toString();
    return this.request('GET', `/applications${query ? `?${query}` : ''}`);
  }

  async releaseApplication(applicationId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    return this.request('POST', `/applications/${applicationId}/release`);
  }
}

// ============================================================================
// Error Class
// ============================================================================

export class BPOCAPIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'BPOCAPIError';
  }

  isRateLimitError(): boolean {
    return this.code === 'RATE_LIMIT_EXCEEDED';
  }

  isAuthError(): boolean {
    return this.code === 'UNAUTHORIZED' || this.code === 'INVALID_API_KEY';
  }

  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' || this.code === 'MISSING_REQUIRED_FIELD';
  }
}

// ============================================================================
// Usage Examples
// ============================================================================

/*
// Initialize client
const bpoc = new BPOCClient({
  apiKey: 'bpoc_live_xxxxxxxxxxxxxxxx',
});

// Create a client
const client = await bpoc.getOrCreateClient({
  name: 'Acme Corp',
  email: 'hr@acme.com',
  website: 'https://acme.com',
});

// Create a job
const job = await bpoc.createJob({
  title: 'Virtual Assistant',
  description: 'Full-time remote VA position',
  clientId: client.clientId,
  salaryMin: 30000,
  salaryMax: 45000,
  currency: 'PHP',
  workArrangement: 'remote',
  workType: 'full_time',
  experienceLevel: 'mid_level',
  skills: ['Customer Support', 'Data Entry'],
});

// Create a candidate
const candidate = await bpoc.createCandidate({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  headline: 'Virtual Assistant',
  experienceYears: 3,
  skills: ['Customer Support', 'Data Entry', 'Zendesk'],
});

// Search candidates
const results = await bpoc.listCandidates({
  search: 'virtual assistant',
  hasResume: true,
  limit: 50,
});

// Submit application
const application = await bpoc.submitApplication({
  jobId: job.job.id,
  candidate: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
  },
});

// Check rate limit
console.log('Rate limit remaining:', bpoc.rateLimit?.remaining);

// Error handling
try {
  await bpoc.createCandidate({ ... });
} catch (error) {
  if (error instanceof BPOCAPIError) {
    if (error.isRateLimitError()) {
      console.log('Rate limited! Retry after:', bpoc.rateLimit?.resetAt);
    } else if (error.isValidationError()) {
      console.log('Validation error:', error.details);
    } else {
      console.log('API error:', error.message, error.code);
    }
  } else {
    console.log('Network error:', error);
  }
}
*/
