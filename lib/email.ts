const BREVO_API_KEY = process.env.BREVO_API_KEY || "";
const FROM_EMAIL = process.env.EMAIL_FROM || "";
const FROM_NAME = process.env.EMAIL_FROM_NAME || "Steren Podcast Studio";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const LOGO_URL = "https://www.steren.com.pa/media/logo/stores/1/logo_2.png";
const MAP_URL = "https://maps.app.goo.gl/ipWEW9FY3e3TRyKW6";
const SITE_URL = process.env.PUBLIC_SITE_URL || "https://steren-panama-podcast.vercel.app";
const BRAND_HEX = "#00B3E3";
const WHATSAPP_NUMBER = "50766663080";
const WHATSAPP_DISPLAY = "+507 6666-3080";

import { signCancelToken } from "./cancel-token";

export type BookingPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  date: string;
  hours: number[];
  topic: string;
  groupId?: string;
};

type BrevoRecipient = { email: string; name?: string };

type BrevoSendOpts = {
  to: BrevoRecipient[];
  subject: string;
  html: string;
  replyTo?: BrevoRecipient;
};

async function brevoSend(opts: BrevoSendOpts) {
  if (!BREVO_API_KEY || !FROM_EMAIL) {
    return { skipped: true as const };
  }
  const body: Record<string, unknown> = {
    sender: { name: FROM_NAME, email: FROM_EMAIL },
    to: opts.to,
    subject: opts.subject,
    htmlContent: opts.html,
  };
  if (opts.replyTo) body.replyTo = opts.replyTo;
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": BREVO_API_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    throw new Error(`Brevo ${r.status}: ${errText}`);
  }
  return r.json();
}

function fmtHour(h: number) {
  const period = h >= 12 ? "pm" : "am";
  const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${display}${period}`;
}

function fmtSlots(hours: number[]) {
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges: { start: number; end: number }[] = [];
  for (const h of sorted) {
    const last = ranges[ranges.length - 1];
    if (last && last.end === h) last.end = h + 1;
    else ranges.push({ start: h, end: h + 1 });
  }
  return ranges.map((r) => `${fmtHour(r.start)} – ${fmtHour(r.end)}`).join(" · ");
}

function fmtDateLong(iso: string) {
  return new Date(iso + "T00:00").toLocaleDateString("es-PA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shellHtml(opts: {
  preheader: string;
  badge: string;
  badgeColor: string;
  title: string;
  intro: string;
  body: string;
}) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0a0a0a;">
<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${escape(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 8px 24px -8px rgba(0,0,0,0.08);">
      <tr><td style="background:#06070a;padding:24px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td><img src="${LOGO_URL}" alt="Steren Panamá" height="28" style="height:28px;width:auto;display:block;filter:brightness(0) invert(1);"></td>
            <td align="right" style="font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#a1a1aa;">Podcast Studio</td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="height:3px;background:linear-gradient(90deg,transparent,${BRAND_HEX},transparent);font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:32px 28px 8px 28px;">
        <span style="display:inline-block;background:${opts.badgeColor};color:#ffffff;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;padding:5px 10px;border-radius:9999px;">${escape(opts.badge)}</span>
        <h1 style="margin:14px 0 6px 0;font-size:26px;line-height:1.15;font-weight:900;letter-spacing:-0.01em;color:#0a0a0a;">${escape(opts.title)}</h1>
        <p style="margin:0;color:#525252;font-size:14px;line-height:1.55;">${opts.intro}</p>
      </td></tr>
      <tr><td style="padding:18px 28px 28px 28px;">${opts.body}</td></tr>
      <tr><td style="background:#fafafa;border-top:1px solid #e5e5e5;padding:18px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:12px;color:#737373;line-height:1.5;">
              <strong style="color:#0a0a0a;">Steren Villa Lucre</strong><br>
              Plaza Villa Lucre, San Miguelito, Vía Domingo Díaz<br>
              <a href="${MAP_URL}" style="color:${BRAND_HEX};text-decoration:none;font-weight:600;">Cómo llegar →</a>
            </td>
          </tr>
        </table>
      </td></tr>
      <tr><td style="background:#06070a;padding:14px 28px;text-align:center;font-size:11px;color:#737373;letter-spacing:0.1em;">
        © ${new Date().getFullYear()} Steren Panamá · Podcast Studio
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function detailsCardHtml(b: BookingPayload) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:14px;margin-top:8px;">
    <tr><td style="padding:16px 18px;">
      <p style="margin:0 0 4px 0;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#737373;">Fecha</p>
      <p style="margin:0 0 14px 0;font-size:15px;font-weight:700;color:#0a0a0a;text-transform:capitalize;">${escape(fmtDateLong(b.date))}</p>
      <p style="margin:0 0 4px 0;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#737373;">Horario</p>
      <p style="margin:0 0 14px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:15px;font-weight:700;color:#0a0a0a;">${escape(fmtSlots(b.hours))}</p>
      <p style="margin:0 0 4px 0;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#737373;">Tema</p>
      <p style="margin:0;font-size:14px;color:#262626;line-height:1.5;white-space:pre-wrap;">${escape(b.topic)}</p>
    </td></tr>
  </table>`;
}

