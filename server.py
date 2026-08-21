import http.server
import socketserver
import webbrowser
import os
import sys
import urllib.request
import urllib.parse

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PORT = 3000

class RetroHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def do_GET(self):
        # Built-in ROM Streaming CORS Proxy to fix "Failed to fetch"
        if self.path.startswith("/proxy?url="):
            target_url = urllib.parse.unquote(self.path[11:])
            try:
                req = urllib.request.Request(
                    target_url, 
                    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                )
                with urllib.request.urlopen(req, timeout=30) as response:
                    self.send_response(200)
                    self.send_header("Content-Type", response.headers.get("Content-Type", "application/octet-stream"))
                    self.send_header("Content-Length", response.headers.get("Content-Length", ""))
                    self.end_headers()
                    
                    # Stream chunks
                    while True:
                        chunk = response.read(64 * 1024)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                return
            except Exception as e:
                print(f"[!] Proxy streaming error for {target_url}: {e}")
                self.send_response(500)
                self.end_headers()
                self.wfile.write(b"Proxy Error")
                return

        return super().do_GET()

    def guess_type(self, path):
        if path.endswith(".wasm"):
            return "application/wasm"
        if path.endswith(".jsdos") or path.endswith(".zip"):
            return "application/zip"
        if path.endswith(".nes"):
            return "application/octet-stream"
        return super().guess_type(path)

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    Handler = RetroHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print(f"[+] PENNUENG GAME LOCAL SERVER RUNNING WITH CORS PROXY!")
        print(f"[+] Local URL : http://localhost:{PORT}")
        print("=" * 60)
        print("Press Ctrl+C to stop server.\n")
        
        try:
            webbrowser.open(f"http://localhost:{PORT}")
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
            sys.exit(0)
