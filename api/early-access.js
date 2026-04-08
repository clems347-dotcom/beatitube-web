export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://beatitube.com');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, role, location, source, message } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Send via Resend
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Beat <no-reply@beatitube.com>',
        to: 'contact@beatitube.com',
        subject: `🎵 Early Access Request — ${role || 'unknown'} — ${email}`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;">
            <h2 style="color:#FF4444;">New Early Access Request</h2>
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#888;width:120px;">Email</td><td style="padding:8px 0;"><strong>${email}</strong></td></tr>
              <tr><td style="padding:8px 0;color:#888;">Role</td><td style="padding:8px 0;">${role || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Location</td><td style="padding:8px 0;">${location || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Source</td><td style="padding:8px 0;">${source || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Message</td><td style="padding:8px 0;">${message || '—'}</td></tr>
            </table>
          </div>
        `,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
