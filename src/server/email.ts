import { Resend } from "resend";

let resend: Resend | undefined;

function getResend() {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("envio de e-mail não configurado.");
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

function remetente() {
  return process.env.RESEND_FROM_EMAIL ?? "Soft Shop <onboarding@resend.dev>";
}

function urlVerificacao(token: string): string {
  const siteUrl = (process.env.SITE_URL ?? "http://localhost:8080").replace(/\/$/, "");
  return `${siteUrl}/verificar-email?token=${token}`;
}

export async function enviarEmailVerificacao(destinatario: string, nome: string, token: string) {
  const link = urlVerificacao(token);
  const { error } = await getResend().emails.send({
    from: remetente(),
    to: destinatario,
    subject: "Confirme seu e-mail — Soft Shop",
    html: `
      <p>Oi, ${nome}! ✿</p>
      <p>Confirma seu e-mail clicando no link abaixo pra liberar suas compras na Soft Shop:</p>
      <p><a href="${link}">${link}</a></p>
      <p>Esse link expira em 24 horas. Se você não criou essa conta, pode ignorar este e-mail.</p>
    `,
  });
  if (error) {
    throw new Error(`não deu pra enviar o e-mail de verificação: ${error.message}`);
  }
}
