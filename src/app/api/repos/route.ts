import { NextResponse } from "next/server";

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

    const [owner, name] = fullName.split("/");

    const { data: repo, error } = await supabase
        .from("repos")
        .insert({
            user_id: user.id,
            owner,
            name,
            full_name: fullName,
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