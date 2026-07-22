import { redirect } from "next/navigation";

import DashboardClient from "./dashboard-client";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect("/login");
    }

    const { data: repos, error: reposError } = await supabase
        .from("repos")
        .select(
            "id, owner, name, full_name, last_synced_sha, created_at"
        )
        .order("created_at", {
            ascending: false,
        });

    if (reposError) {
        console.error(
            "Failed to load repositories:",
            reposError
        );
    }

    // Check whether GitHub account is connected
    const { data: githubAccount, error: githubError } =
        await supabase
            .from("github_accounts")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

    if (githubError) {
        console.error(
            "Failed to load GitHub account:",
            githubError
        );
    }

    return (
        <DashboardClient
            initialRepos={repos ?? []}
            githubConnected={!!githubAccount}
        />
    );
}