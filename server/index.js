const express = require('express');
const cors = require('cors');
const path = require('path');

// Load environment variables from .env file in the same directory as this script
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Use gemini-2.0-flash as the default - it's the latest stable multimodal model
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

// Middleware - Allow all origins for Vercel deployment (or set CLIENT_URL for specific origin)
app.use(cors({
  origin: process.env.CLIENT_URL || true, // Allow all origins or set specific in env vars
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Handle preflight requests
app.options('*', cors());
app.use(express.json({ limit: '15mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'TenantShield API is running' });
});

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Health check for API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    hasGeminiKey: !!GEMINI_API_KEY,
    model: GEMINI_MODEL 
  });
});

app.post('/api/analyze', async (req, res) => {
  console.log('Received analyze request');
  
  if (!GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY environment variable');
    return res.status(500).json({ error: 'Missing Gemini API key on server. Please set GEMINI_API_KEY environment variable.' });
  }

  const { images, details, location } = req.body;

  if (!images?.length) {
    return res.status(400).json({ error: 'No images were provided for analysis' });
  }

  // Check total size
  const totalSize = JSON.stringify(images).length;
  if (totalSize > 12000000) { // ~12MB
    return res.status(413).json({ error: 'Images too large. Please reduce image size or quantity.' });
  }

  const imageParts = images
    .map((img) => {
      if (!img?.data) return null;
      const mimeType = img.mimeType || 'image/jpeg';

      return {
        inline_data: {
          mime_type: mimeType,
          data: img.data,
        },
      };
    })
    .filter(Boolean);

  if (!imageParts.length) {
    return res.status(400).json({ error: 'No valid images were provided' });
  }

  const prompt = `You are a housing safety and tenant-rights expert. Review the images and return JSON only. Do not add explanations or code fences.
Required JSON shape:
{
  "summary": "200–250 word plain-language explanation of what the image likely shows, possible hazards, health concerns, and urgency. If unclear, list possible interpretations.",
  
  "rights_summary": "Key tenant rights in the user's city/state: habitability rules, repair timelines, anti-retaliation protections, emergency repair options, landlord entry rules. Keep it simple and clear.",
  
  "applicable_laws": [
    "List main statutes or codes that commonly apply to this issue in the user's location. Briefly say why each law matters."
  ],
  
  "actions": [
    "List 5–8 practical steps for the tenant. Focus on: what to do now, how to request repairs, when to escalate, and how to protect themselves from retaliation."
  ],
  
  "landlord_message": "Short, polite message describing the issue, referencing the housing standard, and requesting a repair timeline.",
  
  "documentation": "Explain what to record: photos (angles + close-ups), timestamps, notes about when issue started or worsened, communication logs, receipts, and health symptoms if relevant.",
  
  "evidence_checklist": [
    "Wide + close-up photos",
    "Location/context shot",
    "Video if issue is active (dripping, sparking, pests)",
    "Measurements (size, spread)",
    "Timeline notes"
  ],
  
  "clinic_links": [
    {"name": "Nearest legal aid or tenant clinic", "link": "https://www.google.com/maps/search/legal+aid+clinic+<city_or_zip>"}
  ]
}

Location context: ${location || 'No location given.'}
Tenant notes: ${details || 'No additional details provided.'}
If you are unsure of exact laws, provide the best general housing safety laws for the given location. Keep lists concise.`;

  try {
    console.log(`Calling Gemini API with model: ${GEMINI_MODEL}`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }, ...imageParts],
            },
          ],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.25,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      
      // Parse error for better messaging
      let errorMessage = 'Gemini request failed';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message;
        }
      } catch (e) {
        // Use raw error text if not JSON
        errorMessage = errorText.substring(0, 200);
      }
      
      return res.status(502).json({ error: errorMessage, details: errorText });
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    const rawContent =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text)
        .filter(Boolean)
        .join('')
        .trim() || '';

    let parsed;
    try {
      parsed = rawContent ? JSON.parse(rawContent) : null;
    } catch (err) {
      console.error('Gemini JSON parse error:', err.message);
      console.error('Raw content:', rawContent.substring(0, 500));
    }

    const summary =
      parsed?.summary ||
      rawContent ||
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text)
        .filter(Boolean)
        .join('\n')
        .trim() ||
      '';

    if (!summary) {
      // Check for safety blocks or other issues
      const finishReason = data?.candidates?.[0]?.finishReason;
      if (finishReason === 'SAFETY') {
        return res.status(400).json({ error: 'The image was blocked by safety filters. Please try a different image.' });
      }
      return res.status(500).json({ error: 'Gemini did not return any analysis. Please try again.' });
    }

    const report = {
      summary,
      rightsSummary: parsed?.rights_summary || parsed?.rightsSummary || '',
      applicableLaws: parsed?.applicable_laws || parsed?.laws || [],
      actions: parsed?.actions || parsed?.steps || [],
      landlordMessage: parsed?.landlord_message || parsed?.landlordMessage || '',
      documentation: parsed?.documentation || '',
      evidenceChecklist: parsed?.evidence_checklist || parsed?.checklist || [],
      clinicLinks: parsed?.clinic_links || parsed?.clinics || [],
      raw: rawContent,
    };

    console.log('Analysis complete, sending response');
    res.json({ summary, report });
  } catch (error) {
    console.error('Gemini analysis failed:', error);
    res.status(500).json({ error: 'Failed to analyze the image(s)', details: error.message });
  }
});

