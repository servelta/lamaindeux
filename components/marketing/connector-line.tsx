/**
 * The site's signature visual element: a connecting route — a dashed line
 * with joint markers, echoing how each step links to the next. Used to
 * connect the "How it works" steps (a real ordered sequence, so numbering +
 * a connecting line both earn their place) and faintly in the hero.
 * Kept to a single reused element rather than scattered decoration.
 * (Originally conceived as a plumbing-pipe motif when the platform was
 * plumbing-only — the abstract dashed-line-with-joints reads as a generic
 * "connection" shape, not specifically pipework, so it carries over cleanly
 * now that the platform covers multiple trades.)
 */
export function ConnectorLineHorizontal({ segments = 3 }: { segments?: number }) {
  const width = 100;
  return (
    <svg
      viewBox={`0 0 ${width * segments} 24`}
      className="hidden w-full sm:block"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line
        x1="0"
        y1="12"
        x2={width * segments}
        y2="12"
        className="connector-line"
      />
      {Array.from({ length: segments + 1 }).map((_, i) => (
        <circle key={i} cx={i * width} cy="12" r="4" className="connector-joint" />
      ))}
    </svg>
  );
}

export function ConnectorLineVertical({ segments = 3 }: { segments?: number }) {
  const height = 80;
  return (
    <svg
      viewBox={`0 0 24 ${height * segments}`}
      className="w-6 sm:hidden"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <line x1="12" y1="0" x2="12" y2={height * segments} className="connector-line" />
      {Array.from({ length: segments + 1 }).map((_, i) => (
        <circle key={i} cx="12" cy={i * height} r="4" className="connector-joint" />
      ))}
    </svg>
  );
}
