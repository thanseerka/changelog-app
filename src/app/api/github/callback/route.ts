import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    const code = request.nextUrl.searchParams.get("code");

    if (!code) {
        return NextResponse.json(
            { error: "Missing authorization code" },
            { status: 400 }
        );
    }

    // Exchange authorization code for access token
    const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        }
    );

    const token = await response.json();

    if (!token.access_token) {
        return NextResponse.json(token, { status: 400 });
    }

    // Fetch GitHub user details
    const githubUserResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${token.access_token}`,
            Accept: "application/vnd.github+json",
        },
    });

    if (!githubUserResponse.ok) {
        return NextResponse.json(
            { error: "Failed to fetch GitHub user" },
            { status: 500 }
        );
    }

    const githubUser = await githubUserResponse.json();

    // Get authenticated Supabase user
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Save or update GitHub account
    const { error } = await supabase.from("github_accounts").upsert(
        {
            user_id: user.id,
            github_user_id: githubUser.id,
            github_login: githubUser.login,
            access_token: token.access_token,
        },
        {
            onConflict: "user_id",
        }
    );

    if (error) {
        console.error(error);

        return NextResponse.json(
            {
                error: error.message,
            },
            {
                status: 500,
            }
        );
    }

    // Redirect back to dashboard
    return NextResponse.redirect(
        new URL("/dashboard?github=connected", request.url)
    );
}