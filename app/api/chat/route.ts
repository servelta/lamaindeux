import { NextResponse } from "next/server";

// Kept intentionally small/cheap: this is a support/guidance widget, not a
// research assistant — a small, fast model keeps per-conversation cost low.
const MODEL = "claude-3-5-haiku-20241022";

const SYSTEM_PROMPT = `Tu es l'assistant virtuel de LaMainDeux, une plateforme française qui met en relation des clients avec des artisans vérifiés (plombiers, électriciens, et bientôt d'autres métiers).

Ton rôle :
- Aider les visiteurs à comprendre comment utiliser le site (rechercher un artisan par ville et service, comparer les profils, réserver en ligne).
- Expliquer que la recherche et la réservation sont gratuites pour les clients, sans commission sur l'intervention — le client paie directement l'artisan.
- Encourager les artisans intéressés à s'inscrire via "Devenir artisan partenaire".
- Répondre en français, de façon brève, chaleureuse et utile.
- Si une question concerne un compte spécifique, une réservation précise, ou un litige, invite la personne à se connecter à son espace ou à contacter le support — tu n'as pas accès aux données des comptes.
- Si tu ne sais pas répondre à quelque chose, dis-le simplement plutôt que d'inventer une réponse.

Reste concis : 2-4 phrases par réponse dans la plupart des cas.`;

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Le chatbot n'est pas configuré pour le moment." },
      { status: 503 }
    );
  }

  const { messages } = await request.json();

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Message invalide." }, { status: 400 });
  }

  // Cap history sent per request — keeps cost bounded and avoids one long
  // conversation growing indefinitely expensive.
  const recentMessages = messages.slice(-12);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: recentMessages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", errText);
      return NextResponse.json(
        { error: "Une erreur est survenue. Merci de réessayer." },
        { status: 502 }
      );
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? "Désolé, je n'ai pas pu répondre.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Une erreur est survenue. Merci de réessayer." },
      { status: 500 }
    );
  }
}
