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

    const GOOGLE_AI_API_KEY = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!GOOGLE_AI_API_KEY) {
      throw new Error('GOOGLE_AI_API_KEY is not configured')
    }

    let prompt = ''

    if (mode === 'object') {
      prompt = 'You are an assistive vision AI helping visually impaired users. Describe this image in detail. Include objects, people, colors, settings, actions, and any text visible. Be specific and helpful for someone who cannot see the image.'
    } else if (mode === 'text') {
      prompt = 'Extract and return all text visible in this image. Include text from signs, labels, documents, books, screens, or any written content. If no text is found, say "No text detected in this image."'
    }

    // Google Gemini API with retry logic
    let response: Response | undefined;
    let retries = 3;
    
    while (retries > 0) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GOOGLE_AI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: image
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              maxOutputTokens: 1000,
              temperature: 0.4,
            }
          }),
        }
      )
      
      if (response.ok) break
      
      if (response.status === 503 && retries > 1) {
        console.log(`Gemini overloaded, retrying... (${retries - 1} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        retries--
        continue
      }
      
      break
    }

    if (!response) {
      throw new Error('Failed to get response from Gemini API')
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      
      if (response.status === 503) {
        return new Response(
          JSON.stringify({ error: 'AI service is temporarily busy. Please try again in a moment.' }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
      
      throw new Error('AI analysis failed')
    }

    const data = await response.json()
    console.log('Gemini response:', JSON.stringify(data))
    
    const analysisText = data.candidates?.[0]?.content?.parts?.[0]?.text

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