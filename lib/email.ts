import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'VENOLS ERP <noreply@venols.com>'
const APP_NAME = 'VENOLS ERP'

export async function sendOTPEmail(params: {
  to: string
  firstName: string
  otp: string
}): Promise<void> {
  const { to, firstName, otp } = params

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${otp} es tu código de verificación — ${APP_NAME}`,
    html: buildOTPEmailHTML({ firstName, otp }),
  })

  if (error) {
    throw new Error(`Error al enviar email: ${error.message}`)
  }
}

function buildOTPEmailHTML(params: { firstName: string; otp: string }): string {
  const { firstName, otp } = params
  const digits = otp.split('')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f0c29,#302b63);padding:36px 40px;text-align:center;">
              <p style="margin:0;color:#64c8ff;font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;">MARITIME LOGISTICS PLATFORM</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">${APP_NAME}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Verificación de cuenta</p>
              <h2 style="margin:0 0 20px;color:#0f172a;font-size:22px;font-weight:700;">Hola, ${firstName}</h2>
              <p style="margin:0 0 28px;color:#475569;font-size:15px;line-height:1.6;">
                Ingresa el siguiente código de 6 dígitos para completar tu registro en ${APP_NAME}. El código expira en <strong>10 minutos</strong>.
              </p>
              <!-- OTP Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        ${digits
                          .map(
                            (d) => `
                          <td style="padding:0 5px;">
                            <div style="
                              width:48px;height:60px;
                              background:#f8fafc;
                              border:2px solid #e2e8f0;
                              border-radius:10px;
                              display:table-cell;
                              vertical-align:middle;
                              text-align:center;
                              font-size:28px;
                              font-weight:800;
                              color:#0f172a;
                              font-family:'Courier New',monospace;
                              line-height:60px;
                            ">${d}</div>
                          </td>`
                          )
                          .join('')}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <div style="background:#fff8ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin-bottom:28px;">
                <p style="margin:0;color:#92400e;font-size:13px;">
                  <strong>Importante:</strong> Si no creaste esta cuenta, ignora este email. Nadie más puede usar este código.
                </p>
              </div>
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                Este código expira el ${new Date(Date.now() + 10 * 60 * 1000).toLocaleString('es-VE', { timeZone: 'America/Caracas' })} (hora Venezuela).
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                © ${new Date().getFullYear()} ${APP_NAME} · Todos los derechos reservados
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
