import { Resend } from "resend";

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!xReplitToken) {
    throw new Error("X-Replit-Token not found for repl/depl");
  }

  connectionSettings = await fetch(
    "https://" + hostname + "/api/v2/connection?include_secrets=true&connector_names=resend",
    {
      headers: {
        Accept: "application/json",
        "X-Replit-Token": xReplitToken,
      },
    }
  ).then((res) => res.json()).then((data) => data.items?.[0]);

  if (!connectionSettings || !connectionSettings.settings.api_key) {
    throw new Error("Resend not connected");
  }
  return {
    apiKey: connectionSettings.settings.api_key,
    fromEmail: connectionSettings.settings.from_email,
  };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}

export async function sendVerificationEmail(
  toEmail: string,
  code: string,
  firstName?: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();

    const greeting = firstName ? `Hi ${firstName}` : "Hi there";

    await client.emails.send({
      from: fromEmail || "Trust Layer <noreply@resend.dev>",
      to: toEmail,
      subject: "Trust Layer - Verify Your Email",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0c1224; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #00ffff; font-size: 24px; margin: 0;">Trust Layer</h1>
            <p style="color: #8899aa; font-size: 14px; margin-top: 4px;">Blockchain Ecosystem Hub</p>
          </div>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #e0e6ed; font-size: 16px; margin: 0 0 8px 0;">${greeting},</p>
            <p style="color: #8899aa; font-size: 14px; margin: 0 0 24px 0;">Enter this code to verify your email address:</p>
            <div style="background: rgba(0,255,255,0.08); border: 2px solid rgba(0,255,255,0.2); border-radius: 8px; padding: 16px; margin: 0 auto; display: inline-block;">
              <span style="font-size: 32px; letter-spacing: 8px; color: #00ffff; font-weight: 700;">${code}</span>
            </div>
            <p style="color: #8899aa; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes.</p>
          </div>
          <p style="color: #556677; font-size: 11px; text-align: center; margin-top: 32px;">
            Protected by TrustShield.tech<br/>
            &copy; 2026 DarkWave Studios LLC
          </p>
        </div>
      `,
    });

    console.log(`Verification email sent to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error("Failed to send verification email:", error?.message);
    return false;
  }
}

export async function sendPasswordResetEmail(
  toEmail: string,
  code: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();

    await client.emails.send({
      from: fromEmail || "Trust Layer <noreply@resend.dev>",
      to: toEmail,
      subject: "Trust Layer - Password Reset",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; background: #0c1224; color: #ffffff;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #00ffff; font-size: 24px; margin: 0;">Trust Layer</h1>
          </div>
          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px; text-align: center;">
            <p style="color: #e0e6ed; font-size: 16px; margin: 0 0 8px 0;">Password Reset Request</p>
            <p style="color: #8899aa; font-size: 14px; margin: 0 0 24px 0;">Enter this code to reset your password:</p>
            <div style="background: rgba(0,255,255,0.08); border: 2px solid rgba(0,255,255,0.2); border-radius: 8px; padding: 16px; margin: 0 auto; display: inline-block;">
              <span style="font-size: 32px; letter-spacing: 8px; color: #00ffff; font-weight: 700;">${code}</span>
            </div>
            <p style="color: #8899aa; font-size: 12px; margin-top: 24px;">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
          </div>
          <p style="color: #556677; font-size: 11px; text-align: center; margin-top: 32px;">
            Protected by TrustShield.tech<br/>
            &copy; 2026 DarkWave Studios LLC
          </p>
        </div>
      `,
    });

    return true;
  } catch (error: any) {
    console.error("Failed to send password reset email:", error?.message);
    return false;
  }
}
