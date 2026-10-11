import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error.js';
import { sendEmail } from '../services/email.js';
import { env } from '../config/env.js';

const router = Router();

const contactSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    subject: z.string().min(3).max(200),
    message: z.string().min(10).max(5000),
  }),
});

router.post('/', validate(contactSchema), asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;

  // Build auto-reply to the sender
  const autoReplyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #5cffd9; margin: 0; font-size: 20px;">Top Shelf Exotics</h1>
      </div>
      <div style="background: #1a1a1a; padding: 32px 24px; color: #e0e0e0;">
        <h2 style="color: #fff; margin-top: 0;">We received your message</h2>
        <p>Hey ${name},</p>
        <p>Thanks for reaching out! We've received your inquiry and our team will get back to you within 24 hours.</p>
        <div style="background: #0a0a0a; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #888; font-size: 12px; margin: 0 0 4px;">Your message:</p>
          <p style="color: #e0e0e0; margin: 0;"><strong>${subject}</strong></p>
          <p style="color: #888; font-size: 13px; margin: 8px 0 0;">${message.substring(0, 300)}${message.length > 300 ? '...' : ''}</p>
        </div>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${env.appUrl}" style="display: inline-block; background: #5cffd9; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Visit Top Shelf Exotics</a>
        </div>
        <p style="color: #888; font-size: 13px;">If you didn't submit this form, please ignore this email.</p>
      </div>
      <div style="background: #0a0a0a; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #555; font-size: 12px; margin: 0;">Top Shelf Exotics &mdash; Premium Cannabis &amp; Collab Gear</p>
      </div>
    </div>
  `;

  // Send auto-reply to the person who contacted
  await sendEmail(email, `Thanks for reaching out, ${name}!`, autoReplyHtml);

  // Also notify the store (if admin email is configured)
  const adminNotificationHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
    </div>
  `;
  if (env.smtpFromEmail) {
    sendEmail(env.smtpFromEmail, `New Contact: ${subject}`, adminNotificationHtml).catch(() => {});
  }

  res.json({ success: true, message: 'Message received. Check your email for a confirmation.' });
}));

export default router;
