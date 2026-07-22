import { NextResponse } from "next/server";

export async function GET() {
    const clientId = process.env.GITHUB_CLIENT_ID!;

    const redirectUri = process.env.GITHUB_CALLBACK_URL!;

    const scope = "repo read:user";

    const githubUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(githubUrl);
}