// POST /clinics - server-side Places Nearby Search (new Places API)
app.post('/clinics', async (req, res) => {
  const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!PLACES_KEY) return res.status(500).json({ ok: false, error: 'Missing GOOGLE_PLACES_API_KEY on server' });

  const { lat, lng } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ ok: false, error: 'Request body must include numeric lat and lng' });
  }

  const url = `https://places.googleapis.com/v1/places:searchNearby?key=${PLACES_KEY}`;
  const fieldMask = 'places.displayName,places.formattedAddress,places.location,places.rating';

  const body = {
    includedTypes: ['lawyer', 'local_government_office'],
    includedPrimaryTypes: ['establishment'],
    locationRestriction: {
      circle: {
        center: { latitude: lat, longitude: lng },
        radius: 5000,
      },
    },
    rankPreference: 'DISTANCE',
    pageSize: 10,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Places searchNearby error:', text);
      return res.status(502).json({ ok: false, error: 'Places API error', details: text });
    }

    const data = await response.json();
    const rawResults = data?.results || data?.places || [];

    const clinics = rawResults
      .map((r) => {
        const p = r.place || r;
        const displayName = p?.displayName?.text || p?.displayName || p?.name || '';
        const formattedAddress = p?.formattedAddress || p?.formatted_address || '';
        const locationObj = p?.location || p?.geometry || {};
        const latitude = locationObj?.latitude ?? locationObj?.lat ?? (locationObj?.latLng?.latitude ?? null);
        const longitude = locationObj?.longitude ?? locationObj?.lng ?? (locationObj?.latLng?.longitude ?? null);
        const rating = p?.rating ?? null;
        if (latitude == null || longitude == null) return null;
        return {
          displayName,
          formattedAddress,
          location: { latitude, longitude },
          rating,
        };
      })
      .filter(Boolean)
      .slice(0, 10);

    return res.json({ ok: true, clinics });
  } catch (err) {
    console.error('Error calling Places searchNearby:', err);
    return res.status(500).json({ ok: false, error: 'Internal server error', details: err.message });
  }
});

// For local development, listen on port
// For Vercel serverless, this won't run but the export below is used
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Gemini API Key: ${GEMINI_API_KEY ? 'Set ✓' : 'NOT SET ✗'}`);
    console.log(`Gemini Model: ${GEMINI_MODEL}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
