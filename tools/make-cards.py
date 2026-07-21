#!/usr/bin/env python3
"""Generates one social card per page, from the page's own h1 and eyebrow.
Run after tools/build.js. Cards are named og-<slug>.png."""
import os, re, html
from PIL import Image, ImageDraw, ImageFont

INK=(20,16,15); IVORY=(244,237,226); BRASS=(212,163,67); FELT=(158,59,69); DIM=(167,154,140)
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def font(sz, bold=False, serif=True):
    fam='DejaVuSerif' if serif else 'DejaVuSans'
    for p in [f'/usr/share/fonts/truetype/dejavu/{fam}{"-Bold" if bold else ""}.ttf',
              f'/usr/share/fonts/truetype/dejavu/DejaVuSans{"-Bold" if bold else ""}.ttf']:
        try: return ImageFont.truetype(p, sz)
        except Exception: pass
    return ImageFont.load_default()

def wrap(d, text, f, maxw):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t=(cur+' '+w).strip()
        if d.textlength(t, font=f) <= maxw: cur=t
        else:
            if cur: lines.append(cur)
            cur=w
    if cur: lines.append(cur)
    return lines

def card(path, kicker, title, sub):
    W,H=1200,630
    img=Image.new('RGB',(W,H),INK); d=ImageDraw.Draw(img)
    d.text((70,78), kicker.upper()[:46], font=font(22,True,False), fill=BRASS)
    size = 66 if len(title) < 34 else (54 if len(title) < 54 else 44)
    f=font(size,True); y=130
    for line in wrap(d,title,f,W-140)[:3]:
        d.text((70,y), line, font=f, fill=IVORY); y+=size+14
    fs=font(24,False,False); y=max(y+16,352)
    for line in wrap(d,sub,fs,W-160)[:2]:
        d.text((70,y), line, font=fs, fill=DIM); y+=34
    top=460; bot=H-46; left=70; right=W-70
    d.rectangle([left,top-14,right,top-8], fill=FELT)
    d.rounded_rectangle([left,top,right,bot], radius=8, fill=IVORY)
    n=14; kw=(right-left)/n
    for i in range(1,n):
        x=left+kw*i; d.rectangle([x-2,top,x+2,bot], fill=INK)
    bh=int((bot-top)*0.6)
    for i in range(n):
        if i%7 in (0,1,3,4,5):
            x=left+kw*(i+1)
            d.rounded_rectangle([x-kw*0.28,top,x+kw*0.28,top+bh], radius=5,
                                fill=BRASS if i==11 else INK)
    d.text((W-70,H-34),'learnpianokeys.com', font=font(19,False,False), fill=DIM, anchor='rs')
    img.save(path, quality=92)

def txt(s):
    return html.unescape(re.sub(r'<[^>]+>','',s)).strip()

made=0
for f in sorted(os.listdir(ROOT)):
    if not f.endswith('.html'): continue
    slug=f[:-5]
    out=os.path.join(ROOT, f'og-{slug}.png')
    src=open(os.path.join(ROOT,f), encoding='utf-8').read()
    h1=re.search(r'<h1[^>]*>(.*?)</h1>', src, re.S)
    eb=re.search(r'<p class="eyebrow">(.*?)</p>', src, re.S)
    desc=re.search(r'<meta name="description" content="(.*?)">', src, re.S)
    title=txt(h1.group(1)) if h1 else slug.replace('-',' ').title()
    kicker=txt(eb.group(1)) if eb else 'Learn Piano Keys'
    sub=txt(desc.group(1)) if desc else ''
    card(out, kicker, title, sub)
    made+=1
print(f'{made} social cards generated')
