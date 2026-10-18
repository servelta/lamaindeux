// Server/build checks only. Return safe configuration metadata, never secrets.
import { getTransactionalEmailConfig, TRANSACTIONAL_EMAIL_DOMAIN } from "../email/config";
export type ProviderReadiness = { status: "ready" | "warning" | "blocked"; code: string; message: string };
type Switches = { email_enabled: boolean; sms_enabled: boolean };

async function emailReadiness(enabled: boolean): Promise<ProviderReadiness> {
  if (!enabled) return { status: "blocked", code: "disabled", message: "Les notifications e-mail sont désactivées." };
  const key = process.env.RESEND_API_KEY;
  if (!key) return { status: "blocked", code: "missing_config", message: "Renseignez RESEND_API_KEY côté serveur dans Vercel, puis redéployez." };
  if (!getTransactionalEmailConfig().ok) return { status: "blocked", code: "sender_configuration_mismatch", message: "Utilisez EMAIL_FROM=LaMain2 <contact@lamain2.com> et EMAIL_REPLY_TO=contact@lamain2.com dans Vercel. Aucun expéditeur de test n’est autorisé." };
  try {
    const response = await fetch("https://api.resend.com/domains?limit=100", { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (response.status === 401) return { status: "blocked", code: "invalid_credentials", message: "Resend refuse la clé API. Mettez à jour RESEND_API_KEY dans Vercel." };
    if (response.status === 403) return { status: "warning", code: "verification_unavailable", message: "Clé limitée à l’envoi : vérifiez lamain2.com dans le compte Resend associé à cette clé. La vérification du domaine ne peut pas être confirmée par ce contrôle." };
    if (!response.ok) throw new Error("provider_unavailable");
    const body = await response.json();
    const senderDomain = Array.isArray(body.data) ? body.data.find((item: { name: string }) => item.name?.toLowerCase() === TRANSACTIONAL_EMAIL_DOMAIN) : null;
    if (senderDomain?.status === "verified" && senderDomain.capabilities?.sending === "enabled") return { status: "ready", code: "verified", message: "lamain2.com est vérifié pour l’envoi dans le compte de la clé déployée. Expéditeur et réponses : contact@lamain2.com. Acceptation, livraison et réception en boîte OVH restent des contrôles distincts." };
    if (!senderDomain && body.has_more) return { status: "warning", code: "verification_unavailable", message: "Domaine absent de la première page du contrôle. Vérifiez lamain2.com dans le compte Resend associé à cette clé." };
    if (!senderDomain) return { status: "blocked", code: "domain_missing", message: "lamain2.com est absent du compte/équipe de la clé déployée. Utilisez la clé de l’équipe qui possède ce domaine ou ajoutez-le à cette équipe, puis terminez la vérification DNS d’envoi. Conservez les MX racine OVH et laissez Resend Receiving désactivé." };
    if (senderDomain.capabilities?.sending === "disabled") return { status: "blocked", code: "sending_disabled", message: "Le domaine existe dans ce compte Resend, mais sa fonction d’envoi est désactivée. Activez uniquement Sending ; conservez la réception chez OVH." };
    if (senderDomain.status === "verified") return { status: "warning", code: "sending_unconfirmed", message: "Le domaine est vérifié, mais l’API ne confirme pas sa capacité Sending. Contrôlez cette fonction dans Resend avant de conclure que l’envoi est prêt." };
    const domainStatus = ["pending", "not_started", "failed", "temporary_failure"].includes(senderDomain.status) ? senderDomain.status : "unverified";
    let missingRecords = "";
    if (typeof senderDomain.id === "string" && /^[\da-f-]{36}$/i.test(senderDomain.id)) {
      try {
        const details = await fetch(`https://api.resend.com/domains/${senderDomain.id}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(5000) });
        if (details.ok) {
          const domain = await details.json();
          const records = Array.isArray(domain.records) ? domain.records : [];
          const pending = records.filter((record: { record: string; status: string; type: string; name: string }) => ["DKIM", "SPF"].includes(record.record) && record.status !== "verified" && ["TXT", "MX", "CNAME"].includes(record.type) && /^[\w.@-]{1,254}$/.test(record.name) && !(record.type === "MX" && ["@", TRANSACTIONAL_EMAIL_DOMAIN].includes(record.name)));
          missingRecords = pending.length ? " Enregistrements d’envoi à vérifier : " + pending.map((record: { type: string; name: string }) => `${record.type} ${record.name}`).join(", ") + "." : "";
        }
      } catch { /* Domain status is still known; details remain unavailable. */ }
    }
    return { status: "blocked", code: "unverified_domain", message: `lamain2.com existe dans ce compte Resend mais son statut est ${domainStatus}.${missingRecords} Terminez la vérification Sending dans Resend. Ne remplacez pas les MX racine OVH et n’activez pas Receiving.` };
  } catch {
    return { status: "warning", code: "provider_unavailable", message: "Contrôle Resend indisponible. Consultez le tableau de bord Resend avant de conclure à une livraison." };
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
