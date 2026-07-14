import { RequestError } from "@octokit/request-error";
import { NextResponse } from "next/server";

import { getRepository } from "@/lib/github";
import { createClient } from "@/lib/supabase/server";

const REPOSITORY_NAME_PATTERN = /^[^/\s]+\/[^/\s]+$/;

export async function POST(request: Request) {
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

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    if (
        typeof body !== "object" ||
        body === null ||
        !("fullName" in body) ||
        typeof body.fullName !== "string"
    ) {
        return NextResponse.json(
            {
                error:
                    "Repository name is required in owner/name format",
            },
            { status: 400 }
        );
    }

    const fullName = body.fullName.trim();

    if (!REPOSITORY_NAME_PATTERN.test(fullName)) {
        return NextResponse.json(
            {
                error:
                    "Repository must use owner/name format, e.g. vercel/next.js",
            },
            { status: 400 }
        );
    }

    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.provider_token) {
        return NextResponse.json(
            {
                error:
                    "GitHub access token is unavailable. Please sign in with GitHub again.",
            },
            { status: 401 }
        );
    }

    const [owner, name] = fullName.split("/");

    let githubRepo;

    try {
        githubRepo = await getRepository({
            accessToken: session.provider_token,
            owner,
            repo: name,
        });
    } catch (error) {
        if (error instanceof RequestError) {
            if (error.status === 404) {
                return NextResponse.json(
                    {
                        error:
                            "Repository was not found or you do not have access to it",
                    },
                    { status: 404 }
                );
            }

            if (error.status === 401) {
                return NextResponse.json(
                    {
                        error:
                            "GitHub authorization has expired. Please sign in again.",
                    },
                    { status: 401 }
                );
            }

            if (error.status === 403) {
                return NextResponse.json(
                    {
                        error:
                            "GitHub denied access to this repository",
                    },
                    { status: 403 }
                );
            }
        }

        console.error(
            "Failed to verify GitHub repository:",
            error
        );

        return NextResponse.json(
            {
                error: "Failed to verify GitHub repository",
            },
            { status: 502 }
        );
    }

    const { data: repo, error } = await supabase
        .from("repos")
        .insert({
            user_id: user.id,
            owner: githubRepo.owner,
            name: githubRepo.name,
            full_name: githubRepo.fullName,
        })
        .select(
            "id, owner, name, full_name, last_synced_sha, created_at"
        )
        .single();

    if (error) {
        if (error.code === "23505") {
            return NextResponse.json(
                { error: "Repository is already connected" },
                { status: 409 }
            );
        }

        console.error("Failed to connect repository:", error);

        return NextResponse.json(
            { error: "Failed to connect repository" },
            { status: 500 }
        );
    }

    return NextResponse.json(
        { repo },
        { status: 201 }
    );
}