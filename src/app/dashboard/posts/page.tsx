import { requireClientSession } from "@/lib/auth/guards";
import { getClientPosts } from "@/lib/data/queries";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default async function PostsPage() {
  const session = await requireClientSession();
  const posts = await getClientPosts(session.clientId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Posts</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Desempenho de todas as publicações sincronizadas do Instagram.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{posts.length} posts</CardTitle>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-foreground/50">
              Nenhum post sincronizado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
