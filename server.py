import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 3000

class RetroHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and SharedArrayBuffer headers required for optimal WASM performance
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin-allow-popups")
        self.send_header("Cache-Control", "no-cache, must-revalidate")
        super().end_headers()

    def guess_type(self, path):
        # Ensure correct MIME types for WASM and ROM files
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
        print(f"🕹️  RETRO GAMES HUB SERVER RUNNING!")
        print(f"👉 Local URL : http://localhost:{PORT}")
        print(f"👉 On TV/Phone: Open your browser and go to http://<YOUR_IP>:{PORT}")
        print("=" * 60)
        print("Press Ctrl+C to stop the server.\n")
        
        try:
            # Auto open browser
            webbrowser.open(f"http://localhost:{PORT}")
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
            httpd.server_close()
            sys.exit(0)
