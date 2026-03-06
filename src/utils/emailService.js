import dns from "dns";
import nodemailer from "nodemailer";

// Prefer IPv4 for SMTP (avoids ENETUNREACH on cloud hosts like Render where IPv6 to Gmail may fail)
dns.setDefaultResultOrder("ipv4first");

// Brevo HTTP API (use when SMTP DNS fails on Render - e.g. ENOTFOUND smtp.brevo.com)
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const sendViaBrevoApi = async (to, subject, html, fromEmail, fromName = "ShopSphere", bcc = null) => {
  // Prefer BREVO_API_KEY (Brevo → API Keys). Fallback to BREVO_SMTP_KEY so production can send without creating a new key.
  const rawKey = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY;
  const apiKey = rawKey ? String(rawKey).trim() : "";
  if (!apiKey) return { success: false, error: "Set BREVO_API_KEY or BREVO_SMTP_KEY in Render → Environment" };

  const body = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: to }],
    subject,
    htmlContent: html,
  };
  if (bcc) body.bcc = [{ email: bcc }];

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Brevo API ${res.status}: ${errText}`);
  }
  const data = await res.json();
  return { success: true, messageId: data.messageId };
};

// Create transporter (lazy initialization) - only used when not using Brevo API
let transporter = null;

const getTransporter = () => {
  const BREVO_EMAIL = process.env.BREVO_EMAIL;
  const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY;
  const EMAIL_HOST = process.env.EMAIL_HOST;
  const EMAIL_PORT = process.env.EMAIL_PORT || 587;
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;

  // When Brevo API key is set, sending is done via HTTP in sendEmail(); no SMTP transporter.
  if (process.env.BREVO_API_KEY) return null;

  if (!transporter) {
    let config;

    if (BREVO_EMAIL && BREVO_SMTP_KEY) {
      config = {
        host: "smtp.brevo.com",
        port: 587,
        secure: false,
        auth: { user: BREVO_EMAIL, pass: BREVO_SMTP_KEY },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      };
    } else if (EMAIL_HOST && EMAIL_USER && EMAIL_PASS) {
      config = {
        host: EMAIL_HOST,
        port: parseInt(EMAIL_PORT),
        secure: EMAIL_PORT == 465,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
      };
    } else {
      console.warn("⚠️  Email not configured.");
      console.warn("   On Render (production): set BREVO_API_KEY (recommended) or BREVO_EMAIL + BREVO_SMTP_KEY.");
      console.warn("   Local: set EMAIL_HOST, EMAIL_USER, EMAIL_PASS in .env");
      return null;
    }

    try {
      transporter = nodemailer.createTransport(config);
      console.log("✅ Email transporter initialized successfully");
    } catch (error) {
      console.error("❌ Failed to create email transporter:", error);
      return null;
    }
  }
  return transporter;
};

// Email templates
const emailTemplates = {
  orderConfirmation: (order, user) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    const orderItemsHtml = order.orderItems
      .map(
        (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <img src="${item.image}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toLocaleString()}</td>
      </tr>
    `
      )
      .join("");

    return {
      subject: `Order Confirmation - Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #10b981; margin: 0;">ShopSphere</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a1a; margin-top: 0;">Thank you for your order!</h2>
            <p>Hi ${user.name},</p>
            <p>We've received your order and it's being processed. Here are the details:</p>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a1a1a;">Order Details</h3>
              <p><strong>Order ID:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
              <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString("en-IN", { 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}</p>
              <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
              <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">${order.status || "Pending"}</span></p>
            </div>
            
            <h3 style="color: #1a1a1a;">Order Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Image</th>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Product</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee;">Quantity</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${orderItemsHtml}
              </tbody>
            </table>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 5px 0;">Subtotal:</td>
                  <td style="text-align: right; padding: 5px 0;">₹${order.itemsPrice.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">Tax:</td>
                  <td style="text-align: right; padding: 5px 0;">₹${order.taxPrice.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0;">Shipping:</td>
                  <td style="text-align: right; padding: 5px 0;">₹${order.shippingPrice.toLocaleString()}</td>
                </tr>
                <tr style="border-top: 2px solid #1a1a1a; font-weight: bold; font-size: 1.1em;">
                  <td style="padding: 10px 0;">Total:</td>
                  <td style="text-align: right; padding: 10px 0; color: #10b981;">₹${order.totalPrice.toLocaleString()}</td>
                </tr>
              </table>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #1a1a1a;">Shipping Address</h3>
              <p style="margin: 5px 0;">${order.shippingAddress.address}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.city}, ${order.shippingAddress.postalCode}</p>
              <p style="margin: 5px 0;">${order.shippingAddress.country}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/track?order=${order._id}&email=${encodeURIComponent(user.email)}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track your order</a>
            </div>
            
            <p style="color: #666; font-size: 0.9em; margin-top: 30px;">
              If you have any questions, please contact our support team.
            </p>
            
            <p style="color: #666; font-size: 0.9em;">
              Best regards,<br>
              The ShopSphere Team
            </p>
          </div>
        </body>
        </html>
      `,
    };
  },

  paymentConfirmation: (order, user) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    return {
      subject: `Payment Confirmed - Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Confirmed</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #10b981; margin: 0;">ShopSphere</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-top: 0;">✓ Payment Confirmed!</h2>
            <p>Hi ${user.name},</p>
            <p>Great news! Your payment for Order #${order._id.toString().slice(-8).toUpperCase()} has been successfully processed.</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0;"><strong>Payment Amount:</strong> ₹${order.totalPrice.toLocaleString()}</p>
              <p style="margin: 5px 0 0 0;"><strong>Payment Date:</strong> ${new Date(order.paidAt).toLocaleDateString("en-IN", { 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}</p>
            </div>
            
            <p>Your order is now being processed and will be shipped soon. You'll receive another email when your order ships.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/track?order=${order._id}&email=${encodeURIComponent(user.email)}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track your order</a>
            </div>
            
            <p style="color: #666; font-size: 0.9em;">
              Best regards,<br>
              The ShopSphere Team
            </p>
          </div>
        </body>
        </html>
      `,
    };
  },

  orderShipped: (order, user) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    return {
      subject: `Your Order Has Shipped - Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Shipped</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #10b981; margin: 0;">ShopSphere</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #3b82f6; margin-top: 0;">🚚 Your Order Has Shipped!</h2>
            <p>Hi ${user.name},</p>
            <p>Your order #${order._id.toString().slice(-8).toUpperCase()} has been shipped and is on its way to you!</p>
            
            <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0;"><strong>Order Status:</strong> <span style="color: #3b82f6; font-weight: bold;">Shipped</span></p>
              <p style="margin: 5px 0 0 0;"><strong>Expected Delivery:</strong> 3-5 business days</p>
            </div>
            
            <p>You can track your order using the link below. We'll notify you once your order is delivered.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/track?order=${order._id}&email=${encodeURIComponent(user.email)}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track your order</a>
            </div>
            
            <p style="color: #666; font-size: 0.9em;">
              Best regards,<br>
              The ShopSphere Team
            </p>
          </div>
        </body>
        </html>
      `,
    };
  },

  orderDelivered: (order, user) => {
    const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";
    return {
      subject: `Your Order Has Been Delivered - Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Delivered</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #10b981; margin: 0;">ShopSphere</h1>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #10b981; margin-top: 0;">🎉 Your Order Has Been Delivered!</h2>
            <p>Hi ${user.name},</p>
            <p>Great news! Your order #${order._id.toString().slice(-8).toUpperCase()} has been successfully delivered.</p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0;"><strong>Delivery Date:</strong> ${new Date(order.deliveredAt).toLocaleDateString("en-IN", { 
                year: "numeric", 
                month: "long", 
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}</p>
            </div>
            
            <p>We hope you love your purchase! If you have any questions or concerns, please don't hesitate to contact us.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${FRONTEND_URL}/track?order=${order._id}&email=${encodeURIComponent(user.email)}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">View order</a>
              <a href="${FRONTEND_URL}" style="display: inline-block; background-color: #1a1a1a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">Shop again</a>
            </div>
            
            <p style="color: #666; font-size: 0.9em;">
              Thank you for shopping with ShopSphere!<br>
              The ShopSphere Team
            </p>
          </div>
        </body>
        </html>
      `,
    };
  },

  orderCancelled: (order, user) => {
    return {
      subject: `Order Cancelled - Order #${order._id.toString().slice(-8).toUpperCase()}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Cancelled</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: #10b981; margin: 0;">ShopSphere</h1>
          </div>
          <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1a1a1a; margin-top: 0;">Order Cancelled</h2>
            <p>Hi ${user.name},</p>
            <p>Your order #${order._id.toString().slice(-8).toUpperCase()} has been cancelled as requested.</p>
            <p style="color: #666; font-size: 0.9em;">If you did not request this cancellation, please contact our support team.</p>
            <p style="color: #666; font-size: 0.9em;">Best regards,<br>The ShopSphere Team</p>
          </div>
        </body>
        </html>
      `,
    };
  },
};