export async function sendBookingConfirmation(b: BookingPayload) {
  let cancelButtonHtml = "";
  if (b.groupId) {
    const token = await signCancelToken(b.groupId, b.email);
    if (token) {
      const cancelUrl = `${SITE_URL}/cancelar?token=${encodeURIComponent(token)}`;
      cancelButtonHtml = `
        <a href="${cancelUrl}" style="display:inline-block;background:#dc2626;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:11px 18px;border-radius:10px;text-decoration:none;margin-right:6px;">Cancelar reserva</a>`;
    }
  }
  const whatsappMsg = encodeURIComponent(
    `Hola, soy ${b.firstName} ${b.lastName}. Tengo una reserva del Podcast Studio para ${fmtDateLong(b.date)} (${fmtSlots(b.hours)}).`
  );
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMsg}`;

  const clientHtml = shellHtml({
    preheader: `Tu reserva del podcast studio está confirmada para ${fmtDateLong(b.date)}.`,
    badge: "Reserva confirmada",
    badgeColor: "#16a34a",
    title: "¡Listo, está confirmada!",
    intro: `Hola <strong>${escape(b.firstName)}</strong>, tu sesión en el Podcast Studio de Steren Panamá está reservada. Aquí están los detalles:`,
    body:
      detailsCardHtml(b) +
      `<p style="margin:18px 0 6px 0;font-size:13px;color:#525252;line-height:1.55;">
        Recuerda llegar 5 minutos antes. Si necesitas cambiar o cancelar tu reserva, usa el botón de abajo o escríbenos por WhatsApp.
      </p>
      <p style="margin:0;font-size:12px;color:#737373;line-height:1.5;">
        Al reservar aceptaste los términos y condiciones del studio: el contenido grabado debe respetar la línea de marca y los productos / logos Steren visibles en el set.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>
        <td style="padding-right:6px;">${cancelButtonHtml}</td>
        <td><a href="${whatsappUrl}" style="display:inline-block;background:#25D366;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:11px 18px;border-radius:10px;text-decoration:none;">WhatsApp ${WHATSAPP_DISPLAY}</a></td>
      </tr></table>`,
  });

  const adminHtml = shellHtml({
    preheader: `Nueva reserva de ${b.firstName} ${b.lastName} para ${fmtDateLong(b.date)}.`,
    badge: "Nueva reserva",
    badgeColor: BRAND_HEX,
    title: `Nueva reserva · ${b.firstName} ${b.lastName}`,
    intro: `Se acaba de registrar una nueva reserva en el Podcast Studio.`,
    body:
      detailsCardHtml(b) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border:1px solid #e5e5e5;border-radius:14px;margin-top:12px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 4px 0;font-size:10px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;color:#737373;">Cliente</p>
          <p style="margin:0 0 6px 0;font-size:14px;color:#0a0a0a;font-weight:700;">${escape(b.firstName)} ${escape(b.lastName)}</p>
          <p style="margin:0;font-size:13px;color:#525252;">
            <a href="mailto:${escape(b.email)}" style="color:${BRAND_HEX};text-decoration:none;">${escape(b.email)}</a> ·
            <a href="tel:${escape(b.phone.replace(/\s/g, ""))}" style="color:${BRAND_HEX};text-decoration:none;">${escape(b.phone)}</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:18px 0 0 0;">
        <a href="${SITE_URL}/admin" style="display:inline-block;background:${BRAND_HEX};color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:11px 18px;border-radius:10px;text-decoration:none;">Abrir panel</a>
      </p>`,
  });

  const tasks: Promise<unknown>[] = [
    brevoSend({
      to: [{ email: b.email, name: `${b.firstName} ${b.lastName}` }],
      subject: "Reserva confirmada · Podcast Studio Steren",
      html: clientHtml,
    }),
  ];
  if (ADMIN_EMAILS.length) {
    tasks.push(
      brevoSend({
        to: ADMIN_EMAILS.map((e) => ({ email: e })),
        subject: `Nueva reserva · ${b.firstName} ${b.lastName} · ${fmtDateLong(b.date)}`,
        html: adminHtml,
        replyTo: { email: b.email, name: `${b.firstName} ${b.lastName}` },
      })
    );
  }
  return Promise.allSettled(tasks);
}

