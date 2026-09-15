import ast
import io
import json
from pathlib import Path
import sys
import tokenize

base = Path(__file__).resolve().parent
relative = 'tmp/pdfs/add_sample_agents.py'
original = (base / 'originals' / relative).read_bytes().decode('utf-8')
lines = original.splitlines(keepends=True)
offsets = [0]
for line in lines:
    offsets.append(offsets[-1] + len(line))
def offset(location):
    line, column = location
    return len(original[:offsets[line - 1] + column].encode('utf-16-le')) // 2
ranges = [[offset(token.start), offset(token.end)] for token in tokenize.generate_tokens(io.StringIO(original).readline) if token.type == tokenize.STRING]
for index, line in enumerate(lines):
    if line.rstrip('\r\n').endswith('\\'):
        ranges.append([offsets[index], offsets[index + 1] + 1])
(base / 'python-ranges.json').write_text(json.dumps(ranges), encoding='utf-8')
if '--verify' in sys.argv:
    current = (base.parents[1] / relative).read_text(encoding='utf-8')
    assert ast.dump(ast.parse(original), include_attributes=False) == ast.dump(ast.parse(current), include_attributes=False), 'Python AST changed'
    print('Python AST is identical before and after annotation.')
else:
    print(f'Protected {len(ranges)} Python string/continuation spans.')
