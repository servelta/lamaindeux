/**
 * Transactional emails need inline CSS — email clients don't run Tailwind
 * or even reliably load external stylesheets. This wraps every email in a
 * consistent, simple, professional shell.
 */
export function wrapEmail(bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
  <body style="margin:0;padding:0;background-color:#F5F6F5;font-family:Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F6F5;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background-color:#1D4E5C;padding:20px 32px;">
                <span style="color:#ffffff;font-size:18px;font-weight:700;">LaMainDeux</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#16232B;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;background-color:#F5F6F5;color:#6b7280;font-size:12px;">
                LaMainDeux — Le paiement de l'intervention se règle directement avec le professionnel.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 0;color:#6b7280;">${label}</td>
    <td style="padding:4px 0;text-align:right;font-weight:600;">${value}</td>
  </tr>`;
}

export function detailTable(rows: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;font-size:14px;">${rows}</table>`;
}

export function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:16px;padding:10px 20px;background-color:#1D4E5C;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">${label}</a>`;
}
