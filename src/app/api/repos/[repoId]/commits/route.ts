import { NextResponse } from "next/server";

import { getRepositoryCommits } from "@/lib/github";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{
        repoId: string;
    }>;
};

export async function GET(
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
        .select("id, owner, name, full_name")
        .eq("id", repoId)
        .single();

    if (repoError || !repo) {
        return NextResponse.json(
            { error: "Repository not found" },
            { status: 404 }
        );
    }

    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (
        sessionError ||
        !session?.provider_token
    ) {
        return NextResponse.json(
            {
                error:
                    "GitHub access token is unavailable. Please sign in with GitHub again.",
            },
            { status: 401 }
        );
    }

    try {
        const commits = await getRepositoryCommits({
            accessToken: session.provider_token,
            owner: repo.owner,
            repo: repo.name,
        });

        return NextResponse.json({
            repository: repo.full_name,
            commits,
        });
    } catch (error) {
        console.error(
            "Failed to fetch GitHub commits:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to fetch repository commits",
            },
            { status: 502 }
        );
    }
}