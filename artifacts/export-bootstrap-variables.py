"""Inventory every custom-property declaration in the installed Bootstrap CSS."""
import re, json, hashlib
from pathlib import Path
from collections import Counter

root = Path(__file__).resolve().parents[1]
css = (root / 'node_modules/bootstrap/dist/css/bootstrap.css').read_text(encoding='utf-8')
css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
rows = []
stack = []
start = 0
quote = None
depth = 0
escaped = False
for i, char in enumerate(css):
    if escaped:
        escaped = False
        continue
    if char == '\\':
        escaped = True
        continue
    if quote:
        if char == quote: quote = None
        continue
    if char in "\"'":
        quote = char
        continue
    if char == '(':
        depth += 1
    elif char == ')':
        depth -= 1
    elif depth == 0 and char == '{':
        stack.append(css[start:i].strip())
        start = i + 1
    elif depth == 0 and char == ';':
        declaration = css[start:i].strip()
        if declaration.startswith('--') and stack:
            name, value = declaration.split(':', 1)
            rows.append(dict(css=name.strip(), raw=value.strip(), selector=stack[-1], context=stack[:-1]))
        start = i + 1
    elif depth == 0 and char == '}':
        stack.pop()
        start = i + 1

globals_light = {r['css']:r['raw'] for r in rows if ':root' in r['selector']}
globals_dark = dict(globals_light)
globals_dark.update({r['css']:r['raw'] for r in rows if re.fullmatch(r'\[data-bs-theme=dark\]',r['selector'])})

def slug(s):
    return re.sub(r'[^a-zA-Z0-9_-]+','-',s).strip('-') or 'default'

def resolve(value, mode, seen=()):
    refs = globals_dark if mode == 'Dark' else globals_light
    def sub(m):
        name = m[1]
        return resolve(refs[name],mode,(*seen,name)) if name in refs and name not in seen else m[0]
    return re.sub(r'var\((--[\w-]+)\)',sub,value)

def typed(raw,mode):
    v = resolve(raw,mode)
    if re.fullmatch(r'#[0-9a-fA-F]{3,8}',v):
        h=v[1:]
        if len(h) in (3,4): h=''.join(c*2 for c in h)
        if len(h) in (6,8):
            return 'COLOR',dict(r=int(h[:2],16)/255,g=int(h[2:4],16)/255,b=int(h[4:6],16)/255,a=int(h[6:8],16)/255 if len(h)==8 else 1)
    if v in ('transparent','black','white'):
        return 'COLOR',dict(r=1 if v=='white' else 0,g=1 if v=='white' else 0,b=1 if v=='white' else 0,a=0 if v=='transparent' else 1)
    m=re.fullmatch(r'rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)',v)
    if m: return 'COLOR',dict(r=float(m[1])/255,g=float(m[2])/255,b=float(m[3])/255,a=float(m[4]) if m[4] else 1)
    m=re.fullmatch(r'(-?(?:\d*\.)?\d+)(px|rem)?',v)
    if m: return 'FLOAT',float(m[1])*(16 if m[2]=='rem' else 1)
    return 'STRING',raw

groups={}
for row in rows:
    mode='Dark' if '[data-bs-theme=dark]' in row['selector'] else 'Light'
    selector=re.sub(r'\[data-bs-theme=(light|dark)\]','',row['selector']).strip()
    global_scope=':root' in selector or not selector
    name=row['css'].removeprefix('--bs-')
    if global_scope:
        primitive=bool(re.match(r'^(blue|indigo|purple|pink|red|orange|yellow|green|teal|cyan|black|white|gray)(-|$)',name))
        collection='01 Primitives' if primitive else '02 Semantic'
        category='color' if typed(row['raw'],mode)[0]=='COLOR' or name.endswith('-rgb') else 'typography' if re.search(r'font|line-height',name) else 'radius' if 'radius' in name else 'effect' if 'shadow' in name else 'layout'
        path=category+'/'+name.replace('-','/')
    else:
        collection='03 Components'
        path=name.split('-')[0]+'/'+slug(selector)+'/'+name.replace('-','/')
    if row['context']:
        path+='/'+'/'.join(slug(c) for c in row['context'])
    key=(collection,path)
    item=groups.setdefault(key,dict(collection=collection,name=path,css=row['css'],values={},records=[]))
    item['values'][mode]=dict(raw=row['raw'],type=typed(row['raw'],mode)[0],value=typed(row['raw'],mode)[1])
    item['records'].append(row)

items=[]
for item in groups.values():
    vals=item['values']
    if 'Light' not in vals:
        # A dark-only override is explicitly kept in its own scope, not fabricated as light.
        item['name']='dark-only/'+item['name']
        vals['Light']=dict(type='STRING',value='Not declared in light theme',raw='Not declared in light theme')
    if 'Dark' not in vals:
        dark_type,dark_value=typed(vals['Light']['raw'],'Dark')
        vals['Dark']=dict(raw=vals['Light']['raw'],type=dark_type,value=dark_value)
    types={v['type'] for v in vals.values()}
    item['type']=next(iter(types)) if len(types)==1 else 'STRING'
    if item['type']=='STRING':
        for v in vals.values():v['value']=v['raw']
    item['description']='Bootstrap 5.3.8 | '+item['css']+'\n'+'\n'.join((' / '.join(r['context'])+' | '+r['selector']+' = '+r['raw']).strip() for r in item['records'])+'\nNumeric rem values use 1rem = 16px; em, %, calc(), shadows, images and other composites remain CSS strings.'
    del item['records']
    items.append(item)

out=dict(version='5.3.8',fileKey='Nyqxb2hxzPSvd5dGNjAvnE',source='node_modules/bootstrap/dist/css/bootstrap.css',sha256=hashlib.sha256(css.encode()).hexdigest(),declarations=len(rows),uniqueCssNames=len({r['css'] for r in rows}),items=items)
(root/'artifacts/bootstrap-variables.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(dict(declarations=out['declarations'],uniqueCssNames=out['uniqueCssNames'],variables=len(items),types=dict(Counter(i['type'] for i in items)),collections=dict(Counter(i['collection'] for i in items))),ensure_ascii=False))
