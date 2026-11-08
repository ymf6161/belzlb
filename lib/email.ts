import "server-only";
import { Resend } from "resend";

type Mail = { to: string | string[]; subject: string; text: string };

/** Sends an email through Resend. In local development without a key,
 *  prints it to the terminal instead so you can still log in. */
export async function sendMail({ to, subject, text }: Mail) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.log(`\n── Email (not sent, no RESEND_API_KEY) ──\nTo: ${[to].flat().join(", ")}\nSubject: ${subject}\n\n${text}\n`);
      return;
    }
    throw new Error("RESEND_API_KEY is not set.");
  }
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is not set.");
  const { error } = await new Resend(key).emails.send({ from, to, subject, text });
  if (error) throw new Error(`Email failed: ${error.message}`);
}
