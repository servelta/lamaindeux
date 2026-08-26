"use client";

import { useState, useTransition } from "react";
import { uploadDocumentAction } from "@/lib/professional/profile-actions";
import { Button } from "@/components/ui/button";

const DOC_TYPE_LABELS: Record<string, string> = {
  identity: "Pièce d'identité",
  qualification: "Qualification professionnelle",
  insurance: "Attestation d'assurance",
  other: "Autre document",
};

export function DocumentUploadForm() {
  const [docType, setDocType] = useState("identity");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);

    const formData = new FormData();
    formData.set("document", file);
    formData.set("docType", docType);

    startTransition(async () => {
      const result = await uploadDocumentAction(formData);
      if (result?.error) setMessage({ type: "error", text: result.error });
      else if (result?.success) setMessage({ type: "success", text: result.success });
      e.target.value = "";
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
      <div className="space-y-1">
        <label htmlFor="docType" className="text-xs font-medium">Type de document</label>
        <select
          id="docType"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          {Object.entries(DOC_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <Button asChild variant="outline" type="button">
        <label className="cursor-pointer">
          {isPending ? "Envoi..." : "Choisir un fichier"}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} />
        </label>
      </Button>
      {message && (
        <p className={`w-full text-sm ${message.type === "error" ? "text-destructive" : "text-verified"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
