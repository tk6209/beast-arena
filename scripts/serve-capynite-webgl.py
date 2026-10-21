#!/usr/bin/env python3
"""Local-only smoke server for actual Unity WebGL output (never deploy)."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit, unquote

class UnityHandler(SimpleHTTPRequestHandler):
    def guess_type(self, path):
        p = path
        for ext in (".br", ".gz"):
            if p.endswith(ext):
                p = p[:-len(ext)]
                break
        if p.endswith(".wasm"):
            return "application/wasm"
        if p.endswith(".data"):
            return "application/octet-stream"
        if p.endswith(".js"):
            return "application/javascript"
        if p.endswith(".symbols.json"):
            return "application/json"
        return super().guess_type(p)

    def end_headers(self):
        pathname = unquote(urlsplit(self.path).path)
        if pathname.endswith(".br"):
            self.send_header("Content-Encoding", "br")
        elif pathname.endswith(".gz"):
            self.send_header("Content-Encoding", "gzip")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--directory", required=True)
    parser.add_argument("--port", type=int, default=8081)
    args = parser.parse_args()
    root = Path(args.directory).resolve()
    if not (root / "index.html").is_file():
        parser.error("Unity WebGL index.html missing; refusing to start")
    class DirectoryHandler(UnityHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=str(root), **kw)
    server = ThreadingHTTPServer(("127.0.0.1", args.port), DirectoryHandler)
    print(f"Serving Unity smoke bundle: {root} on http://127.0.0.1:{args.port}/", flush=True)
    server.serve_forever()

if __name__ == "__main__":
    main()
