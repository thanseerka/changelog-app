import OpenAI from "openai";

import type { GitHubCommit } from "@/lib/github";

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

export async function generateChangelog(
    commits: GitHubCommit[]
): Promise<string> {
    const commitList = commits
        .map(
            (commit) =>
                `- ${commit.sha.slice(0, 7)}: ${commit.message}`
        )
        .join("\n");

    const response = await openai.chat.completions.create({
        model: "openrouter/auto",
        temperature: 0.3,
        messages: [
            {
                role: "system",
                content: `You generate concise, user-facing software changelogs.

                            Group changes into these categories when relevant:
                            - Features
                            - Fixes
                            - Improvements
                            - Chores

                            Omit empty categories.

                            Rewrite technical git commit messages into clear changelog bullet points.
                            Do not invent changes that are not supported by the commits.
                            Do not include commit SHAs.
                            Do not include an introduction or conclusion.
                            Return markdown only.`,
                                        },
                                        {
                                            role: "user",
                                            content: `Generate a changelog from these commits:

                            ${commitList}`,
                                        },
                                    ],
            });

    const content = response.choices[0]?.message?.content;

    if (!content) {
        throw new Error("OpenRouter returned no changelog.");
    }

    return content.trim();
}