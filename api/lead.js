// Collecte optionnelle et consentie des coordonnées du testeur, vers Airtable.
// Données minimales, consentement obligatoire, token côté serveur.
// Variables d'environnement : AIRTABLE_TOKEN, AIRTABLE_BASE_ID, AIRTABLE_TABLE (défaut "Leads").

const AIRTABLE_API = "https://api.airtable.com/v0";

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 5;
}

function validEmail(e) { return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 160; }

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Méthode non autorisée." }); return; }

  const token = process.env.AIRTABLE_TOKEN, base = process.env.AIRTABLE_BASE_ID;
  const table = process.env.AIRTABLE_TABLE || "Leads";
  if (!token || !base) { res.status(503).json({ error: "La collecte n'est pas configurée." }); return; }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (rateLimited(ip)) { res.status(429).json({ error: "Trop d'envois. Réessayez dans une minute." }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  if (body.consent !== true) { res.status(400).json({ error: "Le consentement est requis." }); return; }
  if (!validEmail(body.email)) { res.status(400).json({ error: "Email invalide." }); return; }

  const fields = {
    Date: new Date().toISOString(),
    Email: body.email,
    Entreprise: typeof body.entreprise === "string" ? body.entreprise.slice(0, 120) : "",
    Niveau: typeof body.niveau === "string" ? body.niveau.slice(0, 40) : "",
    Score: Number.isFinite(Number(body.score)) ? Number(body.score) : null,
    Consentement: true
  };

  try {
    const r = await fetch(`${AIRTABLE_API}/${base}/${encodeURIComponent(table)}`, {
      method: "POST",
      headers: { "content-type": "application/json", "authorization": `Bearer ${token}` },
      body: JSON.stringify({ fields, typecast: true })
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("Airtable error", r.status, t.slice(0, 300));
      res.status(502).json({ error: "Enregistrement impossible pour le moment." });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Service momentanément indisponible." });
  }
}
