import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { existsSync, unlinkSync } from 'node:fs';
import http from 'node:http';
import { runCli, startDevServer } from '../src/index.js';

describe('yumia CLI dev server and HTML format', () => {
  const samplePath = path.resolve(__dirname, '../../../examples/basic/presentation.yumia.md');
  const tempHtmlOut = path.resolve(__dirname, '../../../examples/basic/dist/test-deck.html');

  it('should compile presentation to standalone HTML deck', async () => {
    const buildRes = await runCli([
      'node',
      'yumia',
      'build',
      samplePath,
      '--format',
      'html',
      '--out',
      tempHtmlOut,
    ]);

    expect(buildRes.exitCode).toBe(0);
    expect(buildRes.output).toContain('interactive HTML slides');
    expect(existsSync(tempHtmlOut)).toBe(true);

    if (existsSync(tempHtmlOut)) {
      unlinkSync(tempHtmlOut);
    }
  });

  it('should compile presentation to vector PDF', async () => {
    const tempPdfOut = path.resolve(__dirname, '../../../examples/basic/dist/test-deck.pdf');
    const buildRes = await runCli([
      'node',
      'yumia',
      'build',
      samplePath,
      '--format',
      'pdf',
      '--out',
      tempPdfOut,
    ]);

    expect(buildRes.exitCode).toBe(0);
    expect(buildRes.output).toContain('vector PDF slides');
    expect(existsSync(tempPdfOut)).toBe(true);

    if (existsSync(tempPdfOut)) {
      unlinkSync(tempPdfOut);
    }
  });

  it('should start dev server, respond to HTTP GET and SSE live-reload', async () => {
    const testPort = 3891;
    const serverInstance = await startDevServer(samplePath, { port: testPort });

    expect(serverInstance.port).toBe(testPort);
    expect(serverInstance.url).toBe(`http://localhost:${testPort}`);

    // Test HTTP GET /
    const htmlResponse = await new Promise<string>((resolveReq, rejectReq) => {
      http
        .get(`http://localhost:${testPort}/`, (res) => {
          expect(res.statusCode).toBe(200);
          expect(res.headers['content-type']).toContain('text/html');
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => resolveReq(data));
        })
        .on('error', rejectReq);
    });

    expect(htmlResponse).toContain('<!DOCTYPE html>');
    expect(htmlResponse).toContain('id="yumia-deck"');
    expect(htmlResponse).toContain('/__yumia_live_reload');

    // Test SSE endpoint /__yumia_live_reload
    const sseResponse = await new Promise<string>((resolveReq, rejectReq) => {
      const req = http.get(`http://localhost:${testPort}/__yumia_live_reload`, (res) => {
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toContain('text/event-stream');
        res.on('data', (chunk) => {
          const str = chunk.toString();
          req.destroy();
          resolveReq(str);
        });
      });
      req.on('error', rejectReq);
    });

    expect(sseResponse).toContain('connected');

    await serverInstance.close();
  });

  it('should handle dev command via runCli', async () => {
    const testPort = 3892;
    const res = await runCli([
      'node',
      'yumia',
      'dev',
      samplePath,
      '--port',
      String(testPort),
      '--json',
    ]);

    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.output);
    expect(parsed.success).toBe(true);
    expect(parsed.port).toBe(testPort);
    expect(parsed.url).toBe(`http://localhost:${testPort}`);
  });

  it('should handle watch command via runCli', async () => {
    const res = await runCli(['node', 'yumia', 'watch', samplePath, '--json']);

    expect(res.exitCode).toBe(0);
    const parsed = JSON.parse(res.output);
    expect(parsed.success).toBe(true);
    expect(parsed.watching).toBe(true);
  });
});
