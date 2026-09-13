import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ExternalLink,
  Facebook,
  MessageCircle,
  RefreshCw,
  ThumbsUp,
} from "lucide-react";
import { FacebookActivityFeed, FacebookPost } from "../types";

const formatPostDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const cleanFacebookText = (text: string) =>
  text
    .replace(/@\[(\d+):\d+:([^\]]+)\]/g, "$2")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1\n$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const PostCard: React.FC<{ post: FacebookPost }> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const text = cleanFacebookText(post.text);
  const isLong = text.length > 360 || text.split("\n").length > 6;

  return (
    <article className="bg-white rounded-2xl border border-slate-200 card-shadow overflow-hidden">
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center shrink-0">
              <Facebook className="w-5 h-5" fill="currentColor" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 truncate">Spotsy Disc Golf Club</p>
              <time className="text-xs text-slate-500" dateTime={post.created_at}>{formatPostDate(post.created_at)}</time>
            </div>
          </div>
          <a href={post.url} target="_blank" rel="noreferrer" aria-label="Open original post on Facebook" className="p-2 rounded-lg text-slate-400 hover:text-[#1877F2] hover:bg-blue-50 transition-colors shrink-0">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {text ? (
          <div>
            <p className={`text-[15px] leading-6 text-slate-700 whitespace-pre-line break-words ${!expanded && isLong ? "line-clamp-6" : ""}`}>{text}</p>
            {isLong && <button onClick={() => setExpanded((value) => !value)} className="mt-2 text-sm font-semibold text-green-700 hover:text-green-600">{expanded ? "Show less" : "Read more"}</button>}
          </div>
        ) : (
          <p className="text-sm italic text-slate-500">This post contains media. Open it on Facebook to view.</p>
        )}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 px-5 sm:px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4 text-[#1877F2]" />{post.reactions}</span>
          <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4" />{post.comments}</span>
        </div>
        <a href={post.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#1877F2] hover:underline">View on Facebook</a>
      </div>
    </article>
  );
};

export const CommunityFeedPage: React.FC = () => {
  const [feed, setFeed] = useState<FacebookActivityFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}activity.json?ts=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Feed request failed (${response.status})`);
      const data = (await response.json()) as FacebookActivityFeed;
      if (!Array.isArray(data.posts)) throw new Error("Feed data is not in the expected format");
      setFeed(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The community feed could not be loaded");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadFeed(); }, [loadFeed]);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <section className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2"><Facebook className="w-4 h-4" fill="currentColor" /><span>From the Facebook group</span></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Community Feed</h2>
            <p className="text-sm text-slate-300 mt-2 max-w-xl">Club updates, local rounds, events, course notices, and conversations from the Spotsy disc golf community.</p>
          </div>
          <button onClick={() => void loadFeed()} disabled={loading} className="inline-flex self-start items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-60 text-sm font-bold border border-white/10 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh
          </button>
        </div>
        <div className="absolute -right-16 -bottom-24 w-64 h-64 bg-[#1877F2]/25 rounded-full blur-3xl pointer-events-none" />
      </section>

      {feed && !loading && (
        <div className="flex items-center justify-between gap-4 px-1 text-xs text-slate-500">
          <span>{feed.posts.length} recent posts</span>
          <span>Updated {formatUpdatedAt(feed.updated_at)}</span>
        </div>
      )}

      {loading && !feed && <div className="space-y-4" aria-label="Loading community posts">{[1, 2, 3].map((item) => <div key={item} className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />)}</div>}

      {error && (
        <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-900">Community feed unavailable</h3>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
          <button onClick={() => void loadFeed()} className="mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold">Try again</button>
        </div>
      )}

      {feed && feed.posts.length === 0 && !loading && <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center"><MessageCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" /><p className="font-bold text-slate-800">No recent posts yet</p></div>}

      {feed && <div className="space-y-4">{feed.posts.map((post) => <PostCard key={post.id} post={post} />)}</div>}

      {feed && <div className="text-center pt-1 pb-3"><a href={feed.group_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#1877F2] hover:underline"><Facebook className="w-4 h-4" fill="currentColor" />Visit the Facebook group<ExternalLink className="w-3.5 h-3.5" /></a></div>}
    </div>
  );
};
