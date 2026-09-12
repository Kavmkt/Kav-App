import { Heart, MessageCircle, Repeat2, Image as ImageIcon, Video, Layers } from "lucide-react";
import { formatCompact, formatDate } from "@/lib/utils";
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

export function PostCard({ post }: { post: Post }) {
  const Icon = typeIcon[post.type];

  return (
    <div className="group overflow-hidden rounded-xl border border-border-subtle">
      <div
        className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${typeGradient[post.type]}`}
      >
        <Icon className="text-white/90" size={26} />
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
    </div>
  );
}
