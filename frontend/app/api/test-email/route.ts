import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    const to = process.env.ALERT_EMAIL_TO;
    const from = process.env.ALERT_EMAIL_FROM;

    if (!to || !from) {
      return NextResponse.json(
        { ok: false, error: "ALERT_EMAIL_TO / FROM belum di-set di .env.local" },
        { status: 500 }
      );
    }

    const result = await resend.emails.send({
      from,
      to,
      subject: "Test Email SIAPGrek via Resend",
      html: `
        <h2>Test Email SIAPGrek</h2>
        <p>Jika kamu menerima email ini, berarti integrasi Resend sudah <strong>BERHASIL</strong>.</p>
        <p>Nantinya email seperti ini akan dikirim saat terdeteksi anomali.</p>
      `,
    });

    console.log("RESEND RESULT:", result);

    return NextResponse.json({
      ok: true,
      message: "Test email berhasil dikirim. Cek inbox/spam.",
    });
  } catch (error) {
    console.error("RESEND ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Gagal mengirim test email." },
      { status: 500 }
    );
  }
}
