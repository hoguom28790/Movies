"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserPlaylists, deletePlaylist, removeMovieFromPlaylist, ensureDefaultPlaylist } from "@/services/db";
import { Playlist } from "@/types/database";
import { MovieCard } from "@/components/movie/MovieCard";
import { Trash2, Folder, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

export default function WatchlistPage() {
  const { user, loading: authLoading } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      await ensureDefaultPlaylist(user.uid);
      const data = await getUserPlaylists(user.uid);
      setPlaylists(data);
      // Auto-expand the first playlist if available
      if (data.length > 0 && expandedIds.size === 0) {
        setExpandedIds(new Set([data[0].id]));
      }
    } catch (err) {
      console.error("Lỗi khi tải thư mục:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
  }, [user, authLoading]);

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleDeletePlaylist = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || deletingId) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa toàn bộ thư mục "${name}" không? Hành động này không thể hoàn tác.`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Lỗi xóa thư mục:", err);
      alert("Đã xảy ra lỗi khi xóa thư mục.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveMovie = async (playlistId: string, movieSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await removeMovieFromPlaylist(playlistId, movieSlug);
      setPlaylists(prev => prev.map(p => {
        if (p.id === playlistId) {
          return { ...p, movies: p.movies.filter(m => m.movieSlug !== movieSlug) };
        }
        return p;
      }));
    } catch (err) {
      console.error("Lỗi khi xóa phim khỏi thư mục:", err);
      alert("Đã xảy ra lỗi khi xóa.");
    }
  };

  if (authLoading || loading) return <div className="p-8 flex justify-center mt-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Bạn chưa đăng nhập</h2>
        <p className="text-neutral-400">Vui lòng đăng nhập để xem thư viện phim của bạn.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8 border-l-4 border-primary pl-3">Thư Viện Phim Của Bạn</h1>
      
      {playlists.length === 0 ? (
        <div className="text-center py-20 bg-surface rounded-2xl border border-white/5">
          <Folder className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-neutral-400 text-lg">Bạn chưa có thư mục nào.</p>
          <p className="text-neutral-500 text-sm mt-2">Hãy lưu một bộ phim để tạo thư mục đầu tiên!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {playlists.map(playlist => {
            const isExpanded = expandedIds.has(playlist.id);
            return (
              <div key={playlist.id} className="bg-surface rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
                {/* Playlist Header */}
                <div 
                  onClick={() => toggleExpand(playlist.id)}
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/5 transition-colors select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-primary/20 p-3 rounded-xl">
                      <Folder className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {playlist.name}
                      </h2>
                      <p className="text-sm text-neutral-400 mt-0.5">{playlist.movies.length} phim đã lưu</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={(e) => handleDeletePlaylist(playlist.id, playlist.name, e)}
                      disabled={deletingId === playlist.id}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                      title="Xóa thư mục này"
                    >
                      {deletingId === playlist.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/70">
                      {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Playlist Content */}
                {isExpanded && (
                  <div className="p-6 pt-0 border-t border-white/5 bg-black/20 animate-in slide-in-from-top-4 duration-300">
                    <div className="mt-6">
                      {playlist.movies.length === 0 ? (
                         <div className="text-center py-10 opacity-50">Thư mục này hiện đang trống.</div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                          {playlist.movies.map(movie => (
                            <div key={movie.movieSlug} className="relative group">
                              <MovieCard 
                                title={movie.movieTitle}
                                slug={movie.movieSlug}
                                posterUrl={movie.posterUrl}
                              />
                              <button 
                                onClick={(e) => handleRemoveMovie(playlist.id, movie.movieSlug, e)}
                                className="absolute top-2 right-2 z-20 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-2 opacity-0 lg:group-hover:opacity-100 transition-opacity shadow-md hover:scale-110 focus:opacity-100"
                                title="Xóa phim khỏi thư mục"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
