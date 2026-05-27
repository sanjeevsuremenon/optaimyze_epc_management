import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/router";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/outline";

// Load ReactQuill dynamically to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

export default function LessonsLearntPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [contributors, setContributors] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const quillModules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  }), []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/api/lessons");
        setPages(res.data.pages || []);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const loadPage = async (slugToLoad) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/api/lessons/${slugToLoad}`);
      const p = res.data;
      setSelectedSlug(p.slug);
      setTitle(p.title || "");
      setSlug(p.slug || "");
      setContent(p.content || "");
      setContributors(p.contributors || []);
      setIsEditing(false);
      setIsCreating(false);
    } catch (e) {
      setError("Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedSlug(null);
    setTitle("");
    setSlug("");
    setContent("");
    setContributors([]);
    setIsCreating(true);
    setIsEditing(true);
  };

  const saveNew = async () => {
    if (!session?.user) {
      setError("Please sign in to create a page.");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    if (!title || !slug) {
      setError("Title and slug are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/lessons", { title, slug, content });
      const created = res.data;
      setPages((prev) => [{ _id: created.id, title: created.title, slug: created.slug, updatedAt: created.updatedAt }, ...prev]);
      await loadPage(created.slug);
    } catch (e) {
      if (e?.response?.status === 401) {
        setError("Please sign in to create a page.");
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      } else {
        setError(e?.response?.data?.error || "Failed to create");
      }
    } finally {
      setLoading(false);
    }
  };

  const saveExisting = async () => {
    if (!selectedSlug) return;
    if (!session?.user) {
      setError("Please sign in to save changes.");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.put(`/api/lessons/${selectedSlug}`, { title, content });
      const updated = res.data;
      setPages((prev) => {
        const idx = prev.findIndex((p) => p.slug === selectedSlug);
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = { _id: updated._id, slug: updated.slug, title: updated.title, updatedAt: updated.updatedAt };
        return copy;
      });
      setContributors(updated.contributors || []);
      setIsEditing(false);
    } catch (e) {
      if (e?.response?.status === 401) {
        setError("Please sign in to save changes.");
        router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      } else {
        setError(e?.response?.data?.error || "Failed to save");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>    <div className="min-h-screen w-full" style={{ display: "grid", gridTemplateColumns: "280px 1fr 260px" }}>
      {/* Left Sidebar: Pages list */}
      <aside className="border-r border-gray-200 p-4 overflow-y-auto bg-gradient-to-b from-orange-50 to-pink-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Lessons Learnt</h2>
          <button 
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white/50 rounded-full transition-all duration-200 disabled:opacity-50" 
            onClick={handleCreateNew} 
            disabled={!session?.user}
            title="Create New Lesson"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        <ul className="space-y-1">
          {pages.map((p) => (
            <li key={p.slug}>
              <button
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                  selectedSlug === p.slug 
                    ? "bg-white/80 shadow-sm border border-orange-200" 
                    : "hover:bg-white/60 hover:shadow-sm"
                }`}
                onClick={() => loadPage(p.slug)}
              >
                <div className="font-medium text-gray-800">{p.title}</div>
                <div className="text-xs text-gray-500">/{p.slug}</div>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content: Editor / Viewer */}
      <main className="p-6 space-y-4 overflow-y-auto bg-gradient-to-br from-slate-50 to-blue-50">
        {error ? <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">{error}</div> : null}

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Title"
            className="border border-gray-300 px-4 py-3 rounded-lg w-full bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!isEditing}
          />
          {isCreating ? (
            <input
              type="text"
              placeholder="slug"
              className="border border-gray-300 px-4 py-3 rounded-lg w-56 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              value={slug}
              onChange={(e) => setSlug(e.target.value.replace(/\s+/g, "-").toLowerCase())}
              disabled={!isEditing}
            />
          ) : (
            selectedSlug ? <span className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg shadow-sm">/{selectedSlug}</span> : null
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {isEditing ? (
            <div className="p-4">
              <ReactQuill theme="snow" value={content} onChange={setContent} modules={quillModules} />
            </div>
          ) : (
            <div className="p-6">
              <article className="prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: content || "<p class=\"text-gray-500 italic\">No content available. Click Edit to add content.</p>" }} />
              </article>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          {isEditing ? (
            <>
              {isCreating ? (
                <button 
                  disabled={loading} 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={saveNew}
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              ) : (
                <button 
                  disabled={loading} 
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                  onClick={saveExisting}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
              )}
              <button 
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg shadow-sm transition-all duration-200" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed" 
                onClick={() => setIsEditing(true)} 
                disabled={!selectedSlug || !session?.user}
                title="Edit this lesson"
              >
                <PencilIcon className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </main>

      {/* Right Sidebar: Contributors */}
      <aside className="border-l border-gray-200 p-4 overflow-y-auto bg-gradient-to-b from-teal-50 to-cyan-50">
        <h3 className="text-base font-semibold mb-3 text-gray-800">Contributors</h3>
        <div className="bg-white/60 rounded-lg p-3 shadow-sm">
          <ul className="space-y-2">
            {(contributors || []).length === 0 ? (
              <li className="text-sm text-gray-500 italic">No contributors yet</li>
            ) : (
              contributors.map((c) => (
                <li key={c} className="text-sm text-gray-700 bg-white/50 px-2 py-1 rounded border border-teal-100">{c}</li>
              ))
            )}
          </ul>
        </div>
        <div className="mt-4 text-xs text-gray-600 bg-white/40 px-3 py-2 rounded-lg">
          {session?.user?.email ? `Signed in as ${session.user.email}` : "Read-only: sign in to edit"}
        </div>
      </aside>
    </div>    </>
  );
}


