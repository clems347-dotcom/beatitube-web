/**
 * Serverless Function — beatitube.com/track/{id}
 * 
 * Fetches track info from Supabase and returns HTML with Open Graph meta tags.
 * - Social platforms (WhatsApp, Discord, Twitter, etc.) see the OG preview
 * - Users on mobile get a deep link to the app or a fallback to the site
 */

const SUPABASE_URL = "https://nlqfxjbembgmtvmlbiow.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5scWZ4amJlbWJnbXR2bWxiaW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MDMxMTksImV4cCI6MjA1Nzk3OTExOX0.rg4-8xEPMOajVPHFpFMhHPcGBng5VjGPFaNewmxOJmQ";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || id.length < 10) {
    res.writeHead(302, { Location: "/" });
    res.end();
    return;
  }

  // Fetch track from Supabase
  let track = null;
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/feed_tracks?id=eq.${id}&select=track_title,artist_name,genres,user_handle,user_avatar,play_count,push_total,waveform_color&limit=1`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      track = data[0];
    }
  } catch (err) {
    console.error("Supabase fetch error:", err);
  }

  // Fallback values
  const title = track?.track_title || "Écoute ce son";
  const artist = track?.artist_name || track?.user_handle || "sur Beat";
  const genres = track?.genres?.slice(0, 3)?.join(", ") || "";
  const playCount = track?.play_count || 0;
  const pushTotal = track?.push_total || 0;
  const waveColor = track?.waveform_color || "red";

  // OG description
  const stats = [];
  if (playCount > 0) stats.push(`${playCount} écoutes`);
  if (pushTotal > 0) stats.push(`${pushTotal} pushes`);
  const description = [
    `${title} — ${artist}`,
    genres ? `🎵 ${genres}` : "",
    stats.length > 0 ? stats.join(" · ") : "",
    "Découvre sur Beat — l'app de découverte musicale",
  ].filter(Boolean).join(" | ");

  // OG image — use site og-image as fallback (no dynamic image generation for now)
  const ogImage = "https://beatitube.com/og-image.png";

  // Deep link
  const deepLink = `beat://track/${id}`;
  const appStoreUrl = "https://beatitube.com"; // TODO: replace with Play Store / App Store URL

  // Brand color based on waveform color
  const brandColor = "#FF4444";

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} — ${escapeHtml(artist)} | Beat</title>
  
  <!-- Open Graph -->
  <meta property="og:type" content="music.song">
  <meta property="og:title" content="${escapeHtml(title)} — ${escapeHtml(artist)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:url" content="https://beatitube.com/track/${id}">
  <meta property="og:site_name" content="Beat">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)} — ${escapeHtml(artist)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Favicon -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Outfit', sans-serif;
      background: #040408;
      color: #f0eeec;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .bg {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      z-index: 0;
    }
    
    .bg img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.6;
    }
    
    .card {
      position: relative;
      z-index: 1;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 24px;
      padding: 40px 32px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    
    .logo-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 32px;
    }
    
    .logo-row img { width: 36px; height: auto; }
    
    .logo-text {
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 4px;
      color: ${brandColor};
      text-shadow: 0 0 20px rgba(255,68,68,0.3);
    }
    
    .track-title {
      font-size: 26px;
      font-weight: 800;
      margin-bottom: 6px;
      line-height: 1.2;
    }
    
    .artist-name {
      font-size: 16px;
      color: rgba(255,255,255,0.6);
      font-weight: 600;
      margin-bottom: 20px;
    }
    
    .genres {
      font-size: 13px;
      color: rgba(255,255,255,0.4);
      margin-bottom: 8px;
    }
    
    .stats {
      font-size: 13px;
      color: rgba(255,255,255,0.35);
      margin-bottom: 28px;
    }
    
    .btn {
      display: inline-block;
      background: ${brandColor};
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      padding: 14px 36px;
      border-radius: 50px;
      text-decoration: none;
      letter-spacing: 0.5px;
      transition: transform 0.15s, box-shadow 0.15s;
      box-shadow: 0 4px 24px rgba(255,68,68,0.3);
    }
    
    .btn:hover {
      transform: scale(1.03);
      box-shadow: 0 6px 32px rgba(255,68,68,0.45);
    }
    
    .fallback {
      margin-top: 16px;
      font-size: 13px;
      color: rgba(255,255,255,0.35);
    }
    
    .fallback a {
      color: rgba(255,255,255,0.5);
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="bg">
    <img src="/space_static.webp" alt="" loading="eager">
  </div>
  
  <div class="card">
    <div class="logo-row">
      <img src="/logo-red.svg" alt="Beat">
      <span class="logo-text">BEAT</span>
    </div>
    
    <div class="track-title">${escapeHtml(title)}</div>
    <div class="artist-name">${escapeHtml(artist)}</div>
    
    ${genres ? `<div class="genres">🎵 ${escapeHtml(genres)}</div>` : ""}
    ${stats.length > 0 ? `<div class="stats">${stats.join(" · ")}</div>` : ""}
    
    <a href="${deepLink}" class="btn" id="openApp">Écouter sur Beat</a>
    
    <div class="fallback">
      L'app n'est pas installée ? <a href="${appStoreUrl}" id="storeLink">Télécharger Beat</a>
    </div>
  </div>
  
  <script>
    // Try deep link first, fallback to store after timeout
    var deepLink = "${deepLink}";
    var storeUrl = "${appStoreUrl}";
    
    document.getElementById("openApp").addEventListener("click", function(e) {
      e.preventDefault();
      var start = Date.now();
      window.location.href = deepLink;
      setTimeout(function() {
        // If still here after 1.5s, app probably not installed
        if (Date.now() - start < 2000) {
          window.location.href = storeUrl;
        }
      }, 1500);
    });
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.status(200).send(html);
}

function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
