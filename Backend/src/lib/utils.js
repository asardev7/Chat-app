import jwt from "jsonwebtoken";
import axios from "axios";

export const generateToken = (userid, res) => {
  const token = jwt.sign({ id: userid }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    maxAge: 10 * 24 * 60 * 60 * 1000,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return token;
};

export const sendOTPEmail = async (email, otp) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Ri-Chat",
          email: process.env.BREVO_SENDER_EMAIL,
        },
        to: [{ email }],
        subject: "Your Ri-Chat Verification Code",
        htmlContent: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">Ri-Chat</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Secure Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 8px;color:#f1f1f1;font-size:20px;font-weight:600;">Verify your email address</h2>
              <p style="margin:0 0 28px;color:#888;font-size:14px;line-height:1.6;">
                Enter the verification code below to complete your Ri-Chat registration. This code is valid for <strong style="color:#a78bfa;">5 minutes</strong>.
              </p>
              <div style="background:#111;border:1px solid #333;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
                <p style="margin:0 0 10px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Your verification code</p>
                <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#a78bfa;font-family:'Courier New',monospace;">${otp}</div>
              </div>
              <div style="background:#1e1a2e;border:1px solid #3b3060;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                <p style="margin:0;color:#c4b5fd;font-size:13px;line-height:1.5;">
                  <strong>Never share this code</strong> with anyone. Ri-Chat will never ask for your OTP via chat or phone.
                </p>
              </div>
              <p style="margin:0;color:#555;font-size:13px;line-height:1.6;">
                If you did not create a Ri-Chat account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#111;padding:20px 40px;border-top:1px solid #222;text-align:center;">
              <p style="margin:0;color:#444;font-size:12px;">© 2026 Ri-Chat · All rights reserved</p>
              <p style="margin:6px 0 0;color:#333;font-size:11px;">This is an automated message, please do not reply.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("OTP email sent:", response.data.messageId);
  } catch (err) {
    console.error("OTP email failed:", err.response?.data || err.message);
  }
};

export const triggerBrevo = async (email, fullName) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/contacts",
      {
        email,
        attributes: { VERIFIED: true },
        listIds: [Number(process.env.BREVO_LIST_ID)],
        updateEnabled: true,
      },
      { headers: { "api-key": process.env.BREVO_API_KEY } }
    );
    console.log("Brevo contact synced");

    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        to: [{ email, name: fullName }],
        templateId: Number(process.env.BREVO_WELCOME_TEMPLATE_ID),
      },
      { headers: { "api-key": process.env.BREVO_API_KEY } }
    );
    console.log("Welcome template sent to:", email);
  } catch (err) {
    console.error("Brevo error:", err.response?.data || err.message);
  }
};
