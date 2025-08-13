import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface CodeRequestBody {
  email: string;
  firstName: string;
  lastName: string;
  verificationCode: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CodeRequestBody = await request.json();
    const { email, firstName, lastName, verificationCode } = body;

    if (!email || !firstName || !lastName || !verificationCode) {
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
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #007bff;">Bennett University Rideshare Platform</h2>
        <h3>Email Verification Code</h3>
        
        <p>Hello ${firstName},</p>
        
        <p>Thank you for signing up with Raahi. Please use the verification code below to complete your registration:</p>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="font-size: 32px; color: #007bff; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
        
        <p><strong>Important:</strong></p>
        <ul>
          <li>This code expires in 10 minutes</li>
          <li>Enter this code on the verification page</li>
          <li>Do not share this code with anyone</li>
        </ul>
        
        <p>If you didn't request this code, please ignore this email.</p>
        
        <p>Best regards,<br>The Raahi Team</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `Raahi Support <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Bennett University Rideshare - Verification Code",
      html: emailTemplate,
      text: `
        Raahi Email Verification
        
        Hello ${firstName},
        
        Your verification code is: ${verificationCode}
        
        This code expires in 10 minutes.
        
        Best regards,
        The Raahi Team
      `
    });

    

    return NextResponse.json({
      message: "Verification code sent successfully",
      messageId: info.messageId || "Unknown",
      recipient: email,
    });

  } catch (error: any) {
    

    return NextResponse.json(
      {
        message: "Failed to send verification code",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
