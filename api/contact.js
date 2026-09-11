// Vercel Serverless Function: forwards portfolio contact form submissions
// to your inbox via Resend.
//
// Required Vercel env var:  RESEND_API_KEY
// Optional env vars:        CONTACT_TO   (default randikasuridu@gmail.com)
//                           CONTACT_FROM (default onboarding@resend.dev —
//                           swap for a verified-domain sender in production)

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const body = req.body || {};
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const subject = String(body.subject || "").trim();
  const message = String(body.message || "").trim();

  if (name.length < 2)
    return res.status(400).json({ ok: false, error: "Please provide your name." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ ok: false, error: "Please provide a valid email address." });
  if (subject.length < 4)
    return res.status(400).json({ ok: false, error: "Please provide a subject." });
  if (message.length < 10)
    return res.status(400).json({ ok: false, error: "Please write a little more in your message." });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return res.status(500).json({ ok: false, error: "Email service is not configured yet. Please try again later." });
  }

  const to = process.env.CONTACT_TO || "randikasuridu@gmail.com";
  const from = process.env.CONTACT_FROM || "Portfolio Contact <onboarding@resend.dev>";

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: from,
        to: [to],
        reply_to: email,
        subject: "Portfolio: " + subject,
        text: "Name: " + name + "\nEmail: " + email + "\nSubject: " + subject + "\n\n" + message,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend error:", r.status, detail);
      return res.status(502).json({ ok: false, error: "Could not send the message. Please try again later." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Could not send the message. Please try again later." });
  }
};
