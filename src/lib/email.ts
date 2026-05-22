// Transactional email via Resend (https://resend.com).
//
// Used only for technical mail the product itself needs to function:
// the signup verification code and the password-reset code. There is
// no marketing / newsletter path here on purpose.
//
// Configuration (both gitignored, never committed):
//   RESEND_API_KEY  — the Resend API key
//   EMAIL_FROM      — optional "Name <addr@domain>" sender override
// If RESEND_API_KEY is unset the sender no-ops and logs, so local dev
// without a key still runs (the caller surfaces a friendly error).

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "RentTools <noreply@renttools.io>";

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

/** Low-level send. Prefer the typed helpers below for product email. */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.error("[email] RESEND_API_KEY not set — skipping send:", opts.subject);
    return { ok: false, error: "Email service is not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email] Resend API error", res.status, body);
      return { ok: false, error: `Email send failed (HTTP ${res.status})` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send failed:", err);
    return { ok: false, error: "Email send failed" };
  }
}

/** Minimal branded wrapper so the two code emails look consistent. */
function codeEmailHtml(heading: string, intro: string, code: string, note: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f4;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:14px;border:1px solid #e7e5e4;overflow:hidden;">
          <tr><td style="padding:28px 32px 8px;">
            <div style="font-size:15px;font-weight:600;color:#1c1917;letter-spacing:-0.01em;">RentTools</div>
          </td></tr>
          <tr><td style="padding:8px 32px 0;">
            <h1 style="margin:0;font-size:19px;font-weight:600;color:#1c1917;letter-spacing:-0.02em;">${heading}</h1>
            <p style="margin:12px 0 0;font-size:14px;line-height:1.55;color:#57534e;">${intro}</p>
          </td></tr>
          <tr><td style="padding:20px 32px;">
            <div style="font-size:30px;font-weight:700;letter-spacing:8px;color:#1c1917;text-align:center;background:#f5f5f4;border-radius:10px;padding:18px 0;">${code}</div>
          </td></tr>
          <tr><td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:12px;line-height:1.55;color:#a8a29e;">${note}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

/** Signup email-verification code. */
export async function sendVerificationCodeEmail(
  to: string,
  code: string,
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `${code} is your RentTools verification code`,
    html: codeEmailHtml(
      "Confirm your email",
      "Enter this code on the sign-up page to finish creating your RentTools account.",
      code,
      "This code expires in 15 minutes. If you didn't request it, you can ignore this email.",
    ),
    text:
      `Your RentTools verification code is ${code}\n\n` +
      `Enter it on the sign-up page to finish creating your account.\n` +
      `The code expires in 15 minutes. If you didn't request it, ignore this email.`,
  });
}

/** Password-reset code. */
export async function sendPasswordResetEmail(
  to: string,
  code: string,
): Promise<SendEmailResult> {
  return sendEmail({
    to,
    subject: `${code} is your RentTools password reset code`,
    html: codeEmailHtml(
      "Reset your password",
      "Enter this code on the password-reset page to choose a new password.",
      code,
      "This code expires in 15 minutes. If you didn't request a reset, ignore this email — your password is unchanged.",
    ),
    text:
      `Your RentTools password reset code is ${code}\n\n` +
      `Enter it on the password-reset page to choose a new password.\n` +
      `The code expires in 15 minutes. If you didn't request this, ignore this email.`,
  });
}
