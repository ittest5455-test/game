import http.server
import socketserver
import webbrowser
import os
import sys

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

PORT = 3000

class RetroHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

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
        print(f"[+] PENNUENG GAME LOCAL SERVER RUNNING!")
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
