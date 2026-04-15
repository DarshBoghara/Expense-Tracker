const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Sends a 6-digit OTP to the given email address.
 * @param {string} to - Recipient email
 * @param {string} otp - 6 digit OTP code
 */
const sendOTPEmail = async (to, otp) => {
    const mailOptions = {
        from: `"FriendExpense Security" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🔐 Your FriendExpense Login OTP',
        html: `
<div style="margin:0; padding:0; background:#0b1220; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr>
      <td align="center">
        
        <!-- Main Card -->
        <table width="520" cellpadding="0" cellspacing="0" style="background:#111827; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.6);">
          
          <!-- Header -->
          <tr>
            <td style="padding:32px; text-align:center; background:linear-gradient(135deg,#06b6d4,#3b82f6);">
              <div style="font-size:32px;">💼</div>
              <h1 style="color:#ffffff; margin:10px 0 4px; font-size:22px; font-weight:700; letter-spacing:0.5px;">
                FriendExpense
              </h1>
              <p style="color:rgba(255,255,255,0.85); font-size:13px; margin:0;">
                Secure Account Verification
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              
              <p style="color:#9ca3af; font-size:15px; margin:0 0 20px;">
                Hello,
              </p>

              <p style="color:#d1d5db; font-size:15px; margin:0 0 28px; line-height:1.6;">
                We received a request to sign in to your account. Please use the verification code below to continue.
              </p>

              <!-- OTP BOX -->
              <div style="background:linear-gradient(145deg,#020617,#0f172a); border:1px solid #1e293b; border-radius:16px; padding:28px; text-align:center;">
                
                <p style="color:#64748b; font-size:11px; letter-spacing:2px; text-transform:uppercase; margin:0 0 10px;">
                  One-Time Password
                </p>

                <div style="font-size:42px; font-weight:700; letter-spacing:10px; color:#22d3ee; font-family:monospace;">
                  ${otp}
                </div>
              </div>

              <!-- Expiry -->
              <p style="color:#f87171; font-size:13px; text-align:center; margin:20px 0 0;">
                This code will expire in 10 minutes
              </p>

              <!-- Divider -->
              <div style="height:1px; background:#1f2937; margin:28px 0;"></div>

              <!-- Security Note -->
              <p style="color:#6b7280; font-size:12px; line-height:1.6; text-align:center;">
                If you didn’t request this login, you can safely ignore this email.  
                Your account remains secure.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px; text-align:center; background:#020617;">
              <p style="color:#374151; font-size:11px; margin:0;">
                © 2026 FriendExpense · Secure Financial Tracking
              </p>
            </td>
          </tr>

        </table>

        <!-- Extra spacing -->
        <div style="height:30px;"></div>

      </td>
    </tr>
  </table>
</div>
`,
    };

    await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail };
