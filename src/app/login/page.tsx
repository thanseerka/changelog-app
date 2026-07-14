"use client";

import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
    const handleGitHubLogin = async () => {
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "github",
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
                scopes: "repo read:user",
            },
        });

        if (error) {
            console.error("GitHub login failed:", error.message);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
            <div className="w-full max-w-md text-center">
                <h1 className="text-4xl font-semibold tracking-tight">
                    Changelog Generator
                </h1>

                <p className="mt-4 text-neutral-400">
                    Turn your GitHub commits into clean changelogs.
                </p>

                <button
                    type="button"
                    onClick={handleGitHubLogin}
                    className="mt-8 w-full rounded-lg bg-white px-5 py-3 font-medium text-black transition hover:bg-neutral-200"
                >
                    Continue with GitHub
                </button>
            </div>
        </main>
    );
}