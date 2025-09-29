import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, mode } = await req.json()

    if (!image) {
      throw new Error('No image provided')
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    let systemPrompt = ''
    let userPrompt = ''

    if (mode === 'object') {
      systemPrompt = 'You are an assistive vision AI helping visually impaired users. Provide clear, detailed descriptions of objects, people, scenes, and surroundings in images. Focus on practical, helpful information.'
      userPrompt = 'Describe this image in detail. Include objects, people, colors, settings, actions, and any text visible. Be specific and helpful for someone who cannot see the image.'
    } else if (mode === 'text') {
      systemPrompt = 'You are an OCR assistant helping visually impaired users. Extract and read all visible text from images, including signs, labels, documents, and any written content.'
      userPrompt = 'Extract and return all text visible in this image. Include text from signs, labels, documents, books, screens, or any written content. If no text is found, say "No text detected in this image."'
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userPrompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      const errorText = await response.text()
      console.error('AI gateway error:', response.status, errorText)
      throw new Error('AI analysis failed')
    }

    const data = await response.json()
    const analysisText = data.choices?.[0]?.message?.content

    if (!analysisText) {
      throw new Error('No analysis result received')
    }

    const result = {
      description: mode === 'object' ? analysisText : undefined,
      detectedText: mode === 'text' ? analysisText : undefined,
      confidence: 0.9, // Gemini doesn't provide confidence scores, so we use a high default
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Vision analysis error:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Analysis failed. Please try again.' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})