export async function sendBookingCancellation(b: BookingPayload) {
  const cancelWhatsAppMsg = encodeURIComponent(
    `Hola, soy ${b.firstName} ${b.lastName}. Mi reserva del ${fmtDateLong(b.date)} fue cancelada y quería preguntar.`
  );
  const cancelWhatsAppUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${cancelWhatsAppMsg}`;

  const clientHtml = shellHtml({
    preheader: `Tu reserva del podcast studio para ${fmtDateLong(b.date)} ha sido cancelada.`,
    badge: "Reserva cancelada",
    badgeColor: "#dc2626",
    title: "Tu reserva fue cancelada",
    intro: `Hola <strong>${escape(b.firstName)}</strong>, te avisamos que tu reserva en el Podcast Studio de Steren Panamá fue cancelada.`,
    body:
      detailsCardHtml(b) +
      `<p style="margin:18px 0 0 0;font-size:13px;color:#525252;line-height:1.55;">
        Si quieres reagendar, puedes reservar otra fecha en el sitio o escribirnos por WhatsApp.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>
        <td style="padding-right:6px;"><a href="${SITE_URL}" style="display:inline-block;background:#06070a;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:11px 18px;border-radius:10px;text-decoration:none;">Reservar otra fecha</a></td>
        <td><a href="${cancelWhatsAppUrl}" style="display:inline-block;background:#25D366;color:#ffffff;font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:11px 18px;border-radius:10px;text-decoration:none;">WhatsApp ${WHATSAPP_DISPLAY}</a></td>
      </tr></table>`,
  });

  const adminHtml = shellHtml({
    preheader: `Reserva cancelada de ${b.firstName} ${b.lastName} para ${fmtDateLong(b.date)}.`,
    badge: "Reserva cancelada",
    badgeColor: "#dc2626",
    title: `Reserva cancelada · ${b.firstName} ${b.lastName}`,
    intro: `Esta reserva fue eliminada desde el panel administrativo.`,
    body:
      detailsCardHtml(b) +
      `<p style="margin:14px 0 0 0;font-size:12px;color:#737373;">
        Cliente: <a href="mailto:${escape(b.email)}" style="color:${BRAND_HEX};text-decoration:none;">${escape(b.email)}</a> ·
        <a href="tel:${escape(b.phone.replace(/\s/g, ""))}" style="color:${BRAND_HEX};text-decoration:none;">${escape(b.phone)}</a>
      </p>`,
  });

  const tasks: Promise<unknown>[] = [
    brevoSend({
      to: [{ email: b.email, name: `${b.firstName} ${b.lastName}` }],
      subject: "Reserva cancelada · Podcast Studio Steren",
      html: clientHtml,
    }),
  ];
  if (ADMIN_EMAILS.length) {
    tasks.push(
      brevoSend({
        to: ADMIN_EMAILS.map((e) => ({ email: e })),
        subject: `Cancelada · ${b.firstName} ${b.lastName} · ${fmtDateLong(b.date)}`,
        html: adminHtml,
      })
    );
  }
  return Promise.allSettled(tasks);
}

export async function sendPasswordResetEmail(opts: { email: string; name: string; token: string }) {
  const url = `${SITE_URL}/admin/reset-password?token=${encodeURIComponent(opts.token)}`;
  const html = shellHtml({
    preheader: "Solicitaste restablecer tu contraseña del panel administrativo.",
    badge: "Recuperar contraseña",
    badgeColor: BRAND_HEX,
    title: "Restablece tu contraseña",
    intro: `Hola <strong>${escape(opts.name)}</strong>, recibimos una solicitud para restablecer la contraseña de tu cuenta del panel administrativo del Podcast Studio.`,
    body: `
      <p style="margin:0 0 18px 0;font-size:14px;color:#525252;line-height:1.55;">
        Haz clic en el botón para crear una nueva contraseña. El enlace expira en 1 hora.
      </p>
      <p style="margin:0 0 12px 0;">
        <a href="${url}" style="display:inline-block;background:${BRAND_HEX};color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;padding:13px 22px;border-radius:12px;text-decoration:none;">Restablecer contraseña</a>
      </p>
      <p style="margin:18px 0 0 0;font-size:11px;color:#737373;line-height:1.5;word-break:break-all;">
        Si el botón no funciona, copia este enlace en tu navegador:<br>
        <a href="${url}" style="color:${BRAND_HEX};text-decoration:none;">${url}</a>
      </p>
      <p style="margin:18px 0 0 0;font-size:11px;color:#a3a3a3;">
        Si no solicitaste este cambio, puedes ignorar este correo.
      </p>
    `,
  });

  return brevoSend({
    to: [{ email: opts.email, name: opts.name }],
    subject: "Restablece tu contraseña · Steren Podcast Studio",
    html,
  });
}
