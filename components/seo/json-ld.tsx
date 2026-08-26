/**
 * Renders a single JSON-LD <script> tag. Server Component — no client JS
 * needed. Every structured-data emitter in the app builds a plain object
 * and passes it here rather than hand-writing <script> tags, so escaping
 * and the @context/@type shape stay consistent.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Escape "<" so a value containing literal "</script>" (e.g. a professional's
  // company name or a review comment) can't break out of the script tag.
  // This is a real, if narrow, XSS vector for any JSON-LD embedded from
  // user-generated content, not a theoretical one.
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
