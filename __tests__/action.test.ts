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

  it('should get required API key input', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'api_key') return 'test-api-key';
      return '';
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockCore.getInput).toHaveBeenCalledWith('api_key', {
      required: true,
    });
    expect(mockCore.exportVariable).toHaveBeenCalledWith(
      'ANTHROPIC_API_KEY',
      'test-api-key'
    );
  });

  it('should build basic command with npx locadex i18n', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'api_key') return 'test-api-key';
      return '';
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('npx', ['locadex', 'i18n']);
  });

  it('should add verbose flag when verbose is true', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'api_key') return 'test-api-key';
      return '';
    });
    mockCore.getBooleanInput.mockImplementation((name) => {
      if (name === 'verbose') return true;
      return false;
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('npx', [
      'locadex',
      'i18n',
      '--verbose',
    ]);
  });

  it('should add debug flag when debug is true', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'api_key') return 'test-api-key';
      return '';
    });
    mockCore.getBooleanInput.mockImplementation((name) => {
      if (name === 'debug') return true;
      return false;
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('npx', [
      'locadex',
      'i18n',
      '--debug',
    ]);
  });

  it('should add batch size when provided', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'api_key') return 'test-api-key';
      if (name === 'batch_size') return '10';
      return '';
    });

    const { run } = await import('../src/action');
    await run();

    expect(mockExec).toHaveBeenCalledWith('npx', [
      'locadex',
      'i18n',
      '--batch-size',
      '10',
    ]);
  });

  it('should handle errors and set failed status', async () => {
    mockCore.getInput.mockImplementation((name) => {
      if (name === 'api_key') return 'test-api-key';
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
