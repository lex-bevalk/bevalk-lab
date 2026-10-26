import http.server, os, sys
ROOT=os.path.dirname(os.path.abspath(__file__))
PNG=bytes.fromhex('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(s,*a,**k): super().__init__(*a,directory=ROOT,**k)
    def log_message(s,*a): pass
    def do_GET(s):
        p=s.path.split('?')[0]
        if p.startswith('/_blob/'):
            f=os.path.join(ROOT,p.lstrip('/'))
            if os.path.exists(f):
                d=open(f,'rb').read(); ct='text/javascript' if d[:3]==b'/**' else 'image/png'
            else: d=PNG; ct='image/png'
            s.send_response(200); s.send_header('Content-Type',ct); s.send_header('Content-Length',str(len(d))); s.end_headers(); s.wfile.write(d); return
        return super().do_GET()
    def guess_type(s,p):
        if p.endswith('.dc.html') or p.endswith('.html'): return 'text/html'
        return super().guess_type(p)
http.server.ThreadingHTTPServer(('127.0.0.1',int(sys.argv[1]) if len(sys.argv)>1 else 8765),H).serve_forever()
