"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";

type Changelog = {
    id: string;
    repo_id: string;
    version_label: string;
    content_md: string;
    published: boolean;
    created_at: string;
};
type Repository = {
    id: string;
    owner: string;
    name: string;
    full_name: string;
    last_synced_sha: string | null;
    created_at: string;
    changelogs: Changelog[];
};

type DashboardClientProps = {
    initialRepos: Repository[];
    githubConnected: boolean;
};

type ConnectedRepository = Omit<
    Repository,
    "changelogs"
>;

export default function DashboardClient({
    initialRepos,
    githubConnected,
}: DashboardClientProps) {
    const [repos, setRepos] = useState<Repository[]>(initialRepos);

    const [fullName, setFullName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [generatingRepoId, setGeneratingRepoId] = useState<string | null>(null);

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!githubConnected) {
            setError(
                "Please connect your GitHub account before connecting a repository."
            );
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch("/api/repos", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName,
                }),
            });

            const data: {
                repo?: ConnectedRepository;
                error?: string;
            } = await response.json();

            if (!response.ok || !data.repo) {
                setError(data.error ?? "Failed to connect repository");
                return;
            }

            const connectedRepo: Repository = {
                ...data.repo,
                changelogs: [],
            };

            setRepos((currentRepos) => [
                connectedRepo,
                ...currentRepos,
            ]);

            setFullName("");
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGenerate = async (repoId: string) => {
        setError(null);
        setGeneratingRepoId(repoId);

        try {
            const response = await fetch(
                `/api/repos/${repoId}/changelogs/generate`,
                {
                    method: "POST",
                }
            );

            const data: {
                changelog?: Changelog;
                lastSyncedSha?: string;
                error?: string;
            } = await response.json();

            if (
                !response.ok ||
                !data.changelog ||
                !data.lastSyncedSha
            ) {
                setError(
                    data.error ?? "Failed to generate changelog"
                );

                return;
            }

            const generatedChangelog = data.changelog;
            const lastSyncedSha = data.lastSyncedSha;

            setRepos((currentRepos) =>
                currentRepos.map((repo) =>
                    repo.id === repoId
                        ? {
                            ...repo,
                            last_synced_sha: lastSyncedSha,
                            changelogs: [
                                generatedChangelog,
                                ...repo.changelogs,
                            ],
                        }
                        : repo
                )
            );
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setGeneratingRepoId(null);
        }
    };

    return (
        <main className="min-h-screen bg-neutral-950 px-6 py-12 text-white">
            <div className="mx-auto max-w-4xl">
                <header>
                    <p className="text-sm font-medium text-neutral-500">
                        Changelog Generator
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Repositories
                    </h1>

                    <p className="mt-2 text-neutral-400">
                        Connect a GitHub repository to generate changelogs
                        from its commits.
                    </p>

                    <div className="mt-6">
                        {githubConnected ? (
                            <div className="inline-flex items-center rounded-lg border border-green-700 bg-green-900/30 px-4 py-2 text-green-300">
                                ✅ GitHub Connected
                            </div>
                        ) : (
                            <a
                                href="/api/github/connect"
                                className="inline-flex items-center rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-neutral-200"
                            >
                                Connect GitHub
                            </a>
                        )}
                    </div>
                </header>

                <section className="mt-10 rounded-xl border border-neutral-800 bg-neutral-900 p-6">
                    <h2 className="text-lg font-medium">
                        Connect repository
                    </h2>

                    <form
                        onSubmit={handleSubmit}
                        className="mt-4 flex flex-col gap-3 sm:flex-row"
                    >
                        <input
                            type="text"
                            value={fullName}
                            onChange={(event) =>
                                setFullName(event.target.value)
                            }
                            placeholder="owner/repository"
                            disabled={!githubConnected || isSubmitting}
                            className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-white outline-none placeholder:text-neutral-600 focus:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                            type="submit"
                            disabled={!githubConnected || isSubmitting}
                            className="rounded-lg bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting
                                ? "Connecting..."
                                : "Connect repository"}
                        </button>
                    </form>

                    {!githubConnected && (
                        <p className="mt-3 text-sm text-yellow-400">
                            Connect your GitHub account before adding repositories.
                        </p>
                    )}

                    {error && (
                        <p className="mt-3 text-sm text-red-400">
                            {error}
                        </p>
                    )}
                </section>

                <section className="mt-10">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium">
                            Connected repositories
                        </h2>

                        <span className="text-sm text-neutral-500">
                            {repos.length}{" "}
                            {repos.length === 1
                                ? "repository"
                                : "repositories"}
                        </span>
                    </div>

                    {repos.length === 0 ? (
                        <div className="mt-4 rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center">
                            <p className="text-neutral-400">
                                No repositories connected yet.
                            </p>

                            <p className="mt-2 text-sm text-neutral-600">
                                Connect your first GitHub repository above.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {repos.map((repo) => (
                                <article
                                    key={repo.id}
                                    className="rounded-xl border border-neutral-800 bg-neutral-900 p-5"
                                >
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                        <div>
                                            <h3 className="font-medium">
                                                {repo.full_name}
                                            </h3>

                                            <p className="mt-1 text-sm text-neutral-500">
                                                {repo.last_synced_sha
                                                    ? `Last synced at ${repo.last_synced_sha.slice(
                                                        0,
                                                        7
                                                    )}`
                                                    : "Not synced yet"}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleGenerate(repo.id)}
                                            disabled={generatingRepoId === repo.id}
                                            className="w-fit rounded-lg bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {generatingRepoId === repo.id
                                                ? "Generating..."
                                                : "Generate changelog"}
                                        </button>
                                    </div>

                                    {repo.changelogs.length > 0 && (
                                        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5">
                                            <div className="mb-4 flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-lg font-semibold">
                                                        Latest Changelog
                                                    </h4>

                                                    <p className="text-sm text-neutral-500">
                                                        Version: {repo.changelogs[0].version_label}
                                                    </p>
                                                </div>

                                                {repo.changelogs[0].published && (
                                                    <span className="rounded-full bg-green-900 px-3 py-1 text-xs text-green-300">
                                                        Published
                                                    </span>
                                                )}
                                            </div>

                                            <div className="prose prose-invert max-w-none">
                                                <ReactMarkdown>
                                                    {repo.changelogs[0].content_md}
                                                </ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}