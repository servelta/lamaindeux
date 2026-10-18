export default function LoadingArtisanEditor() {
  return <div role="status" className="mx-auto max-w-4xl space-y-5 px-4 py-10"><p className="font-medium text-primary">Chargement de l’éditeur de l’artisan…</p>{[1, 2, 3].map(key => <div key={key} aria-hidden="true" className="h-40 animate-pulse rounded-2xl bg-secondary/50" />)}</div>;
}
