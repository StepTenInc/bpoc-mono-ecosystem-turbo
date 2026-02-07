/**
 * Veo 3.1 Video Generation Types
 */

export interface VeoGenerateRequest {
    prompt: string;
    resolution?: '1080p' | '4k';
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: number; // seconds, typically 5-10
    imageUrl?: string; // For image-to-video
}

export interface VeoGenerateResponse {
    success: boolean;
    videoUrl?: string;
    videoData?: string; // base64 encoded video
    error?: string;
    duration?: number;
    estimatedCost?: number;
}

export interface VeoVideoStatus {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    videoUrl?: string;
    error?: string;
}
