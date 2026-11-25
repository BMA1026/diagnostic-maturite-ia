// Diagnostic de maturité IA, fonction serverless (Vercel, Node 18+).
// Principe : le score est calculé en code (déterministe, reproductible),
// le modèle Claude rédige le diagnostic à partir de ce score et du référentiel.
// La clé API reste côté serveur.

import { DIMENSIONS, LEVELS, levelIndex } from "../data/framework.js";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5-5";

const SYSTEM = [
  "Tu es un consultant senior en transformation IA qui rédige un diagnostic de maturité pour un dirigeant de PME ou d'ETI.",
  "On te donne un score de maturité déjà calculé (tu ne le recalcules jamais) et, pour chaque dimension, la recommandation du référentiel correspondant au niveau atteint.",
  "Tu t'appuies uniquement sur ces éléments. Tu n'inventes aucun chiffre, aucun benchmark, aucun nom de client, aucune statistique.",
  "Style sobre, concret, orienté décision. Phrases de longueurs variées. Pas de tiret cadratin.",
  "Tu réponds UNIQUEMENT avec un objet JSON valide conforme au schéma, sans texte autour et sans balises de code."
].join("\n");

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60 * 1000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > 6;
}

function round1(n) { return Math.round(n * 10) / 10; }

function scoreFromAnswers(answers) {
  const dims = DIMENSIONS.map((d) => {
    const vals = d.questions.map((_, i) => Number(answers[`${d.id}_${i}`]));
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { id: d.id, label: d.label, score: round1(avg), level: levelIndex(avg), reco: d.reco[levelIndex(avg)] };
  });
  const global = round1(dims.reduce((a, d) => a + d.score, 0) / dims.length);
  return { dims, global, globalLevel: levelIndex(global) };
}

function validAnswers(answers) {
  if (!answers || typeof answers !== "object") return false;
  for (const d of DIMENSIONS) {
    for (let i = 0; i < d.questions.length; i++) {
      const v = Number(answers[`${d.id}_${i}`]);
      if (!Number.isFinite(v) || v < 0 || v > 4) return false;
    }
  }
  return true;
}

function extractJson(text) {
  let t = String(text).trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST") { res.status(405).json({ error: "Méthode non autorisée." }); return; }
  if (!process.env.ANTHROPIC_API_KEY) { res.status(500).json({ error: "Clé API absente côté serveur." }); return; }

  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
  if (rateLimited(ip)) { res.status(429).json({ error: "Trop de diagnostics d'affilée. Réessayez dans une minute." }); return; }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const answers = body && body.answers;
  if (!validAnswers(answers)) { res.status(400).json({ error: "Réponses incomplètes ou invalides." }); return; }

  const { dims, global, globalLevel } = scoreFromAnswers(answers);
  const niveau = { score: global, label: LEVELS[globalLevel].label };

  const grounding = dims
    .map((d) => `- ${d.label} : ${d.score}/4 (niveau ${LEVELS[d.level].label}). Recommandation du référentiel : ${d.reco}`)
    .join("\n");

  const userMsg = [
    `Score global de maturité IA : ${global}/4 (niveau ${niveau.label}).`,
    `Détail par dimension :\n${grounding}`,
    "",
    "Produis uniquement cet objet JSON :",
    `{
  "synthese": "3 à 4 phrases : où en est l'entreprise et quel est le prochain cap",
  "forces": ["2 à 3 points forts, appuyés sur les dimensions les mieux notées"],
  "angles_morts": ["2 à 3 priorités, appuyées sur les dimensions les moins notées"],
  "feuille_de_route": [{"priorite": 1, "action": "...", "pourquoi": "...", "horizon": "0-3 mois"}],
  "cas_usage": [{"titre": "...", "gain_vise": "..."}],
  "conformite": "1 à 2 phrases sur le RGPD et l'AI Act, selon le score de gouvernance"
}`,
    "La feuille de route compte 3 à 4 actions ordonnées par priorité. Les cas d'usage : 2 à 3. Reste cohérent avec les recommandations du référentiel ci-dessus."
  ].join("\n");

  try {
    const r = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: SYSTEM,
        messages: [{ role: "user", content: userMsg }]
      })
    });
    const data = await r.json();
    if (!r.ok) { console.error("Anthropic error", r.status, data); res.status(502).json({ error: "Service momentanément indisponible." }); return; }
    if (data.stop_reason === "refusal") { res.status(502).json({ error: "Diagnostic indisponible pour cette entrée." }); return; }

    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    let diagnostic;
    try {
      diagnostic = extractJson(text);
    } catch (e) {
      console.error("JSON parse failed", text.slice(0, 400));
      res.status(502).json({ error: "Diagnostic mal formé, merci de relancer." });
      return;
    }
    if (!diagnostic || typeof diagnostic.synthese !== "string" || !Array.isArray(diagnostic.feuille_de_route)) {
      res.status(502).json({ error: "Diagnostic incomplet, merci de relancer." });
      return;
    }

    res.status(200).json({
      niveau_global: niveau,
      dimensions: dims.map((d) => ({ id: d.id, label: d.label, score: d.score, niveau: LEVELS[d.level].label })),
      diagnostic
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Service momentanément indisponible." });
  }
}
