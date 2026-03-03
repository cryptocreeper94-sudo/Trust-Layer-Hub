import Twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: ReturnType<typeof Twilio> | null = null;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  if (!twilioClient) {
    twilioClient = Twilio(accountSid, authToken);
  }
  return twilioClient;
}

export async function sendSMS2FACode(
  toPhone: string,
  code: string
): Promise<boolean> {
  try {
    if (!fromPhone) {
      throw new Error("Twilio phone number not configured");
    }

    const client = getClient();
    await client.messages.create({
      body: `Trust Layer verification code: ${code}. This code expires in 5 minutes.`,
      from: fromPhone,
      to: toPhone,
    });

    console.log(`2FA SMS sent to ${toPhone.slice(0, 4)}****`);
    return true;
  } catch (error: any) {
    console.error("Failed to send SMS:", error?.message);
    return false;
  }
}

export function isTwilioConfigured(): boolean {
  return !!(accountSid && authToken && fromPhone);
}
