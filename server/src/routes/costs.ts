import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export const costsRouter = Router();

const templateSchema = z.object({ name: z.string().min(1), active: z.boolean().optional() });
const componentSchema = z.object({ name: z.string().min(1), method: z.enum(["fixed", "percent", "per_weight"]), value: z.number().nonnegative() });

costsRouter.post("/cost-templates", async (req, res) => {
  const parsed = templateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const t = await prisma.operationalCostTemplate.create({ data: { name: parsed.data.name, active: parsed.data.active ?? true } });
  res.status(201).json(t);
});

costsRouter.get("/cost-templates", async (_req, res) => {
  const list = await prisma.operationalCostTemplate.findMany({ include: { components: true } });
  res.json(list);
});

costsRouter.post("/cost-templates/:id/components", async (req, res) => {
  const parsed = componentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const c = await prisma.operationalCostComponent.create({ data: { templateId: req.params.id, name: parsed.data.name, method: parsed.data.method, value: parsed.data.value } });
  res.status(201).json(c);
});

costsRouter.post("/variants/:variantId/cost-template", async (req, res) => {
  const templateId = String(req.body?.templateId || "");
  if (!templateId) return res.status(400).json({ error: "templateId required" });
  const link = await prisma.variantCostTemplateLink.upsert({
    where: { variantId_templateId: { variantId: req.params.variantId, templateId } },
    update: {},
    create: { variantId: req.params.variantId, templateId }
  });
  res.status(201).json(link);
});


