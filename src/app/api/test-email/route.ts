import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function GET() {
  const testEmail = "s24cseu1593@bennett.edu.in";
  
  const results = {
    tests: [] as any[],
    summary: {
      total: 0,
      successful: 0,
      failed: 0
    }
  };

  try {
    console.log("Testing Gmail SMTP...");
    
    const gmailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    await gmailTransporter.verify();
    
    const gmailInfo = await gmailTransporter.sendMail({
      from: `"Raahi Test - Gmail" <${process.env.GMAIL_USER}>`,
      to: testEmail,
      subject: "Test Email #1 - Gmail SMTP",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #28a745;">Gmail SMTP Test Successful</h2>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Method:</strong> Gmail App Password Authentication</p>
        </div>
      `
    });

    results.tests.push({
      method: "Gmail SMTP",
      status: "SUCCESS",
      messageId: gmailInfo.messageId
    });

  } catch (error: any) {
    results.tests.push({
      method: "Gmail SMTP",
      status: "FAILED",
      error: error.message
    });
  }

  try {
    const enhancedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const enhancedInfo = await enhancedTransporter.sendMail({
      from: `"Raahi Test - Enhanced" <${process.env.GMAIL_USER}>`,
      to: testEmail,
      subject: "Test Email #2 - Enhanced Headers",
      html: `<div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #007bff;">📧 Enhanced Headers Test</h2>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      </div>`,
      headers: {
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "Reply-To": process.env.GMAIL_USER || "",
      } as Record<string, string>
    });

    results.tests.push({
      method: "Gmail Enhanced Headers",
      status: "SUCCESS",
      messageId: enhancedInfo.messageId
    });

  } catch (error: any) {
    results.tests.push({
      method: "Gmail Enhanced Headers", 
      status: "FAILED",
      error: error.message
    });
  }

  try {
    const textTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const textInfo = await textTransporter.sendMail({
      from: `"Raahi Test - Text" <${process.env.GMAIL_USER}>`,
      to: testEmail,
      subject: "Test Email #3 - Plain Text Only",
      text: `Plain text test - ${new Date().toISOString()}`
    });

    results.tests.push({
      method: "Plain Text Only",
      status: "SUCCESS", 
      messageId: textInfo.messageId
    });

  } catch (error: any) {
    results.tests.push({
      method: "Plain Text Only",
      status: "FAILED",
      error: error.message
    });
  }

  try {
    const conservativeTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    const conservativeInfo = await conservativeTransporter.sendMail({
      from: `Raahi Support <${process.env.GMAIL_USER}>`,
      to: testEmail,
      subject: "Bennett University Rideshare Test Message",
      html: `<div style="font-family: Arial, sans-serif;">
        <h2>Bennett University Rideshare Platform</h2>
        <p>Test message - ${new Date().toISOString()}</p>
      </div>`
    });

    results.tests.push({
      method: "Conservative Format",
      status: "SUCCESS",
      messageId: conservativeInfo.messageId
    });

  } catch (error: any) {
    results.tests.push({
      method: "Conservative Format", 
      status: "FAILED",
      error: error.message
    });
  }

  results.summary.total = results.tests.length;
  results.summary.successful = results.tests.filter(t => t.status === "SUCCESS").length;
  results.summary.failed = results.tests.filter(t => t.status === "FAILED").length;

  return NextResponse.json({
    message: "Email delivery tests completed (fixed)",
    testEmail: testEmail,
    timestamp: new Date().toISOString(),
    results: results
  });
}
