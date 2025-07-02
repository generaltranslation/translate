import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';
import { exec } from '@actions/exec';

vi.mock('@actions/core');
vi.mock('@actions/exec');

const mockCore = vi.mocked(core);
const mockExec = vi.mocked(exec);

describe('GitHub Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue('');
    mockCore.getBooleanInput.mockReturnValue(false);
  });

  it('should get GT API key input and set environment variables', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'gt_api_key') return 'test-gt-api-key';
      if (name === 'gt_project_id') return 'test-project-id';
      return '';
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockCore.getInput).toHaveBeenCalledWith('gt_api_key');
    expect(mockCore.getInput).toHaveBeenCalledWith('gt_project_id');
    expect(mockCore.exportVariable).toHaveBeenCalledWith(
      'GT_API_KEY',
      'test-gt-api-key'
    );
    expect(mockCore.exportVariable).toHaveBeenCalledWith(
      'GT_PROJECT_ID',
      'test-project-id'
    );
  });

  it('should build basic command with gtx-cli translate', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'gt_api_key') return 'test-gt-api-key';
      return '';
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('npm', [
      'install',
      '-g',
      'gtx-cli@latest',
    ]);
    expect(mockExec).toHaveBeenCalledWith('gtx-cli', [
      'translate',
      '--api-key',
      'test-gt-api-key',
    ]);
  });

  it('should add config flag when config is provided', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'gt_api_key') return 'test-gt-api-key';
      if (name === 'config') return 'custom.config.json';
      return '';
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('gtx-cli', [
      'translate',
      '--config',
      'custom.config.json',
      '--api-key',
      'test-gt-api-key',
    ]);
  });

  it('should add inline flag when inline is true', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'gt_api_key') return 'test-gt-api-key';
      return '';
    });
    mockCore.getBooleanInput.mockImplementation((name) => {
      if (name === 'inline') return true;
      return false;
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('gtx-cli', [
      'translate',
      '--api-key',
      'test-gt-api-key',
      '--inline',
    ]);
  });

  it('should add locales when provided', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'gt_api_key') return 'test-gt-api-key';
      if (name === 'locales') return 'en fr es';
      return '';
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('gtx-cli', [
      'translate',
      '--api-key',
      'test-gt-api-key',
      '--locales',
      'en fr es',
    ]);
  });

  it('should handle errors and set failed status', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'gt_api_key') return 'test-gt-api-key';
      return '';
    });
    mockExec.mockRejectedValue(new Error('Command failed'));

    const { run } = await import('../src/action');
    await run();

    expect(mockCore.setFailed).toHaveBeenCalledWith(
      'Action failed with error: Error: Command failed'
    );
  });
});
