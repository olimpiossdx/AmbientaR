/**
 * Ingestão de leituras telemétricas (equipamento / gateway → Firestore).
 *
 * Configure: firebase functions:config:set telemetry.secret="SEU_TOKEN_LONGO"
 * Header: Authorization: Bearer <o mesmo token>
 *
 * Corpo JSON (exemplo):
 * {
 *   "outorgaId": "abc" | omitir,
 *   "usoInsignificanteId": "xyz" | omitir,
 *   "pontoId": "ponto-uuid",
 *   "timestamp": "2026-03-24T12:00:00.000Z",
 *   "pumpOn": true,
 *   "flowRateM3s": 0.001,
 *   "flowRateM3h": 3.6
 * }
 *
 * Exatamente um de outorgaId ou usoInsignificanteId deve ser informado.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}

function cors(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

exports.ingestTelemetry = functions.https.onRequest(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }

  const cfg = functions.config().telemetry || {};
  const secret = process.env.TELEMETRY_INGEST_SECRET || cfg.secret;
  const auth = req.get("Authorization") || "";
  const expected = secret ? `Bearer ${secret}` : null;

  if (!expected || auth !== expected) {
    res.status(401).send("Unauthorized");
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).send("Invalid JSON");
      return;
    }
  }

  const outorgaId = typeof body.outorgaId === "string" ? body.outorgaId.trim() : "";
  const usoId =
    typeof body.usoInsignificanteId === "string"
      ? body.usoInsignificanteId.trim()
      : "";

  if ((!outorgaId && !usoId) || (outorgaId && usoId)) {
    res
      .status(400)
      .send("Informe exatamente um de: outorgaId ou usoInsignificanteId");
    return;
  }

  const pontoId = typeof body.pontoId === "string" ? body.pontoId.trim() : "";
  const timestamp =
    typeof body.timestamp === "string" ? body.timestamp.trim() : "";
  const pumpOn = body.pumpOn === true;

  if (!pontoId || !timestamp) {
    res.status(400).send("pontoId e timestamp são obrigatórios");
    return;
  }

  const doc = {
    pontoId,
    timestamp,
    pumpOn,
  };
  if (outorgaId) doc.outorgaId = outorgaId;
  if (usoId) doc.usoInsignificanteId = usoId;

  const optNum = (k) =>
    typeof body[k] === "number" && Number.isFinite(body[k]) ? body[k] : undefined;

  const maybe = {
    flowRateM3s: optNum("flowRateM3s"),
    flowRateM3h: optNum("flowRateM3h"),
    flowRateLmin: optNum("flowRateLmin"),
    pulsesPerSecond: optNum("pulsesPerSecond"),
    nivelM: optNum("nivelM"),
    ph: optNum("ph"),
    downstreamResidualM3s: optNum("downstreamResidualM3s"),
    downstreamMinLevelM: optNum("downstreamMinLevelM"),
    alertRed: body.alertRed === true ? true : undefined,
    alertOrange: body.alertOrange === true ? true : undefined,
    dataQuality:
      typeof body.dataQuality === "string" ? body.dataQuality : undefined,
  };
  Object.keys(maybe).forEach((k) => {
    if (maybe[k] !== undefined) doc[k] = maybe[k];
  });

  try {
    await admin.firestore().collection("telemetryReadings").add(doc);
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).send("Failed to write");
  }
});