// Send email function (optional bcc for client copy)
export const sendEmail = async (to, templateName, data, options = {}) => {
  try {
    const template = emailTemplates[templateName];
    if (!template) {
      console.error(`Email template "${templateName}" not found`);
      return { success: false, error: "Template not found" };
    }

    const emailContent = template(data.order, data.user);
    const EMAIL_FROM = process.env.EMAIL_FROM || process.env.BREVO_EMAIL || process.env.EMAIL_USER || "noreply@shopsphere.com";

    // Brevo HTTP API (avoids ENOTFOUND smtp.brevo.com on Render)
    if (process.env.BREVO_API_KEY) {
      const result = await sendViaBrevoApi(
        to,
        emailContent.subject,
        emailContent.html,
        EMAIL_FROM,
        "ShopSphere",
        options.bcc || undefined
      );
      if (result.success) {
        console.log(`✅ Email sent via Brevo API to ${to}`);
        if (options.bcc) console.log(`   📋 Copy sent to client: ${options.bcc}`);
      }
      return result;
    }

    const transporter = getTransporter();
    if (!transporter) {
      console.warn("⚠️  Email not configured. Skipping email send.");
      return { success: false, error: "Email not configured" };
    }

    const mailOptions = {
      from: `"ShopSphere" <${EMAIL_FROM}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
    };
    if (options.bcc) mailOptions.bcc = options.bcc;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}:`, info.messageId);
    if (options.bcc) console.log(`   📋 Copy sent to client: ${options.bcc}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error: error.message };
  }
};

// Client email gets a copy of every order (set CLIENT_EMAIL in Render/local .env)
const getClientEmail = () => {
  const email = process.env.CLIENT_EMAIL || process.env.NOTIFY_EMAIL || "";
  return email.trim() || null;
};

// Convenience functions
export const sendOrderConfirmationEmail = async (order, user) => {
  const to = user?.email;
  if (!to) {
    console.error("❌ Order confirmation skipped: no customer email (order user missing email)");
    return { success: false, error: "No customer email" };
  }
  const clientEmail = getClientEmail();
  return await sendEmail(to, "orderConfirmation", { order, user }, clientEmail ? { bcc: clientEmail } : {});
};

export const sendPaymentConfirmationEmail = async (order, user) => {
  return await sendEmail(user.email, "paymentConfirmation", { order, user });
};

export const sendOrderShippedEmail = async (order, user) => {
  return await sendEmail(user.email, "orderShipped", { order, user });
};

export const sendOrderDeliveredEmail = async (order, user) => {
  return await sendEmail(user.email, "orderDelivered", { order, user });
};

export const sendOrderCancelledEmail = async (order, user) => {
  return await sendEmail(user.email, "orderCancelled", { order, user });
};

export const sendPasswordResetEmail = async (user, resetUrl) => {
  const to = user?.email;
  if (!to) return { success: false, error: "No recipient email" };

  const EMAIL_FROM =
    process.env.EMAIL_FROM ||
    process.env.BREVO_EMAIL ||
    process.env.EMAIL_USER ||
    "noreply@shopsphere.com";

  const subject = "Reset your ShopSphere password";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Password Reset</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
        <div style="background-color: #1a1a1a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #10b981; margin: 0;">ShopSphere</h1>
        </div>
        <div style="background-color: white; padding: 28px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #1a1a1a; margin-top: 0;">Reset your password</h2>
          <p>Hi ${user?.name || "there"},</p>
          <p>We received a request to reset your ShopSphere password.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 12px 26px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 0.9em;">
            This link will expire in 1 hour. If you didn’t request a reset, you can safely ignore this email.
          </p>
          <p style="color: #666; font-size: 0.9em; margin-top: 18px;">
            If the button doesn’t work, copy and paste this link into your browser:
            <br />
            <span style="word-break: break-all;">${resetUrl}</span>
          </p>
          <p style="color: #666; font-size: 0.9em; margin-top: 24px;">
            Best regards,<br />
            The ShopSphere Team
          </p>
        </div>
      </body>
    </html>
  `;

  try {
    // In production, prefer Brevo HTTP API (works on Render). Try API if we have any Brevo key.
    const useApi = process.env.BREVO_API_KEY || (process.env.NODE_ENV === "production" && process.env.BREVO_SMTP_KEY);
    if (useApi) {
      const r = await sendViaBrevoApi(to, subject, html, EMAIL_FROM, "ShopSphere");
      return r;
    }
    const transporter = getTransporter();
    if (!transporter) return { success: false, error: "Email not configured" };
    const info = await transporter.sendMail({
      from: `"ShopSphere" <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Password reset email error:", error);
    return { success: false, error: error.message };
  }
};

// Low-stock alert to admin (products: array of { name, countInStock, price })
export const sendLowStockAlertEmail = async (products, threshold) => {
  const to = process.env.CLIENT_EMAIL || process.env.ADMIN_EMAIL || process.env.NOTIFY_EMAIL || "";
  const email = to.trim();
  if (!email) {
    console.warn("⚠️  Low-stock alert skipped: no CLIENT_EMAIL / ADMIN_EMAIL / NOTIFY_EMAIL");
    return { sent: false, message: "No admin email configured" };
  }
  const EMAIL_FROM = process.env.EMAIL_FROM || process.env.BREVO_EMAIL || process.env.EMAIL_USER || "noreply@shopsphere.com";
  const subject = `ShopSphere: Low stock alert (${products.length} products at or below ${threshold})`;
  const rows =
    products.length === 0
      ? "<tr><td colspan='3'>No products below threshold</td></tr>"
      : products
          .map(
            (p) =>
              `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(p.name)}</td><td style="padding:8px;border-bottom:1px solid #eee">${p.countInStock}</td><td style="padding:8px;border-bottom:1px solid #eee">₹${Number(p.price).toLocaleString()}</td></tr>`
          )
          .join("");
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><title>Low Stock Alert</title></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#b45309">⚠️ Low Stock Alert</h2>
      <p>Products with stock ≤ ${threshold}:</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f3f4f6"><th style="padding:8px;text-align:left">Product</th><th style="padding:8px">Stock</th><th style="padding:8px">Price</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="color:#666;font-size:12px">ShopSphere Admin</p>
    </body></html>
  `;
  function escapeHtml(s) {
    if (!s) return "";
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  try {
    if (process.env.BREVO_API_KEY) {
      const r = await sendViaBrevoApi(email, subject, html, EMAIL_FROM, "ShopSphere");
      return { sent: r.success };
    }
    const transporter = getTransporter();
    if (!transporter) return { sent: false, message: "Email not configured" };
    await transporter.sendMail({ from: `"ShopSphere" <${EMAIL_FROM}>`, to: email, subject, html });
    console.log(`✅ Low-stock alert sent to ${email}`);
    return { sent: true };
  } catch (err) {
    console.error("❌ Low-stock alert email error:", err);
    return { sent: false, message: err.message };
  }
};

export default {
  sendEmail,
  sendOrderConfirmationEmail,
  sendPaymentConfirmationEmail,
  sendOrderShippedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendPasswordResetEmail,
};
