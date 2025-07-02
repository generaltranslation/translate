#!/usr/bin/env node

import * as core from '@actions/core';
import * as github from '@actions/github';
import { exec } from '@actions/exec';

export async function run(): Promise<void> {
  core.info('Locadex i18n action started');
  try {
    // Get inputs
    const apiKey = core.getInput('api_key', { required: true });
    const batchSize = core.getInput('batch_size');
    const maxConcurrent = core.getInput('max_concurrent');
    const verbose = core.getBooleanInput('verbose');
    const debug = core.getBooleanInput('debug');
    const matchFiles = core.getInput('match_files');
    const noTelemetry = core.getBooleanInput('no_telemetry');
    const noTranslate = core.getBooleanInput('no_translate');
    const githubToken = core.getInput('github_token');
    const appDirectory = core.getInput('app_directory');
    const version = core.getInput('version');
    const gtApiKey = core.getInput('gt_api_key');
    const gtProjectId = core.getInput('gt_project_id');
    const formatCmd = core.getInput('format_cmd');

    // PR inputs
    const prBranch = core.getInput('pr_branch');
    const prTitle = core.getInput('pr_title');
    const prBody = core.getInput('pr_body');

    // Set API key as environment variable
    core.exportVariable('ANTHROPIC_API_KEY', apiKey);

    if (gtApiKey) {
      core.exportVariable('GT_API_KEY', gtApiKey);
    }
    if (gtProjectId) {
      core.exportVariable('GT_PROJECT_ID', gtProjectId);
    }

    // Build command arguments
    const installArgs = ['npm', 'install', '-g', `locadex@${version}`];
    core.info(`Installing locadex@${version}...`);
    await exec(installArgs[0], installArgs.slice(1));

    // Then run the command without npx
    const args = ['locadex', 'i18n'];

    if (verbose) args.push('--verbose');
    if (debug) args.push('--debug');
    if (noTelemetry) {
      args.push('--no-telemetry');
    }
    if (noTranslate) {
      args.push('--no-translate');
    }
    if (formatCmd) {
      args.push('--format-cmd', formatCmd);
    }
    if (batchSize) {
      args.push('--batch-size', batchSize);
    }
    if (maxConcurrent) {
      args.push('--concurrency', maxConcurrent);
    }
    if (matchFiles) {
      args.push('--match-files', matchFiles);
    }
    if (appDirectory) {
      args.push('--app-dir', appDirectory);
    }

    core.info(`Running command: ${args.join(' ')}`);

    // Execute the command
    const code = await exec(args[0], args.slice(1));
    if (code !== 0) {
      throw new Error(`Locadex failed with code ${code}`);
    } else {
      core.info('Locadex i18n action completed successfully');
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
  // Check for changes using git status
  let hasChanges = false;
  try {
    await exec('git', ['diff', '--quiet']);
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
  await exec('git', ['commit', '-m', 'chore(locadex): update code']);
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
