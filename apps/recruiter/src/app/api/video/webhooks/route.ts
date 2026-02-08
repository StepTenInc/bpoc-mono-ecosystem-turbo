/**
 * Daily.co Webhook Management API
 * Check and manage Daily.co webhook configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth/verify-token';

const DAILY_API_KEY = process.env.DAILY_API_KEY;
const DAILY_API_URL = 'https://api.daily.co/v1';

// GET - List all configured webhooks
export async function GET(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    if (!DAILY_API_KEY) {
      return NextResponse.json({ error: 'DAILY_API_KEY not configured' }, { status: 500 });
    }

    // Fetch all webhooks from Daily.co
    const response = await fetch(`${DAILY_API_URL}/webhooks`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ 
        error: 'Failed to fetch webhooks from Daily.co',
        details: error,
      }, { status: 500 });
    }

    const data = await response.json();

    // Find webhook for our domain
    const ourWebhook = data.data?.find((w: any) => 
      w.url?.includes('bpoc.io') || 
      w.url?.includes('bpoc-stepten.vercel.app')
    );

    return NextResponse.json({
      configured: !!ourWebhook,
      expectedUrl: 'https://www.bpoc.io/api/video/webhook',
      webhooks: data.data || [],
      ourWebhook: ourWebhook || null,
      warning: ourWebhook?.url?.includes('vercel.app') 
        ? '⚠️ Webhook points to vercel.app, should be www.bpoc.io!' 
        : null,
    });

  } catch (error) {
    console.error('Webhooks check error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - Create or update webhook
export async function POST(request: NextRequest) {
  try {
    const { userId, error: authError } = await verifyAuthToken(request);

    if (!userId) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    if (!DAILY_API_KEY) {
      return NextResponse.json({ error: 'DAILY_API_KEY not configured' }, { status: 500 });
    }

    const webhookUrl = 'https://www.bpoc.io/api/video/webhook';
    const eventTypes = [
      'recording.started',
      'recording.ready-to-download',
      'recording.error',
      'meeting.started',
      'meeting.ended',
      'participant.joined',
      'participant.left',
    ];

    // First, check existing webhooks
    const listResponse = await fetch(`${DAILY_API_URL}/webhooks`, {
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
      },
    });
    
    const existingWebhooks = await listResponse.json();
    
    // Delete any webhooks with old URLs
    for (const webhook of existingWebhooks.data || []) {
      if (webhook.url?.includes('vercel.app') || webhook.url?.includes('bpoc')) {
        console.log('🗑️ Deleting old webhook:', webhook.id, webhook.url);
        await fetch(`${DAILY_API_URL}/webhooks/${webhook.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${DAILY_API_KEY}`,
          },
        });
      }
    }

    // Create new webhook with correct URL
    const createResponse = await fetch(`${DAILY_API_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: webhookUrl,
        eventTypes,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      return NextResponse.json({ 
        error: 'Failed to create webhook',
        details: error,
      }, { status: 500 });
    }

    const newWebhook = await createResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Webhook configured successfully!',
      webhook: newWebhook,
      url: webhookUrl,
      events: eventTypes,
    });

  } catch (error) {
    console.error('Webhook creation error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}








