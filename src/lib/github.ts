import { Octokit } from "@octokit/rest";

export type GitHubCommit = {
    sha: string;
    message: string;
    authorName: string | null;
    committedAt: string | null;
};

type GitHubRepository = {
    owner: string;
    name: string;
    fullName: string;
};

function createGitHubClient(accessToken: string) {
    return new Octokit({
        auth: accessToken,
    });
}

export async function getRepository({
    accessToken,
    owner,
    repo,
}: {
    accessToken: string;
    owner: string;
    repo: string;
}): Promise<GitHubRepository> {
    const octokit = createGitHubClient(accessToken);

    const { data } = await octokit.rest.repos.get({
        owner,
        repo,
    });

    return {
        owner: data.owner.login,
        name: data.name,
        fullName: data.full_name,
    };
}

export async function getRepositoryCommits({
    accessToken,
    owner,
    repo,
}: {
    accessToken: string;
    owner: string;
    repo: string;
}): Promise<GitHubCommit[]> {
    const octokit = createGitHubClient(accessToken);
    const { data } = await octokit.rest.repos.listCommits({
        owner,
        repo,
        per_page: 30
    });

    return data.map((commit) => ({
        sha: commit.sha,
        message: commit.commit.message,
        authorName: commit.commit.author?.name ?? null,
        committedAt: commit.commit.author?.date ?? null,
    }));
}