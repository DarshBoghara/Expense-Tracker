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
        `,
  };

  await transporter.sendMail(mailOptions);
};



module.exports = { sendOTPEmail };
