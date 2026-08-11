# Mobarrez Code GitHub Action

A GitHub Action that integrates [Mobarrez Code](https://github.com/anomalyco/opencode) directly into your GitHub workflow.

Mention `/opencode` (or the configured trigger) in your comment, and the agent will execute tasks within your GitHub Actions runner.

> [!NOTE]
> Mobarrez Code is a fork of `sst/opencode`. The GitHub Action shipped here uses the upstream `anomalyco/opencode` GitHub App and workflow image; rebranding the action's public-facing name is on the roadmap. Until then, you can wire it to your own fork's image by replacing `uses: anomalyco/opencode/github@latest` with your own reference.

## Features

#### Explain an issue

Leave the following comment on a GitHub issue. The agent will read the entire thread, including all comments, and reply with a clear explanation.

```
/opencode explain this issue
```

#### Fix an issue

Leave the following comment on a GitHub issue. The agent will create a new branch, implement the changes, and open a PR with the changes.

```
/opencode fix this
```

#### Review PRs and make changes

Leave the following comment on a GitHub PR. The agent will implement the requested change and commit it to the same PR.

```
Delete the attachment from S3 when the note is removed /oc
```

#### Review specific code lines

Leave a comment directly on code lines in the PR's "Files" tab. The agent will automatically detect the file, line numbers, and diff context to provide precise responses.

```
[Comment on specific lines in Files tab]
/oc add error handling here
```

When commenting on specific lines, the agent receives:

- The exact file being reviewed
- The specific lines of code
- The surrounding diff context
- Line number information

This allows more targeted requests without needing to specify file paths or line numbers manually.

## Installation

Run the following command in the terminal from your GitHub repo:

```bash
opencode github install
```

This will walk you through installing the GitHub app, creating the workflow, and setting up secrets.

### Manual Setup

1. Install the GitHub app https://github.com/apps/opencode-agent. Make sure it is installed on the target repository.
2. Add the following workflow file to `.github/workflows/opencode.yml` in your repo. Set the appropriate `model` and required API keys in `env`.

   ```yml
   name: opencode

   on:
     issue_comment:
       types: [created]
     pull_request_review_comment:
       types: [created]

   jobs:
     opencode:
       if: |
         contains(github.event.comment.body, '/oc') ||
         contains(github.event.comment.body, '/opencode')
       runs-on: ubuntu-latest
       permissions:
         id-token: write
       steps:
          - name: Checkout repository
            uses: actions/checkout@v6
            with:
              fetch-depth: 1
              persist-credentials: false

          - name: Run opencode
           uses: anomalyco/opencode/github@latest
           env:
             ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
             GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
           with:
             model: anthropic/claude-sonnet-4-20250514
             use_github_token: true
   ```

3. Store the API keys in secrets. In your organization or project **settings**, expand **Secrets and variables** on the left and select **Actions**. Add the required API keys.

## Support

This is an early release for the Mobarrez Code fork. If you encounter issues or have feedback, please create an issue at https://github.com/anomalyco/opencode/issues (upstream) or contact a Mobarrez Code maintainer for fork-specific problems.

## Development

To test locally:

1. Navigate to a test repo (e.g. `hello-world`):

   ```bash
   cd hello-world
   ```

2. Run:

   ```bash
   MODEL=anthropic/claude-sonnet-4-20250514 \
     ANTHROPIC_API_KEY=sk-ant-api03-1234567890 \
     GITHUB_RUN_ID=dummy \
     MOCK_TOKEN=github_pat_1234567890 \
     MOCK_EVENT='{"eventName":"issue_comment",...}' \
     bun /path/to/mobarrez-code/github/index.ts
   ```

   - `MODEL`: The model used by the agent. Same as the `MODEL` defined in the GitHub workflow.
   - `ANTHROPIC_API_KEY`: Your model provider API key. Same as the keys defined in the GitHub workflow.
   - `GITHUB_RUN_ID`: Dummy value to emulate GitHub action environment.
   - `MOCK_TOKEN`: A GitHub personal access token. This token is used to verify you have `admin` or `write` access to the test repo. Generate a token [here](https://github.com/settings/personal-access-tokens).
   - `MOCK_EVENT`: Mock GitHub event payload (see templates below).
   - `/path/to/mobarrez-code`: Path to your cloned Mobarrez Code repo. `bun /path/to/mobarrez-code/github/index.ts` runs your local version.

### Issue comment event

```
MOCK_EVENT='{"eventName":"issue_comment","repo":{"owner":"sst","repo":"hello-world"},"actor":"fwang","payload":{"issue":{"number":4},"comment":{"id":1,"body":"hey opencode, summarize thread"}}}'
```

Replace:

- `"owner":"sst"` with repo owner
- `"repo":"hello-world"` with repo name
- `"actor":"fwang"` with the GitHub username of commenter
- `"number":4` with the GitHub issue id
- `"body":"hey opencode, summarize thread"` with comment body

### Issue comment with image attachment.

```
MOCK_EVENT='{"eventName":"issue_comment","repo":{"owner":"sst","repo":"hello-world"},"actor":"fwang","payload":{"issue":{"number":4},"comment":{"id":1,"body":"hey opencode, what is in my image ![Image](https://github.com/user-attachments/assets/xxxxxxxx)"}}}'
```

Replace the image URL `https://github.com/user-attachments/assets/xxxxxxxx` with a valid GitHub attachment (you can generate one by commenting with an image in any issue).

### PR comment event

```
MOCK_EVENT='{"eventName":"issue_comment","repo":{"owner":"sst","repo":"hello-world"},"actor":"fwang","payload":{"issue":{"number":4,"pull_request":{}},"comment":{"id":1,"body":"hey opencode, summarize thread"}}}'
```

### PR review comment event

```
MOCK_EVENT='{"eventName":"pull_request_review_comment","repo":{"owner":"sst","repo":"hello-world"},"actor":"fwang","payload":{"pull_request":{"number":7},"comment":{"id":1,"body":"hey opencode, add error handling","path":"src/components/Button.tsx","diff_hunk":"@@ -45,8 +45,11 @@\n- const handleClick = () => {\n-   console.log('clicked')\n+ const handleClick = useCallback(() => {\n+   console.log('clicked')\n+   doSomething()\n+ }, [doSomething])","line":47,"original_line":45,"position":10,"commit_id":"abc123","original_commit_id":"def456"}}}'
```