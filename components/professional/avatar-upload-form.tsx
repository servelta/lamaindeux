"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { uploadAvatarAction } from "@/lib/professional/profile-actions";
import { Button } from "@/components/ui/button";

export function AvatarUploadForm({
  currentAvatarUrl,
  companyInitial,
}: {
  currentAvatarUrl: string | null;
  companyInitial: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentAvatarUrl);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setError(null);

    const formData = new FormData();
    formData.set("avatar", file);

    startTransition(async () => {
      const result = await uploadAvatarAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form ref={formRef} className="flex items-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary">
        {preview ? (
          <Image src={preview} alt="Photo de profil" width={64} height={64} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-xl font-semibold text-primary">{companyInitial}</span>
        )}
      </div>
      <div>
        <Button asChild variant="outline" size="sm" type="button">
          <label className="cursor-pointer">
            {isPending ? "Envoi..." : "Changer la photo"}
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </Button>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </form>
  );
}
