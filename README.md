# Locadex Action

GitHub Action for running Locadex i18n automation on your project.

## Usage

```yaml
name: Locadex i18n
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  i18n:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: generaltranslation/locadex-action@v1
        with:
          api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          gt_api_key: ${{ secrets.GT_API_KEY }}
          gt_project_id: ${{ secrets.GT_PROJECT_ID }}
          pr_branch: 'locadex/${{ github.ref_name }}'
          pr_title: 'Locadex: Continuous i18n for ${{ github.ref_name }}'
```

## Inputs

| Input            | Description                                                 | Required | Default                                               |
| ---------------- | ----------------------------------------------------------- | -------- | ----------------------------------------------------- |
| `api_key`        | Locadex API key                                             | ✅       | -                                                     |
| `gt_api_key`     | General Translation API key                                 | ❌       | -                                                     |
| `gt_project_id`  | General Translation project ID                              | ❌       | -                                                     |
| `batch_size`     | File batch size                                             | ❌       | -                                                     |
| `max_concurrent` | Max number of concurrent agents                             | ❌       | -                                                     |
| `no_telemetry`   | Disable telemetry                                           | ❌       | `false`                                               |
| `verbose`        | Enable verbose output                                       | ❌       | `false`                                               |
| `debug`          | Enable debug output                                         | ❌       | `false`                                               |
| `match_files`    | Comma-separated list of glob patterns to match source files | ❌       | -                                                     |
| `extensions`     | Comma-separated list of file extensions to match            | ❌       | -                                                     |
| `github_token`   | GitHub token for creating pull requests                     | ❌       | `${{ github.token }}`                                 |
| `app_directory`  | Relative path to the app (Next.js, React, etc.)             | ❌       | -                                                     |
| `version`        | Locadex version to use                                      | ❌       | `latest`                                              |
| `pr_branch`      | Branch name for pull requests                               | ❌       | `locadex/${{ github.ref_name }}`                      |
| `pr_title`       | Title for pull requests                                     | ❌       | `Locadex: Continuous i18n for ${{ github.ref_name }}` |
| `pr_body`        | Body for pull requests                                      | ❌       | (see action.yml)                                      |

## Development

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Package for distribution
npm run package
```

## License

FSL-1.1-ALv2
