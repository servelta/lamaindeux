"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { deleteGalleryPhotoAction, uploadGalleryPhotoAction } from "@/lib/professional/gallery-actions";
import { Button } from "@/components/ui/button";

export type GalleryPhoto = { id: string; url: string };

export function GalleryManager({ photos }: { photos: GalleryPhoto[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("photo", file);
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await uploadGalleryPhotoAction(formData);
      if (result?.error) setError(result.error);
      if (result?.success) setMessage(result.success);
      if (!result?.error) {
        if (inputRef.current) inputRef.current.value = "";
        router.refresh();
      }
    });
  }

  function handleDelete(photoId: string) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await deleteGalleryPhotoAction(photoId);
      if (result?.error) setError(result.error);
      if (result?.success) setMessage(result.success);
      if (!result?.error) router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="space-y-2">
              <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                <Image src={photo.url} alt="Photo de réalisation" fill className="object-cover" sizes="(max-width: 640px) 50vw, 33vw" />
              </div>
              <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleDelete(photo.id)}>
                Supprimer
              </Button>
            </div>
          ))}
        </div>
      )}

      {photos.length < 6 && (
        <Button type="button" variant="outline" disabled={isPending} onClick={() => inputRef.current?.click()}>
          {isPending ? "Envoi..." : "Ajouter une photo"}
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </Button>
      )}
      <p className="text-xs text-muted-foreground">Jusqu'à 6 photos, 2 Mo maximum par image.</p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      {message && <p className="text-sm text-verified">{message}</p>}
    </div>
  );
}
