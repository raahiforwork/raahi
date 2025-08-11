import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface EmailRequestBody {
  email: string;
  firstName: string;
  lastName: string;
  verificationUrl: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: EmailRequestBody = await request.json();
    const { email, firstName, lastName, verificationUrl } = body;

    if (!email || !firstName || !lastName || !verificationUrl) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 },
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 20000,
      rateLimit: 5
    });

    const emailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Raahi Account</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #007bff; text-align: center;">Welcome to Raahi, ${firstName}!</h1>
          
          <p>Thanks for signing up with your Bennett email. We're excited to help you connect with fellow students for ridesharing.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <p><strong>To complete your registration:</strong></p>
            <p style="margin: 15px 0;">
              <a href="${verificationUrl}" 
                 style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address →
              </a>
            </p>
          </div>
          
          <p><small>This link expires in 24 hours. If you didn't create this account, please ignore this email.</small></p>
          
          <p>Best regards,<br>The Raahi Team</p>
          
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #666;">
            Raahi - Bennett University Rideshare Platform<br>
            This is an automated message, please do not reply.
          </p>
        </div>
      </body>
      </html>
    `;

    await transporter.verify();
    console.log('Gmail transporter verified successfully');

    const info = await transporter.sendMail({
      from: `"Raahi - Bennett Rideshare" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify Your Raahi Account - Action Required",
      html: emailTemplate,
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "Reply-To": process.env.GMAIL_USER || "",
        "Return-Path": process.env.GMAIL_USER || "",
        "Message-ID": `<${Date.now()}-${Math.random().toString(36).substr(2, 9)}@raahi.app>`,
        "X-Mailer": "Raahi Email Service",
        "Content-Type": "text/html; charset=UTF-8",
      } as Record<string, string>,
      envelope: {
        from: process.env.GMAIL_USER || "",
        to: email,
      },
      text: `Welcome to Raahi, ${firstName}!

Thanks for signing up with your Bennett email. To complete your registration, please copy and paste this link into your browser:

${verificationUrl}

This link expires in 24 hours. If you didn't create this account, please ignore this email.

Best regards,
The Raahi Team`,
    });

    console.log("Verification email sent successfully:", info.messageId);

    return NextResponse.json({
      message: "Verification email sent successfully",
      messageId: info.messageId || "Unknown",
      recipient: email,
    });

  } catch (error: any) {
    console.error("Email sending error:", error);

    let errorMessage = "Failed to send verification email";
    let statusCode = 500;

    if (error.code === "EAUTH") {
      errorMessage = "Gmail authentication failed. Check your app password.";
      statusCode = 401;
    } else if (error.code === "ECONNECTION") {
      errorMessage = "Connection failed. Check your internet connection.";
      statusCode = 503;
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "Request timed out. Please try again.";
      statusCode = 408;
    }

    return NextResponse.json(
      {
        message: errorMessage,
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
        code: error.code
      },
      { status: statusCode },
    );
  }
}