import { Router } from "express";
import fetch from "node-fetch";

export const mapsRouter = Router();

mapsRouter.get("/autocomplete", async (req, res) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: "maps api key missing" });
  const input = String(req.query.input || "");
  if (!input) return res.status(400).json({ error: "input required" });
  const url = new URL("https://maps.googleapis.com/maps/api/place/autocomplete/json");
  url.searchParams.set("input", input);
  url.searchParams.set("key", key);
  const r = await fetch(url.toString());
  const j = await r.json();
  res.json(j);
});

mapsRouter.get("/geocode", async (req, res) => {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).json({ error: "maps api key missing" });
  const place_id = String(req.query.place_id || "");
  if (!place_id) return res.status(400).json({ error: "place_id required" });
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("place_id", place_id);
  url.searchParams.set("key", key);
  const r = await fetch(url.toString());
  const j = await r.json();
  res.json(j);
});


