import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { readFileSync, watch, FSWatcher } from 'node:fs';
import { resolve } from 'node:path';
import { YumiaCompiler } from '@yumiamd/core';
import { HtmlRenderer } from '@yumiamd/renderer-html';

export interface DevServerOptions {
  port?: number;
  open?: boolean;
}

export interface DevServerInstance {
  server: Server;
  port: number;
  url: string;
  close: () => Promise<void>;
}

export function startDevServer(
  filePath: string,
  options: DevServerOptions = {}
): Promise<DevServerInstance> {
  return new Promise((resolvePromise, rejectPromise) => {
    const port = options.port || 3000;
    const resolvedPath = resolve(process.cwd(), filePath);
    const compiler = new YumiaCompiler();
    const renderer = new HtmlRenderer();

    const sseClients: Set<ServerResponse> = new Set();
    let watcher: FSWatcher | null = null;
    let debounceTimer: NodeJS.Timeout | null = null;

    async function getCompiledHtml(): Promise<string> {
      try {
        const source = readFileSync(resolvedPath, 'utf-8');
        const output = await compiler.compile(source, renderer, {
          renderContext: {
            options: {
              liveReload: true,
              liveReloadPort: port,
            },
          },
        });
        return output.html;
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        return `<!DOCTYPE html><html><head><title>YumiaMD Compile Error</title><style>body{background:#0b0b12;color:#ef4444;font-family:monospace;padding:40px;}</style></head><body><h1>Compile Error</h1><pre>${errMsg}</pre></body></html>`;
      }
    }

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
      const rawUrl = req.url || '/';
      let pathname = '/';
      try {
        const parsed = new URL(rawUrl, `http://localhost:${port}`);
        pathname = parsed.pathname;
      } catch {
        pathname = rawUrl.split('?')[0] || '/';
      }

      if (pathname === '/__yumia_live_reload') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });
        res.write('data: connected\n\n');

        sseClients.add(res);
        req.on('close', () => {
          sseClients.delete(res);
        });
        return;
      }

      if (pathname === '/' || pathname === '/index.html' || pathname.startsWith('/#')) {
        const html = await getCompiledHtml();
        res.writeHead(200, {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
        });
        res.end(html);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });

    server.on('error', (err) => {
      rejectPromise(err);
    });

    server.listen(port, () => {
      const url = `http://localhost:${port}`;

      if (options.open) {
        const startCmd =
          process.platform === 'win32'
            ? `start ${url}`
            : process.platform === 'darwin'
              ? `open ${url}`
              : `xdg-open ${url}`;
        import('node:child_process')
          .then(({ exec }) => {
            exec(startCmd, () => {});
          })
          .catch(() => {});
      }

      // Start file watcher
      try {
        watcher = watch(resolvedPath, () => {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            for (const client of sseClients) {
              try {
                client.write('data: reload\n\n');
              } catch {
                sseClients.delete(client);
              }
            }
          }, 40);
        });
      } catch (watchErr) {
        console.warn(`[Yumia Dev] Warning: could not watch file: ${watchErr}`);
      }

      resolvePromise({
        server,
        port,
        url,
        close: () =>
          new Promise<void>((resClose) => {
            if (watcher) watcher.close();
            for (const client of sseClients) {
              client.end();
            }
            sseClients.clear();
            server.close(() => resClose());
          }),
      });
    });
  });
}
