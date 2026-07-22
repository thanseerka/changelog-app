import { RequestError } from "@octokit/request-error";
import { NextResponse } from "next/server";

import { generateChangelog } from "@/lib/changelog-generator";
import {
    getRepositoryCommits,
    getUnsyncedCommits,
} from "@/lib/github";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{
        repoId: string;
    }>;
};

export async function POST(
    _request: Request,
    context: RouteContext
) {
    const { repoId } = await context.params;

    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    const { data: repo, error: repoError } = await supabase
        .from("repos")
        .select(
            "id, owner, name, full_name, last_synced_sha"
        )
        .eq("id", repoId)
        .single();

    if (repoError || !repo) {
        return NextResponse.json(
            { error: "Repository not found" },
            { status: 404 }
        );
    }

    const {
        data: githubAccount,
        error: githubError,
    } = await supabase
        .from("github_accounts")
        .select("access_token")
        .eq("user_id", user.id)
        .maybeSingle();

    if (
        githubError ||
        !githubAccount?.access_token
    ) {
        return NextResponse.json(
            {
                error: "GitHub account is not connected.",
            },
            { status: 401 }
        );
    }

    let commits;

    try {
        commits = await getRepositoryCommits({
            accessToken: githubAccount.access_token,
            owner: repo.owner,
            repo: repo.name,
        });
    } catch (error) {
        if (
            error instanceof RequestError &&
            error.status === 401
        ) {
            return NextResponse.json(
                {
                    error:
                        "GitHub authorization has expired. Please sign in again.",
                },
                { status: 401 }
            );
        }

        console.error(
            "Failed to fetch repository commits:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to fetch repository commits",
            },
            { status: 502 }
        );
    }

    const unsyncedCommits = getUnsyncedCommits(
        commits,
        repo.last_synced_sha
    );

    if (unsyncedCommits.length === 0) {
        return NextResponse.json(
            {
                error: "No new commits to generate a changelog",
            },
            { status: 409 }
        );
    }

    let contentMd: string;

    try {
        contentMd = await generateChangelog(
            unsyncedCommits
        );
    } catch (error) {
        console.error(
            "Failed to generate changelog:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to generate changelog",
            },
            { status: 502 }
        );
    }

    const versionLabel = new Date()
        .toISOString()
        .slice(0, 10);

    const { data: changelog, error: changelogError } =
        await supabase
            .from("changelogs")
            .insert({
                repo_id: repo.id,
                version_label: versionLabel,
                content_md: contentMd,
            })
            .select(
                "id, repo_id, version_label, content_md, published, created_at"
            )
            .single();

    if (changelogError || !changelog) {
        console.error(
            "Failed to save changelog:",
            changelogError
        );

        return NextResponse.json(
            {
                error: "Failed to save changelog",
            },
            { status: 500 }
        );
    }

    const latestProcessedSha = unsyncedCommits[0].sha;

    const { error: updateError } = await supabase
        .from("repos")
        .update({
            last_synced_sha: latestProcessedSha,
        })
        .eq("id", repo.id);

    if (updateError) {
        console.error(
            "Failed to update repository sync state:",
            updateError
        );

        return NextResponse.json(
            {
                error:
                    "Changelog was created but repository sync state could not be updated",
            },
            { status: 500 }
        );
    }

    return NextResponse.json(
        {
            changelog,
            processedCommits: unsyncedCommits.length,
            lastSyncedSha: latestProcessedSha,
        },
        { status: 201 }
    );
}