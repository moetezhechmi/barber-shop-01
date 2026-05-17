"use client";

import * as React from "react";
import { Image, Plus, Trash2, X, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface GalleryImage {
  id: string;
  barberId: string;
  url: string;
  caption: string | null;
  createdAt: string;
}

export default function BarberGalleryPage() {
  const { toast } = useToast();
  const [images, setImages] = React.useState<GalleryImage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [barberId, setBarberId] = React.useState<string | null>(null);

  const [showModal, setShowModal] = React.useState(false);
  const [url, setUrl] = React.useState("");
  const [caption, setCaption] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [uploading, setUploading] = React.useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const formData = new FormData();
    formData.append("file", file);
    
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Erreur de téléchargement");
      }
      const data = await res.json();
      setUrl(data.url);
      toast("Image téléversée avec succès !", "success");
    } catch (err) {
      toast("Erreur lors de l'upload de l'image", "error");
    } finally {
      setUploading(false);
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const meRes = await fetch("/api/auth/me");
        if (!meRes.ok) throw new Error("Non connecté");
        const { user: me } = await meRes.json();

        const barberRes = await fetch("/api/barbers");
        if (!barberRes.ok) throw new Error("Erreur profil coiffeur");
        const { barbers } = await barberRes.json();
        let myBarber = barbers?.find(
          (b: { userId: string }) => b.userId === me.id
        );
        
        if (!myBarber && me.role === "BARBER") {
          // Automatically create the barber profile if it doesn't exist yet
          const createRes = await fetch("/api/barbers", { method: "POST" });
          if (createRes.ok) {
            const createData = await createRes.json();
            myBarber = createData.barber;
            
            // Re-fetch the barbers list to ensure we have the correct populated object
            const refetchRes = await fetch("/api/barbers");
            if (refetchRes.ok) {
              const refetchData = await refetchRes.json();
              myBarber = refetchData.barbers?.find((b: { userId: string }) => b.userId === me.id);
            }
          }
        }
        
        if (!myBarber) throw new Error("Aucun profil coiffeur");
        if (cancelled) return;
        setBarberId(myBarber.id);

        const galleryRes = await fetch(`/api/barbers/${myBarber.id}/gallery`);
        if (!galleryRes.ok) throw new Error("Erreur chargement galerie");
        const { images: imgs } = await galleryRes.json();
        if (!cancelled) setImages(imgs ?? []);
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Une erreur est survenue"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAdd() {
    if (!url.trim() || !barberId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/barbers/${barberId}/gallery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), caption: caption.trim() || undefined }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de l'ajout");
      }
      const data = await res.json();
      setImages((prev) => [data.image, ...prev]);
      setUrl("");
      setCaption("");
      setShowModal(false);
      toast("Photo ajoutée avec succès", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de l'ajout",
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(imageId: string) {
    setDeleting(imageId);
    try {
      const res = await fetch(`/api/gallery/${imageId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur lors de la suppression");
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      toast("Photo supprimée", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Erreur lors de la suppression",
        "error"
      );
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-neutral-900 dark:border-neutral-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            Ma Galerie
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Gérez les photos de vos réalisations
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Ajouter une photo
        </Button>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Image className="h-12 w-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
              Aucune photo
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
              Ajoutez des photos de vos réalisations pour montrer votre travail
              aux clients.
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Ajouter une photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={img.url}
                  alt={img.caption || "Photo"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://placehold.co/400x400/e2e8f0/64748b?text=Erreur";
                  }}
                />
              </div>
              {img.caption && (
                <div className="p-3">
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
                    {img.caption}
                  </p>
                </div>
              )}
              <button
                onClick={() => handleDelete(img.id)}
                disabled={deleting === img.id}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 hover:bg-red-600 disabled:opacity-50"
              >
                {deleting === img.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setUrl("");
          setCaption("");
        }}
        title="Ajouter une photo"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
          className="space-y-4"
        >
          {/* Visual File Uploader Zone */}
          <div className="mb-4">
            <label className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl cursor-pointer bg-neutral-50/50 hover:bg-neutral-50 dark:bg-neutral-900/30 dark:hover:bg-neutral-900/50 transition-all group overflow-hidden">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 animate-pulse">
                    Téléversement en cours...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center px-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100 dark:border-violet-900 group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                      Cliquez pour téléverser votre réalisation
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      PNG, JPG, JPEG ou WEBP (Max. 5Mo)
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Ou par lien URL :
            </label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/photo.jpg"
              className="flex h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-offset-neutral-950"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Légende <span className="text-neutral-400">(optionnel)</span>
            </label>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Coupe dégradé - été 2026"
              className="flex h-12 w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-neutral-900 dark:ring-offset-neutral-950"
            />
          </div>
          {url && (
            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <img
                src={url}
                alt="Aperçu"
                className="w-full h-48 object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/400x400/e2e8f0/64748b?text=Aperçu+indisponible";
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setUrl("");
                setCaption("");
              }}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={saving || !url.trim()}>
              {saving ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
