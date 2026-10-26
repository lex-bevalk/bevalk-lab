"""Design rule: in a horizontal row with 2+ items, items are vertically centred on the tallest one.

Rewrites the template (not the logic script):
- flex rows (no flex-direction:column) with align-items:flex-start|baseline -> align-items:center
- their direct children (sc-for / sc-if are transparent) lose small top offsets
  (margin-top / padding-top <= 10px) that only existed to fake alignment.
- the User Story label/value grid (align-items:baseline) -> center.
"""
import re
from html.parser import HTMLParser

VOID = {'input', 'img', 'br', 'meta', 'link', 'hr', 'source', 'area', 'col', 'wbr', 'base', 'embed', 'param', 'track'}
TRANSPARENT = {'sc-for', 'sc-if'}
OFFSET = re.compile(r'(^|;)\s*(margin-top|padding-top)\s*:\s*(\d{1,2})px\s*(?=;|$)')


def _style(tag_text):
    m = re.search(r'\sstyle="([^"]*)"', tag_text)
    return m


class _P(HTMLParser):
    def __init__(self, src):
        super().__init__(convert_charrefs=False)
        self.src = src
        self.lines = [0]
        for i, ch in enumerate(src):
            if ch == '\n':
                self.lines.append(i + 1)
        self.stack = []   # (tag, node_id)
        self.nodes = []   # dict(start, text, tag, parent_row)

    def _off(self):
        ln, col = self.getpos()
        return self.lines[ln - 1] + col

    def _real_parent(self):
        for tag, nid in reversed(self.stack):
            if tag in TRANSPARENT:
                continue
            return nid
        return None

    def handle_starttag(self, tag, attrs):
        text = self.get_starttag_text()
        nid = len(self.nodes)
        self.nodes.append({'start': self._off(), 'text': text, 'tag': tag, 'parent': self._real_parent()})
        if tag not in VOID:
            self.stack.append((tag, nid))

    def handle_startendtag(self, tag, attrs):
        text = self.get_starttag_text()
        self.nodes.append({'start': self._off(), 'text': text, 'tag': tag, 'parent': self._real_parent()})

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                return


def is_row(style):
    s = style.replace(' ', '')
    if 'display:flex' not in s and 'display:inline-flex' not in s:
        return False
    if 'flex-direction:column' in s:
        return False
    return 'align-items:flex-start' in s or 'align-items:baseline' in s


def transform(template):
    p = _P(template)
    p.feed(template)
    rows = set()
    edits = {}
    for i, n in enumerate(p.nodes):
        m = _style(n['text'])
        if m and is_row(m.group(1)):
            rows.add(i)
    for i, n in enumerate(p.nodes):
        m = _style(n['text'])
        if not m:
            continue
        st = m.group(1)
        new = st
        if i in rows:
            new = re.sub(r'align-items:\s*(flex-start|baseline)', 'align-items:center', new)
        if n['parent'] in rows:
            new = OFFSET.sub(lambda mm: mm.group(1), new).lstrip(';')
        # User Story label/value grid
        if 'grid-template-columns:auto minmax(0, 1fr);column-gap:14px' in st:
            new = new.replace('align-items:baseline', 'align-items:center')
        if new != st:
            edits[i] = (m.start(1), m.end(1), new)
    out, last = [], 0
    for i in sorted(edits, key=lambda k: p.nodes[k]['start']):
        n = p.nodes[i]
        a, b, new = edits[i]
        abs_a, abs_b = n['start'] + a, n['start'] + b
        assert template[n['start']:n['start'] + len(n['text'])] == n['text'], 'offset drift'
        out.append(template[last:abs_a]); out.append(new); last = abs_b
    out.append(template[last:])
    return ''.join(out), len(rows), len(edits)
