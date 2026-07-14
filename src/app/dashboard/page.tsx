import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        redirect("/login");
    }

    const email = user.email ?? "GitHub user";

    return (
        <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 text-white">
            <div className="text-center">
                <p className="text-sm text-neutral-500">
                    Signed in as
                </p>

                <h1 className="mt-2 text-3xl font-semibold">
                    {email}
                </h1>

                <p className="mt-4 text-neutral-400">
                    Your dashboard is protected.
                </p>
            </div>
        </main>
    );
}