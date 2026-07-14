import { Octokit } from "@octokit/rest";

export type GitHubCommit = {
    sha: string;
    message: string;
    authorName: string | null;
    committedAt: string | null;
};

export async function getRepositoryCommits({
    accessToken,
    owner,
    repo,
}: {
    accessToken: string;
    owner: string;
    repo: string;
}): Promise<GitHubCommit[]> {
    const octokit = new Octokit({
        auth: accessToken,
    });

    const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 30,
    });

    return data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        authorName: commit.commit.author?.name ?? null,
        committedAt: commit.commit.author?.date ?? null,
    }));
}