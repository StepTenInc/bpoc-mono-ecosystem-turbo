import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

// Try both possible env var names for consistency with other routes
const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  throw new Error('CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable is not set')
}

const anthropic = new Anthropic({
  apiKey,
})

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json()

    if (!location || typeof location !== 'string' || location.trim() === '') {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    console.log('📍 Parsing location:', location)

    // Use Claude Haiku (cheap and fast) to parse location
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Parse this Philippine location into structured data. Return ONLY valid JSON, no markdown, no explanation.

Location: "${location}"

Expected JSON format:
{
  "city": "Angeles City",
  "province": "Pampanga",
  "country": "Philippines",
  "region": "Region 3 - Central Luzon",
  "barangay": null
}

Rules:
- If barangay is mentioned, extract it
- Always set country to "Philippines"
- Map province to correct region (1-18, NCR, CAR, BARMM)
- If city not clear, use province name
- Return null for fields you can't determine

Return ONLY the JSON object.`
        }
      ]
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Parse the response
    let parsedData
    try {
      // Remove any markdown code blocks if present
      let jsonText = content.text.trim()
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '')
      }

      parsedData = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse Claude response:', content.text)
      throw new Error('Failed to parse location data')
    }

    console.log('✅ Parsed location:', parsedData)

    // Get lat/lng from Google Geocoding API
    let lat = null
    let lng = null

    if (parsedData.city && parsedData.province) {
      try {
        const geocodeQuery = `${parsedData.city}, ${parsedData.province}, Philippines`
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(geocodeQuery)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`

        const geocodeRes = await fetch(geocodeUrl)
        const geocodeData = await geocodeRes.json()

        if (geocodeData.status === 'OK' && geocodeData.results[0]) {
          lat = geocodeData.results[0].geometry.location.lat
          lng = geocodeData.results[0].geometry.location.lng
          console.log('📍 Geocoded coordinates:', { lat, lng })
        }
      } catch (geocodeError) {
        console.warn('⚠️ Geocoding failed, continuing without lat/lng:', geocodeError)
        // Continue without lat/lng - not critical
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        city: parsedData.city || null,
        province: parsedData.province || null,
        country: parsedData.country || 'Philippines',
        region: parsedData.region || null,
        barangay: parsedData.barangay || null,
        lat,
        lng,
      }
    })

  } catch (error) {
    console.error('❌ Location parsing error:', error)
    return NextResponse.json(
      {
        error: 'Failed to parse location',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
