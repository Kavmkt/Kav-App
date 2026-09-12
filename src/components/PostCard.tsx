"use client";

import { useState } from "react";
import {
  Heart,
  MessageCircle,
  Repeat2,
  Image as ImageIcon,
  Video,
  Layers,
  X,
  ExternalLink,
} from "lucide-react";
import { formatCompact, formatDate, formatDateTime, formatNumber, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import type { Post } from "@prisma/client";

const typeIcon = {
  IMAGE: ImageIcon,
  VIDEO: Video,
  CAROUSEL: Layers,
  REEL: Video,
} as const;

const typeGradient = {
  IMAGE: "from-violet-400 to-indigo-500",
  VIDEO: "from-rose-400 to-orange-400",
  CAROUSEL: "from-emerald-400 to-teal-500",
  REEL: "from-fuchsia-400 to-pink-500",
} as const;

const typeLabel = {
  IMAGE: "Foto",
  VIDEO: "Vídeo",
  CAROUSEL: "Carrossel",
  REEL: "Reel",
} as const;

/**
 * Fonte da miniatura de um post, se existir uma real utilizável:
 * - Vídeo/Reel: só thumbnail_url serve como imagem (media_url aponta pro
 *   arquivo de vídeo em si, não renderiza como <img>).
 * - Foto/Carrossel: media_url já é uma imagem, usa direto.
 * Posts de demonstração não têm nenhum dos dois — cai no bloco colorido.
 */
function getPreviewSrc(post: Post): string | null {
  if (post.thumbnailUrl) return post.thumbnailUrl;
  if (post.mediaUrl && (post.type === "IMAGE" || post.type === "CAROUSEL")) {
    return post.mediaUrl;
  }
  return null;
}

export function PostCard({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const Icon = typeIcon[post.type];
  const previewSrc = getPreviewSrc(post);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full overflow-hidden rounded-xl border border-border-subtle text-left"
      >
        <div
          className={cn(
            "relative flex h-28 items-center justify-center overflow-hidden",
            !previewSrc && `bg-gradient-to-br ${typeGradient[post.type]}`
          )}
        >
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- URLs assinadas/rotativas da Meta não são compatíveis com o allowlist de domínio do next/image
            <img
              src={previewSrc}
              alt={post.caption ?? "Post do Instagram"}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <Icon className="text-white/90" size={26} />
          )}
          {previewSrc && post.type !== "IMAGE" && (
            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/40 px-1.5 py-0.5 text-white">
              <Icon size={11} />
            </span>
          )}
          <span className="absolute right-2 top-2 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-medium text-white">
            {formatDate(post.postedAt)}
          </span>
        </div>
        <div className="space-y-1.5 p-2.5">
          {post.caption && (
            <p className="line-clamp-2 text-xs text-foreground/70">
              {post.caption}
            </p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-foreground/50">
            <span className="flex items-center gap-1">
              <Heart size={12} /> {formatCompact(post.likes)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle size={12} /> {formatCompact(post.comments)}
            </span>
            <span className="flex items-center gap-1">
              <Repeat2 size={12} /> {formatCompact(post.shares)}
            </span>
          </div>
        </div>
      </button>

      {open && (
        <PostPreviewDialog
          post={post}
          previewSrc={previewSrc}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function PostPreviewDialog({
  post,
  previewSrc,
  onClose,
}: {
  post: Post;
  previewSrc: string | null;
  onClose: () => void;
}) {
  const Icon = typeIcon[post.type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {previewSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewSrc}
              alt={post.caption ?? "Post do Instagram"}
              className="max-h-[50vh] w-full object-cover"
            />
          ) : (
            <div
              className={`flex h-56 items-center justify-center bg-gradient-to-br ${typeGradient[post.type]}`}
            >
              <Icon className="text-white/90" size={40} />
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center justify-between">
            <Badge tone="brand">{typeLabel[post.type]}</Badge>
            <span className="text-xs text-foreground/50">
              {formatDateTime(post.postedAt)}
            </span>
          </div>

          {post.caption && (
            <p className="whitespace-pre-line text-sm text-foreground/80">
              {post.caption}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-foreground/60">
            <span className="flex items-center gap-1.5">
              <Heart size={15} /> {formatNumber(post.likes)}
            </span>
            <span className="flex items-center gap-1.5">
              <MessageCircle size={15} /> {formatNumber(post.comments)}
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat2 size={15} /> {formatNumber(post.shares)}
            </span>
          </div>

          {post.permalink && (
            <a
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
            >
              Ver no Instagram <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
