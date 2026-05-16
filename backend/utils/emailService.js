const { google } = require('googleapis');

// ============================================================================
// Gmail API Configuration
// ============================================================================

// These credentials will be set in your .env file
const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground';
const REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN;
const EMAIL_USER = process.env.EMAIL_USER; // The Gmail address sending the emails

// Initialize the OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Set the refresh token. 
// The refresh token allows our server to continuously generate new short-lived access tokens
// without manual user intervention, ensuring the backend can always send emails.
if (REFRESH_TOKEN) {
    oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
}

/**
 * Creates a raw base64url encoded email string required by the Gmail API.
 * The Gmail API doesn't accept normal text/HTML directly; it requires a standard MIME message encoded in base64url.
 */
const createEmail = (to, subject, htmlContent) => {
  // Encode subject to handle special characters correctly
  const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
  
  const messageParts = [
    `From: FriendExpense Security <${EMAIL_USER}>`,
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    htmlContent,
  ];
  const message = messageParts.join('\n');
  
  // The Gmail API requires a base64url encoded string (replace + with -, / with _, remove padding =)
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Sends a 6-digit OTP to the given email address using the Gmail REST API.
 * @param {string} to - Recipient email
 * @param {string} otp - 6 digit OTP code
 */
const sendOTPEmail = async (to, otp) => {
  try {
    // 1. Get the Gmail API instance authenticated with our OAuth2 client
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // 2. Create the HTML content (Modern UI for OTP)
    const htmlContent = `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #0f172a; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #14b8a6, #3b82f6); padding: 32px; text-align: center;">
                    <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
                        <span style="font-size: 28px;">🔐</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">FriendExpense</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px;">Secure Login Verification</p>
                </div>
                <div style="padding: 36px 32px; background: #1e293b;">
                    <p style="color: #94a3b8; font-size: 15px; margin: 0 0 24px;">Hi there! We received a login request for your account. Use the OTP below to complete your sign-in:</p>
                    <div style="background: #0f172a; border: 2px dashed #334155; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                        <p style="color: #64748b; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 8px;">Your One-Time Password</p>
                        <span style="font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #14b8a6; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
                    <p style="color: #ef4444; font-size: 13px; text-align: center; margin: 16px 0 0;">⏱️ This OTP expires in <strong>10 minutes</strong>.</p>
                    <hr style="border: none; border-top: 1px solid #334155; margin: 28px 0;" />
                    <p style="color: #475569; font-size: 12px; margin: 0; text-align: center;">If you did not request this, please ignore this email. Your account is safe.</p>
                </div>
                <div style="background: #0f172a; padding: 16px 32px; text-align: center;">
                    <p style="color: #334155; font-size: 11px; margin: 0;">© 2026 FriendExpense. All rights reserved.</p>
                </div>
            </div>
        `;

    // 3. Encode the email into the required base64url format
    const encodedMessage = createEmail(to, '🔐 Your FriendExpense Login OTP', htmlContent);

    // 4. Send the email via Gmail API
    // The special user 'me' refers to the authenticated user (EMAIL_USER)
    console.log(`[Gmail API] Attempting to send OTP email to ${to}...`);
    
    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });

    console.log(`[Gmail API] Success! Message ID: ${result.data.id}`);
    return result.data;
  } catch (error) {
    console.error('[Gmail API] Error sending email:', error.message);
    
    // Log specific Google API errors to help with debugging
    if (error.response && error.response.data && error.response.data.error) {
        console.error('[Gmail API] Detailed Error:', JSON.stringify(error.response.data.error, null, 2));
    }
    
    // Throw the error so the caller (authController) can handle it if needed
    throw error;
  }
};

module.exports = { sendOTPEmail };
