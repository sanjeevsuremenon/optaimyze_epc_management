import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import { useSession } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/router";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/outline";

const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[280px] rounded-lg border border-app-border bg-app-bg p-4 text-sm text-app-text-muted">
      Loading editor…
    </div>
  ),
});
import "react-quill-new/dist/quill.snow.css";

const inputClass =
  "border border-app-border px-4 py-3 rounded-lg w-full bg-app-bg text-app-text shadow-sm placeholder:text-app-text-disabled focus:outline-none focus:ring-2 focus:ring-app-accent/30 focus:border-app-accent transition disabled:opacity-60";

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function LessonsLearntPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [pages, setPages] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [content, setContent] = useState("");
  const [contributors, setContributors] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [error, setError] = useState("");

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setListLoading(true);
      try {
        const res = await axios.get("/api/lessons");
        if (!cancelled) setPages(res.data.pages || []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load lessons list");
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPage = async (slugToLoad) => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/api/lessons/${encodeURIComponent(slugToLoad)}`);
      const p = res.data;
      setSelectedSlug(p.slug);
      setTitle(p.title || "");
      setSlug(p.slug || "");
      setSlugTouched(true);
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
    if (sessionStatus === "unauthenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    setSelectedSlug(null);
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setContent("");
    setContributors([]);
    setIsCreating(true);
    setIsEditing(true);
    setError("");
  };

  const saveNew = async () => {
    if (!session?.user) {
      setError("Please sign in to create a page.");
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`);
      return;
    }
    const nextSlug = slugify(slug || title);
    if (!title || !nextSlug) {
      setError("Title and slug are required");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/api/lessons", {
        title,
        slug: nextSlug,
        content,
      });
      const created = res.data;
      setPages((prev) => [
        {
          _id: created.id,
          title: created.title,
          slug: created.slug,
          updatedAt: created.updatedAt,
        },
        ...prev.filter((p) => p.slug !== created.slug),
      ]);
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
      const res = await axios.put(`/api/lessons/${encodeURIComponent(selectedSlug)}`, {
        title,
        content,
      });
      const updated = res.data;
      setPages((prev) => {
        const idx = prev.findIndex((p) => p.slug === selectedSlug);
        if (idx === -1) return prev;
        const copy = [...prev];
        copy[idx] = {
          _id: updated._id,
          slug: updated.slug,
          title: updated.title,
          updatedAt: updated.updatedAt,
        };
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

  const cancelEdit = () => {
    if (isCreating) {
      setIsCreating(false);
      setIsEditing(false);
      setTitle("");
      setSlug("");
      setContent("");
      setError("");
      return;
    }
    if (selectedSlug) {
      loadPage(selectedSlug);
      return;
    }
    setIsEditing(false);
  };

  return (
    <div className="app-page min-h-screen text-app-text">
      <Head>
        <title>Lessons Learnt | Optaimyze</title>
      </Head>

      <style jsx global>{`
        .lessons-content {
          color: var(--app-text);
          line-height: 1.6;
          counter-reset: lessons-list;
        }
        .lessons-content p {
          margin: 0 0 0.75rem;
        }
        .lessons-content a {
          color: var(--app-accent);
          text-decoration: underline;
        }
        /* Standard HTML lists from the editor */
        .lessons-content ul {
          list-style-type: disc !important;
          list-style-position: outside;
          padding-left: 1.75rem;
          margin: 0.75rem 0;
        }
        .lessons-content ol {
          list-style-type: decimal !important;
          list-style-position: outside;
          padding-left: 1.75rem;
          margin: 0.75rem 0;
        }
        .lessons-content li {
          display: list-item !important;
          list-style: inherit !important;
          padding-left: 0.25rem;
          margin: 0.25rem 0;
        }
        .lessons-content ul ul {
          list-style-type: circle !important;
        }
        .lessons-content ol ol {
          list-style-type: lower-alpha !important;
        }
        /* Quill 2 data-list format (if present) */
        .lessons-content li[data-list] {
          list-style-type: none !important;
          padding-left: 1.5em;
          position: relative;
        }
        .lessons-content li[data-list="bullet"]::before,
        .lessons-content li[data-list="bullet"] > .ql-ui:before {
          content: "\\2022";
          display: inline-block;
          margin-left: -1.5em;
          margin-right: 0.3em;
          width: 1.2em;
          text-align: right;
        }
        .lessons-content li[data-list="ordered"] {
          counter-increment: lessons-list;
        }
        .lessons-content li[data-list="ordered"]::before,
        .lessons-content li[data-list="ordered"] > .ql-ui:before {
          content: counter(lessons-list, decimal) ". ";
          display: inline-block;
          margin-left: -1.5em;
          margin-right: 0.3em;
          width: 1.2em;
          text-align: right;
        }
        .lessons-content li[data-list]:has(> .ql-ui)::before {
          content: none;
        }
      `}</style>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_260px] min-h-[calc(100vh-4rem)]">
        <aside className="border-b lg:border-b-0 lg:border-r border-app-border p-4 overflow-y-auto bg-app-surface">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-app-text">Lessons Learnt</h2>
            <button
              type="button"
              className="p-1.5 text-app-text-muted hover:text-app-accent hover:bg-app-surface-muted rounded-full transition disabled:opacity-50"
              onClick={handleCreateNew}
              disabled={sessionStatus === "loading"}
              title="Create New Lesson"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
          <ul className="space-y-1">
            {listLoading && (
              <li className="text-sm text-app-text-muted px-1 py-4">Loading lessons…</li>
            )}
            {!listLoading &&
              pages.map((p) => (
                <li key={p.slug}>
                  <button
                    type="button"
                    className={`w-full text-left px-3 py-2 rounded-lg transition ${
                      selectedSlug === p.slug
                        ? "bg-app-accent-soft border border-app-accent/30 text-app-text shadow-sm"
                        : "hover:bg-app-surface-muted border border-transparent text-app-text"
                    }`}
                    onClick={() => loadPage(p.slug)}
                  >
                    <div className="font-medium text-app-text">{p.title}</div>
                    <div className="text-xs text-app-text-muted">/{p.slug}</div>
                  </button>
                </li>
              ))}
            {!listLoading && pages.length === 0 && (
              <li className="text-sm text-app-text-muted italic px-1 py-4">
                No lessons yet. Create one to get started.
              </li>
            )}
          </ul>
        </aside>

        <main className="p-4 sm:p-6 space-y-4 overflow-y-auto bg-app-bg">
          {error ? (
            <div className="text-rose-500 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              {error}
            </div>
          ) : null}

          {!isEditing && !selectedSlug && !isCreating ? (
            <div className="rounded-xl border border-dashed border-app-border bg-app-surface p-8 text-center">
              <h3 className="text-lg font-semibold text-app-text">Select or create a lesson</h3>
              <p className="mt-2 text-sm text-app-text-muted">
                Choose a lesson from the left, or click + to add a new lessons learnt entry.
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-app-accent-text shadow-sm transition hover:opacity-90"
              >
                <PlusIcon className="h-4 w-4" />
                New lesson
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  placeholder="Title"
                  className={inputClass}
                  value={title}
                  onChange={(e) => {
                    const nextTitle = e.target.value;
                    setTitle(nextTitle);
                    if (isCreating && !slugTouched) setSlug(slugify(nextTitle));
                  }}
                  disabled={!isEditing}
                />
                {isCreating ? (
                  <input
                    type="text"
                    placeholder="slug"
                    className={`${inputClass} sm:w-56`}
                    value={slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setSlug(slugify(e.target.value));
                    }}
                    disabled={!isEditing}
                  />
                ) : selectedSlug ? (
                  <span className="text-sm text-app-text-muted bg-app-surface border border-app-border px-3 py-2 rounded-lg whitespace-nowrap">
                    /{selectedSlug}
                  </span>
                ) : null}
              </div>

              <div className="bg-app-surface rounded-xl shadow-sm border border-app-border overflow-hidden">
                {isEditing ? (
                  <div className="p-3 sm:p-4 lessons-quill [&_.ql-toolbar.ql-snow]:rounded-t-xl [&_.ql-toolbar.ql-snow]:border-app-border [&_.ql-toolbar.ql-snow]:bg-app-surface-muted [&_.ql-container.ql-snow]:min-h-[280px] [&_.ql-container.ql-snow]:rounded-b-xl [&_.ql-container.ql-snow]:border-app-border [&_.ql-container.ql-snow]:bg-app-bg [&_.ql-editor]:min-h-[260px] [&_.ql-editor]:text-app-text">
                    <ReactQuill
                      theme="snow"
                      value={content}
                      onChange={setContent}
                      modules={quillModules}
                    />
                  </div>
                ) : (
                  <div className="p-4 sm:p-6">
                    {loading ? (
                      <p className="text-sm text-app-text-muted">Loading…</p>
                    ) : (
                      <div
                        className="lessons-content"
                        dangerouslySetInnerHTML={{
                          __html:
                            content ||
                            '<p class="text-app-text-muted italic">No content available. Click Edit to add content.</p>',
                        }}
                      />
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 justify-end">
                {isEditing ? (
                  <>
                    {isCreating ? (
                      <button
                        type="button"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={saveNew}
                      >
                        {loading ? "Creating..." : "Create"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={saveExisting}
                      >
                        {loading ? "Saving..." : "Save"}
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-4 py-2 bg-app-surface-muted hover:bg-app-border text-app-text rounded-lg border border-app-border transition"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="p-2 text-app-text-muted hover:text-app-accent hover:bg-app-accent-soft rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => {
                      if (!session?.user) {
                        router.push(
                          `/auth/login?callbackUrl=${encodeURIComponent(router.asPath)}`
                        );
                        return;
                      }
                      setIsEditing(true);
                    }}
                    disabled={!selectedSlug}
                    title="Edit this lesson"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </>
          )}
        </main>

        <aside className="border-t lg:border-t-0 lg:border-l border-app-border p-4 overflow-y-auto bg-app-surface">
          <h3 className="text-base font-semibold mb-3 text-app-text">Contributors</h3>
          <div className="bg-app-bg border border-app-border rounded-lg p-3 shadow-sm">
            <ul className="space-y-2">
              {(contributors || []).length === 0 ? (
                <li className="text-sm text-app-text-muted italic">No contributors yet</li>
              ) : (
                contributors.map((c) => (
                  <li
                    key={c}
                    className="text-sm text-app-text-secondary bg-app-surface px-2 py-1 rounded border border-app-border"
                  >
                    {c}
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="mt-4 text-xs text-app-text-muted bg-app-bg border border-app-border px-3 py-2 rounded-lg">
            {session?.user?.email
              ? `Signed in as ${session.user.email}`
              : "Read-only: sign in to edit"}
          </div>
        </aside>
      </div>
    </div>
  );
}
