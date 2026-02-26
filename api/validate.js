module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { answer, category, letter } = req.body || {};

    if (!answer || !category || !letter) {
        return res.status(400).json({ error: 'Missing fields' });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error('GEMINI_API_KEY manquante');
        return res.status(500).json({ error: 'API key not configured' });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Est-ce que "${answer}" est un(e) ${category} valide commençant par la lettre "${letter}" ? Réponds UNIQUEMENT par OUI ou NON.`
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 10,
                    temperature: 0
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Gemini error:', response.status, errorText);
            return res.status(500).json({ error: 'Gemini API error', isValid: false });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim().toUpperCase() || 'NON';
        const isValid = text.startsWith('OUI');

        console.log(`"${answer}" (${category}, lettre ${letter}) → ${text} → isValid: ${isValid}`);

        return res.status(200).json({ isValid });

    } catch (error) {
        console.error('Fetch error:', error.message);
        return res.status(500).json({ error: error.message, isValid: false });
    }
};