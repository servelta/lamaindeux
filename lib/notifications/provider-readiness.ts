// Server/build checks only. Return safe configuration metadata, never secrets.
export type ProviderReadiness = { status: "ready" | "warning" | "blocked"; code: string; message: string };
type Switches = { email_enabled: boolean; sms_enabled: boolean };

async function emailReadiness(enabled: boolean): Promise<ProviderReadiness> {
  if (!enabled) return { status: "blocked", code: "disabled", message: "Les notifications e-mail sont désactivées." };
  const key = process.env.RESEND_API_KEY;
  const sender = process.env.EMAIL_FROM;
  if (!key || !sender) return { status: "blocked", code: "missing_config", message: "Renseignez RESEND_API_KEY et EMAIL_FROM dans Vercel, puis redéployez." };
  const address = (sender.match(/<([^<>]+)>/)?.[1] ?? sender).trim();
  const domain = address.split("@")[1]?.toLowerCase();
  if (!domain || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) return { status: "blocked", code: "invalid_sender", message: "EMAIL_FROM doit contenir une adresse e-mail valide." };
  const testSender = domain === "resend.dev" || domain.endsWith(".resend.dev");
  const testSenderResult: ProviderReadiness = { status: "blocked", code: "test_sender", message: "Expéditeur Resend de test : les artisans ne peuvent pas recevoir ces e-mails. Vérifiez lamain2.com dans Resend, utilisez une adresse de ce domaine dans EMAIL_FROM et redéployez." };
  try {
    const response = await fetch("https://api.resend.com/domains?limit=100", { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (response.status === 401) return { status: "blocked", code: "invalid_credentials", message: "Resend refuse la clé API. Mettez à jour RESEND_API_KEY dans Vercel." };
    if (response.status === 403) return testSender ? testSenderResult : { status: "warning", code: "verification_unavailable", message: "Clé limitée à l’envoi : vérifiez le domaine de EMAIL_FROM dans Resend. La livraison ne peut pas être confirmée par ce contrôle." };
    if (!response.ok) throw new Error("provider_unavailable");
    const body = await response.json();
    if (testSender) {
      const verified = Array.isArray(body.data) && body.data.some((item: { name: string; status: string }) => item.name === "lamain2.com" && item.status === "verified");
      return verified ? { status: "blocked", code: "test_sender_verified_domain", message: "lamain2.com est vérifié dans Resend, mais EMAIL_FROM utilise encore l’expéditeur de test. Utilisez LaMain2 <notifications@lamain2.com> dans Vercel et redéployez." } : testSenderResult;
    }
    const senderDomain = Array.isArray(body.data) ? body.data.find((item: { name: string }) => item.name?.toLowerCase() === domain) : null;
    if (senderDomain?.status === "verified") return { status: "ready", code: "verified", message: "Le domaine de l’expéditeur est vérifié dans Resend. Les réceptions restent à contrôler dans les journaux Resend." };
    if (!senderDomain && body.has_more) return { status: "warning", code: "verification_unavailable", message: "Domaine absent de la première page du contrôle. Vérifiez EMAIL_FROM dans Resend." };
    return { status: "blocked", code: "unverified_domain", message: "Le domaine de EMAIL_FROM n’est pas vérifié dans ce compte Resend. Terminez la vérification DNS avant d’envoyer aux artisans." };
  } catch {
    return testSender ? testSenderResult : { status: "warning", code: "provider_unavailable", message: "Contrôle Resend indisponible. Consultez le tableau de bord Resend avant de conclure à une livraison." };
  }
}

async function smsReadiness(enabled: boolean): Promise<ProviderReadiness> {
  if (!enabled) return { status: "blocked", code: "disabled", message: "Les notifications SMS sont désactivées." };
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { status: "blocked", code: "missing_config", message: "Renseignez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER dans Vercel, puis redéployez." };
  if (!/^AC[a-f\d]{32}$/i.test(sid) || !/^\+[1-9]\d{6,14}$/.test(from)) return { status: "blocked", code: "invalid_config", message: "Vérifiez les identifiants Twilio et le numéro expéditeur au format international." };
  try {
    const options = { headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64") }, cache: "no-store" as const, signal: AbortSignal.timeout(5000) };
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}.json`, options);
    if ([401, 403].includes(response.status)) return { status: "blocked", code: "invalid_credentials", message: "Twilio refuse les identifiants. Mettez à jour le SID et le jeton dans Vercel." };
    if (!response.ok) throw new Error("provider_unavailable");
    const account = await response.json();
    if (account.status !== "active") return { status: "blocked", code: "inactive_account", message: "Le compte Twilio n’est pas actif. Consultez sa facturation et son statut." };
    if (account.type === "Trial") return { status: "warning", code: "trial_account", message: "Compte Twilio d’essai : seuls les destinataires vérifiés peuvent recevoir des SMS. Vérifiez les numéros ou activez un compte de production avec crédit." };
    const numbers = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json?PhoneNumber=${encodeURIComponent(from)}&PageSize=1`, { ...options, signal: AbortSignal.timeout(5000) });
    if (!numbers.ok) throw new Error("sender_check_unavailable");
    const body = await numbers.json();
    if (!body.incoming_phone_numbers?.some((number: { capabilities?: { sms?: boolean } }) => number.capabilities?.sms)) return { status: "blocked", code: "sender_unavailable", message: "Le numéro expéditeur ne figure pas parmi les numéros SMS de ce compte Twilio. Vérifiez TWILIO_PHONE_NUMBER." };
    return { status: "ready", code: "configured", message: "Compte actif et numéro SMS configuré. Vérifiez aussi les autorisations géographiques, le crédit et les statuts de livraison dans Twilio." };
  } catch {
    return { status: "warning", code: "provider_unavailable", message: "Contrôle Twilio indisponible. Vérifiez le compte, le crédit et les autorisations pays dans Twilio." };
  }
}

export async function getProviderReadiness(settings: Switches) {
  const [email, sms] = await Promise.all([emailReadiness(settings.email_enabled), smsReadiness(settings.sms_enabled)]);
  return { email, sms };
}
