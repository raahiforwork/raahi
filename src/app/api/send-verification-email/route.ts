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
      }
    });

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #28a745;">Welcome to Raahi, ${firstName}!</h2>
        <p><strong>Thanks for signing up with your Bennett email.</strong></p>
        <p>To complete your registration, please click the link below:</p>
        <p><a href="${verificationUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email Address</a></p>
        <p><small>This link expires in 24 hours. If you didn't create this account, please ignore this email.</small></p>
        <p>Best regards,<br>The Raahi Team</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Raahi Test - Gmail" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Verify Your Raahi Account",
      html: emailTemplate
    });

    console.log("Verification email sent successfully:", info.messageId);

    return NextResponse.json({
      message: "Verification email sent successfully",
      messageId: info.messageId || "Unknown",
      recipient: email,
    });

  } catch (error: any) {
    console.error("Email sending error:", error);

    return NextResponse.json(
      {
        message: "Failed to send verification email",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}