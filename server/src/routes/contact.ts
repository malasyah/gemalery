import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const contactRouter = Router();

// Submit contact message
contactRouter.post("/", async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name is required" });
  }
  
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }
  
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "Message is required" });
  }
  
  try {
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        subject: subject?.trim() || null,
        message: message.trim()
      }
    });
    res.status(201).json({ message: "Contact message submitted successfully", id: contactMessage.id });
  } catch (error: any) {
    console.error("Error creating contact message:", error);
    res.status(500).json({ error: error.message || "Failed to submit contact message" });
  }
});

