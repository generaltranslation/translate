# GT Translate Action

GitHub Action for running gtx-cli translate automation on your project.

## Usage

```yaml
name: GT Translate
on:
  push:
    branches: [main]

jobs:
  translate:
    runs-on: ubuntu-latest
    if: ${{ github.event.head_commit.author.name != 'github-actions[bot]' && !contains(github.event.head_commit.message, 'gt-translate/') }}
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4

      - uses: generaltranslation/translate@v0
        with:
          gt_api_key: ${{ secrets.GT_API_KEY }}
          gt_project_id: ${{ secrets.GT_PROJECT_ID }}
          config: 'gt.config.json'
          locales: 'en fr es de'
          default_language: 'en'
          inline: true
          pr_branch: 'gt-translate/${{ github.ref_name }}'
          pr_title: 'GT Translate: Translation updates for ${{ github.ref_name }} (${{ github.event.head_commit.message }})'
```

## Inputs

| Input                               | Description                                               | Required | Default                                                                                                  |
| ----------------------------------- | --------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `gt_api_key`                        | API key for General Translation cloud service             | ✅       | -                                                                                                        |
| `gt_project_id`                     | Project ID for the translation service                    | ✅       | -                                                                                                        |
| `config`                            | Filepath to config file, by default gt.config.json        | ❌       | -                                                                                                        |
| `version_id`                        | Version ID for the translation service                    | ❌       | -                                                                                                        |
| `tsconfig`                          | Path to jsconfig or tsconfig file                         | ❌       | -                                                                                                        |
| `dictionary`                        | Path to dictionary file                                   | ❌       | -                                                                                                        |
| `src`                               | Filepath to directory containing the app source code      | ❌       | -                                                                                                        |
| `default_language`                  | Default locale (e.g., en)                                 | ❌       | -                                                                                                        |
| `locales`                           | Space-separated list of locales (e.g., en fr es)          | ❌       | -                                                                                                        |
| `inline`                            | Include inline <T> tags in addition to dictionary file    | ❌       | `true`                                                                                                   |
| `ignore_errors`                     | Ignore errors encountered while scanning for <T> tags     | ❌       | `false`                                                                                                  |
| `dry_run`                           | Dry run, does not send updates to General Translation API | ❌       | `false`                                                                                                  |
| `timeout`                           | Timeout in seconds for waiting for updates to be deployed | ❌       | -                                                                                                        |
| `experimental_localize_static_urls` | Run script to localize all urls in content files          | ❌       | `false`                                                                                                  |
| `experimental_hide_default_locale`  | Hide the default locale from the path when localizing     | ❌       | `false`                                                                                                  |
| `experimental_flatten_json_files`   | Flatten json files into a single file                     | ❌       | `false`                                                                                                  |
| `github_token`                      | GitHub token for creating pull requests                   | ❌       | `${{ github.token }}`                                                                                    |
| `version`                           | gtx-cli version to use                                    | ❌       | `latest`                                                                                                 |
| `pr_branch`                         | Branch name for pull requests                             | ❌       | `gt-translate/${{ github.ref_name }}`                                                                    |
| `pr_title`                          | Title for pull requests                                   | ❌       | `GT Translate: Translation updates for ${{ github.ref_name }} (${{ github.event.head_commit.message }})` |
| `pr_body`                           | Body for pull requests                                    | ❌       | (see action.yml)                                                                                         |

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
