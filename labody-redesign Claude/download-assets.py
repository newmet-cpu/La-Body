#!/usr/bin/env python3
"""
Скачивает фото и шрифты в папку сайта, чтобы он открывался БЕЗ VPN.
Запустите один раз (с включённым VPN), потом выкладывайте папку целиком на хостинг.
Нужен только Python 3, дополнительные пакеты не требуются.
"""
import json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read()

def images():
    manifest = json.load(open(os.path.join(ROOT, "assets/img/manifest.json"), encoding="utf8"))
    ok = fail = 0
    for rel, url in manifest.items():
        path = os.path.join(ROOT, rel)
        if os.path.exists(path) and os.path.getsize(path) > 5000:
            ok += 1; continue
        try:
            open(path, "wb").write(get(url)); ok += 1
            print("  фото:", rel)
        except Exception as e:
            fail += 1; print("  НЕ СКАЧАЛОСЬ:", rel, "-", e)
    return ok, fail

def fonts():
    api = ("https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500"
           "&family=Manrope:wght@300;400;500;600;700&display=swap")
    css = get(api).decode("utf8")
    out, n = [], 0
    for m in re.finditer(r"/\*\s*([\w-]+)\s*\*/\s*(@font-face\s*\{.*?\})", css, re.S):
        subset, block = m.group(1), m.group(2)
        if subset not in ("cyrillic", "latin"):
            continue
        url = re.search(r"url\((https://[^)]+\.woff2)\)", block).group(1)
        fam = re.search(r"font-family:\s*'([^']+)'", block).group(1).replace(" ", "-").lower()
        style = re.search(r"font-style:\s*(\w+)", block).group(1)
        weight = re.search(r"font-weight:\s*(\d+)", block).group(1)
        name = f"{fam}-{style}-{weight}-{subset}.woff2"
        open(os.path.join(ROOT, "assets/fonts", name), "wb").write(get(url)); n += 1
        out.append(block.replace(url, name))
    open(os.path.join(ROOT, "assets/fonts/fonts.css"), "w", encoding="utf8").write(":root{--fonts-local:1}\n" + "\n".join(out))
    return n

if __name__ == "__main__":
    print("Скачиваю фото…"); ok, fail = images()
    print("Скачиваю шрифты…")
    try: n = fonts()
    except Exception as e: n = 0; print("  ШРИФТЫ НЕ СКАЧАЛИСЬ:", e)
    print(f"\nГотово: фото {ok}, ошибок {fail}, файлов шрифтов {n}.")
    if fail or not n: print("Что-то не скачалось — включите VPN и запустите ещё раз.")
    else: print("Теперь сайт не зависит от внешних серверов и открывается без VPN.")
