import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    console.warn('[email] SMTP not configured — emails will be logged to console');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });

  return transporter;
}

function buildBaseMail(to: string, subject: string, html: string) {
  return {
    from: `"${env.smtpFromName}" <${env.smtpFromEmail}>`,
    to,
    subject,
    html,
  };
}

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const t = getTransporter();

  if (!t) {
    console.log(`[email] TO: ${to}`);
    console.log(`[email] SUBJECT: ${subject}`);
    console.log(`[email] BODY: ${html.substring(0, 500)}...`);
    return true;
  }

  try {
    await t.sendMail(buildBaseMail(to, subject, html));
    return true;
  } catch (err) {
    console.error('[email] Failed to send:', err);
    return false;
  }
}

export function buildOtpEmail(otp: string, name: string, email?: string): string {
  const verificationLink = email ? `${env.appUrl}/verify-email?token=otp-placeholder&email=${encodeURIComponent(email)}` : env.appUrl;
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #5cffd9; margin: 0; font-size: 20px;">Top Shelf Exotics</h1>
      </div>
      <div style="background: #1a1a1a; padding: 32px 24px; color: #e0e0e0;">
        <h2 style="color: #fff; margin-top: 0;">Verify your email</h2>
        <p>Hey ${name},</p>
        <p>Thanks for signing up! Use the code below to verify your email address:</p>
        <div style="background: #0a0a0a; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #5cffd9;">${otp}</span>
        </div>
        <p style="color: #888; font-size: 13px;">This code expires in 10 minutes. If you didn't create an account, ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;" />
        <p style="font-size: 13px; color: #666;">Or click the link below to verify instantly:</p>
        <a href="${env.appUrl}/verify-email?token=otp&email=${encodeURIComponent(email || '')}" style="color: #5cffd9; font-size: 13px;">Verify Email</a>
      </div>
      <div style="background: #0a0a0a; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #555; font-size: 12px; margin: 0;">Top Shelf Exotics &mdash; Premium Cannabis &amp; Collab Gear</p>
      </div>
    </div>
  `;
}

export function buildVerificationLinkEmail(link: string, name: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #5cffd9; margin: 0; font-size: 20px;">Top Shelf Exotics</h1>
      </div>
      <div style="background: #1a1a1a; padding: 32px 24px; color: #e0e0e0;">
        <h2 style="color: #fff; margin-top: 0;">Confirm your email</h2>
        <p>Hey ${name},</p>
        <p>Click the button below to verify your email address and activate your account:</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${link}" style="display: inline-block; background: #5cffd9; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Verify Email</a>
        </div>
        <p style="color: #888; font-size: 13px;">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
      <div style="background: #0a0a0a; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #555; font-size: 12px; margin: 0;">Top Shelf Exotics &mdash; Premium Cannabis &amp; Collab Gear</p>
      </div>
    </div>
  `;
}

export function buildOrderConfirmationEmail(orderNumber: string, name: string, items: { title: string; qty: number; price: number }[], total: number): string {
  const itemsHtml = items.map(i => `
    <tr>
      <td style="padding: 8px 0; color: #e0e0e0;">${i.qty}x ${i.title}</td>
      <td style="padding: 8px 0; color: #e0e0e0; text-align: right;">$${i.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #5cffd9; margin: 0; font-size: 20px;">Top Shelf Exotics</h1>
      </div>
      <div style="background: #1a1a1a; padding: 32px 24px; color: #e0e0e0;">
        <h2 style="color: #fff; margin-top: 0;">Order Confirmed 🎉</h2>
        <p>Hey ${name},</p>
        <p>Your order <strong style="color: #5cffd9;">#${orderNumber}</strong> has been placed and is being processed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 0; border-bottom: 1px solid #333; color: #888;">Item</th>
              <th style="text-align: right; padding: 8px 0; border-bottom: 1px solid #333; color: #888;">Price</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align: right; color: #fff; font-size: 18px; font-weight: bold; padding-top: 8px; border-top: 1px solid #333;">
          Total: $${total.toFixed(2)}
        </div>
        <hr style="border: none; border-top: 1px solid #333; margin: 24px 0;" />
        <p style="color: #888; font-size: 13px;">You'll receive a shipping update when your order ships. Thank you for choosing Top Shelf Exotics!</p>
      </div>
      <div style="background: #0a0a0a; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #555; font-size: 12px; margin: 0;">Top Shelf Exotics &mdash; Premium Cannabis &amp; Collab Gear</p>
      </div>
    </div>
  `;
}

export function buildOAuthWelcomeEmail(name: string, provider: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #0a0a0a; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: #5cffd9; margin: 0; font-size: 20px;">Top Shelf Exotics</h1>
      </div>
      <div style="background: #1a1a1a; padding: 32px 24px; color: #e0e0e0;">
        <h2 style="color: #fff; margin-top: 0;">Welcome to Top Shelf Exotics!</h2>
        <p>Hey ${name},</p>
        <p>You've successfully signed in with <strong style="color: #5cffd9;">${provider}</strong>.</p>
        <p>Your account is already verified — you can start shopping right away.</p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${env.appUrl}/shop" style="display: inline-block; background: #5cffd9; color: #0a0a0a; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Browse the Shop</a>
        </div>
        <p style="color: #888; font-size: 13px;">If this wasn't you, please contact us immediately.</p>
      </div>
      <div style="background: #0a0a0a; padding: 16px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="color: #555; font-size: 12px; margin: 0;">Top Shelf Exotics &mdash; Premium Cannabis &amp; Collab Gear</p>
      </div>
    </div>
  `;
}
