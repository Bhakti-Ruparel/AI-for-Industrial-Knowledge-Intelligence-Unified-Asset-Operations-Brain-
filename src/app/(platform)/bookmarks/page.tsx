import { Bookmark } from "lucide-react";

export default function BookmarksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bookmarks</h1>
        <p className="text-muted-foreground">Your saved items and quick links.</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200/80 bg-white p-16 text-center shadow-xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
          <Bookmark className="h-5 w-5 text-zinc-400" />
        </div>
        <p className="text-sm font-semibold text-zinc-800">No bookmarks yet</p>
        <p className="text-xs text-zinc-500">Save equipment, documents, or incidents for quick access.</p>
      </div>
    </div>
  );
}
