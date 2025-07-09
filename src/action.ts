#!/usr/bin/env node

import * as core from '@actions/core';
import * as github from '@actions/github';
import { exec } from '@actions/exec';

export async function run(): Promise<void> {
  core.info('GT Translate action started');
  try {
    // Get inputs
    const gtApiKey = core.getInput('gt_api_key');
    const gtProjectId = core.getInput('gt_project_id');
    const config = core.getInput('config');
    const versionId = core.getInput('version_id');
    const tsconfig = core.getInput('tsconfig');
    const dictionary = core.getInput('dictionary');
    const src = core.getInput('src');
    const defaultLanguage = core.getInput('default_language');
    const locales = core.getInput('locales');
    const inline = core.getBooleanInput('inline');
    const ignoreErrors = core.getBooleanInput('ignore_errors');
    const dryRun = core.getBooleanInput('dry_run');
    const timeout = core.getInput('timeout');
    const experimentalLocalizeStaticUrls = core.getBooleanInput(
      'experimental_localize_static_urls'
    );
    const experimentalHideDefaultLocale = core.getBooleanInput(
      'experimental_hide_default_locale'
    );
    const experimentalFlattenJsonFiles = core.getBooleanInput(
      'experimental_flatten_json_files'
    );
    const githubToken = core.getInput('github_token');
    const version = core.getInput('version');

    // PR inputs
    const prBranch = core.getInput('pr_branch');
    const prTitle = core.getInput('pr_title');
    const prBody = core.getInput('pr_body');

    // Set GT environment variables
    if (gtApiKey) {
      core.exportVariable('GT_API_KEY', gtApiKey);
    }
    if (gtProjectId) {
      core.exportVariable('GT_PROJECT_ID', gtProjectId);
    }

    // Build command arguments
    const installArgs = [
      'npm',
      'install',
      '-g',
      `gtx-cli@${version || 'latest'}`,
    ];
    core.info(`Installing gtx-cli@${version || 'latest'}...`);
    await exec(installArgs[0], installArgs.slice(1));

    // Then run the gtx-cli translate command
    const args = ['gtx-cli', 'translate'];

    if (config) args.push('--config', config);
    if (gtApiKey) args.push('--api-key', gtApiKey);
    if (gtProjectId) args.push('--project-id', gtProjectId);
    if (versionId) args.push('--version-id', versionId);
    if (tsconfig) args.push('--tsconfig', tsconfig);
    if (dictionary) args.push('--dictionary', dictionary);
    if (src) args.push('--src', src);
    if (defaultLanguage) args.push('--default-language', defaultLanguage);
    if (locales) args.push('--locales', locales);
    if (inline) args.push('--inline');
    if (ignoreErrors) args.push('--ignore-errors');
    if (dryRun) args.push('--dry-run');
    if (timeout) args.push('--timeout', timeout);
    if (experimentalLocalizeStaticUrls)
      args.push('--experimental-localize-static-urls');
    if (experimentalHideDefaultLocale)
      args.push('--experimental-hide-default-locale');
    if (experimentalFlattenJsonFiles)
      args.push('--experimental-flatten-json-files');

    core.info(`Running command: ${args.join(' ')}`);

    // Execute the command
    const code = await exec(args[0], args.slice(1));
    if (code !== 0) {
      throw new Error(`GT Translate failed with code ${code}`);
    } else {
      core.info('GT Translate action completed successfully');
    }

    await createPR(githubToken, prBranch, prTitle, prBody);
  } catch (error) {
    core.setFailed(`Action failed with error: ${error}`);
  }
}

async function findAvailableBranchName(baseName: string): Promise<string> {
  let branchName = baseName;
  let counter = 1;

  while (true) {
    const branchExists = await checkBranchExists(branchName);
    if (!branchExists) {
      return branchName;
    }
    branchName = `${baseName}-${counter}`;
    counter++;
  }
}

async function checkBranchExists(branchName: string): Promise<boolean> {
  try {
    // Fetch remote refs to ensure we have up-to-date branch info
    await exec('git', ['fetch', 'origin', '--prune']);
  } catch {
    // If fetch fails, continue with local check only
  }

  try {
    // Check local branch
    await exec('git', [
      'show-ref',
      '--verify',
      '--quiet',
      `refs/heads/${branchName}`,
    ]);
    return true;
  } catch {
    try {
      // Check remote branch
      await exec('git', [
        'show-ref',
        '--verify',
        '--quiet',
        `refs/remotes/origin/${branchName}`,
      ]);
      return true;
    } catch {
      return false;
    }
  }
}

async function prExists(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  head: string
): Promise<boolean> {
  try {
    const { data: prs } = await octokit.rest.pulls.list({
      owner,
      repo,
      head: `${owner}:${head}`,
      state: 'open',
    });
    return prs.length > 0;
  } catch {
    return false;
  }
}

async function createPR(
  githubToken: string,
  prBranch: string,
  prTitle: string,
  prBody: string
): Promise<void> {
  // Check for changes using git status (both staged and unstaged)
  let hasChanges = false;
  try {
    // Check for unstaged changes
    await exec('git', ['diff', '--quiet']);
    // Check for untracked files
    await exec('git', [
      'ls-files',
      '--others',
      '--exclude-standard',
      '--error-unmatch',
      '.',
    ]);
  } catch {
    hasChanges = true;
  }

  if (!hasChanges) {
    core.info('No changes detected');
    return;
  }

  const context = github.context;
  const octokit = github.getOctokit(githubToken);

  await exec('git', ['config', 'user.name', 'github-actions[bot]']);
  await exec('git', [
    'config',
    'user.email',
    '41898282+github-actions[bot]@users.noreply.github.com',
  ]);

  const availableBranchName = await findAvailableBranchName(prBranch);

  await exec('git', ['checkout', '-b', availableBranchName]);
  await exec('git', ['add', '.']);
  await exec('git', [
    'commit',
    '-s',
    '-m',
    'chore(gt-translate): update translations',
  ]);
  await exec('git', ['push', 'origin', availableBranchName]);

  const prAlreadyExists = await prExists(
    octokit,
    context.repo.owner,
    context.repo.repo,
    availableBranchName
  );

  if (prAlreadyExists) {
    core.info(
      `PR already exists for branch ${availableBranchName}, skipping PR creation`
    );
    return;
  }

  // Create PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    title: prTitle,
    body: prBody,
    head: availableBranchName,
    base: context.ref,
  });

  core.info(`Created PR: ${pr.html_url}`);
}

run();
