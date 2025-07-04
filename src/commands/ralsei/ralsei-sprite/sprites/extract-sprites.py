from PIL import Image
import os, math
import requests
from tqdm import tqdm


def is_bg(px, bg_colors, tol):
    return any(math.dist(px, bg) <= tol for bg in bg_colors)


def make_transparent(im, bg_colors, tol=30):
    im = im.convert("RGBA")
    data = list(im.getdata())
    new_data = []
    for r, g, b, a in data:
        if is_bg((r, g, b), bg_colors, tol):
            new_data.append((0, 0, 0, 0))
        else:
            new_data.append((r, g, b, a))
    im.putdata(new_data)
    return im


def extract(path, bg_colors, tol=30, outdir="individual_sprites"):
    # load & mask background
    sheet = make_transparent(Image.open(path), bg_colors, tol)
    w, h = sheet.size
    pixels = sheet.load()

    # visited map
    visited = [[False] * h for _ in range(w)]
    regions = []

    # flood‐fill each non‐transparent cluster
    for y in range(h):
        for x in range(w):
            if not visited[x][y] and pixels[x, y][3] != 0:
                minx = maxx = x
                miny = maxy = y
                queue = [(x, y)]
                visited[x][y] = True

                while queue:
                    cx, cy = queue.pop()
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h:
                            if not visited[nx][ny] and pixels[nx, ny][3] != 0:
                                visited[nx][ny] = True
                                queue.append((nx, ny))
                                minx = min(minx, nx)
                                maxx = max(maxx, nx)
                                miny = min(miny, ny)
                                maxy = max(maxy, ny)

                # store bounding box (right/bottom exclusive)
                regions.append((minx, miny, maxx + 1, maxy + 1))

    regions.sort(key=lambda r: (r[1], r[0]))

    os.makedirs(outdir, exist_ok=True)

    # crop & save each region
    for i, (x0, y0, x1, y1) in enumerate(regions):
        width = x1 - x0
        height = y1 - y0
        if width < 12 or height < 12:
            continue
        sprite = sheet.crop((x0, y0, x1, y1))
        sprite.save(f"{outdir}/ralsei_{i:03d}.png")

    print(f"Extracted {len(regions)} sprites to {outdir}/")


# download urls for chapter 1-4 Ralsei spritesheets
ch12DownloadUrl = "https://www.spriters-resource.com/download/110469/"
ch34DownloadUrl = "https://www.spriters-resource.com/download/274914/"

if __name__ == "__main__":
    BG = [(0x81, 0x58, 0x9C), (0xB9, 0x7F, 0xFE)]
    # check if ralsei_sprites.png exists, if not, download from spriters-resource
    # chapters 1-2
    if not os.path.exists("ralsei_sprites.png"):
        print("Downloading chapter 1/2 ralsei_sprites.png...")
        response = requests.get(ch12DownloadUrl, stream=True)
        with open("ralsei_sprites.png", "wb") as f:
            total_size = int(response.headers.get("content-length", 0))
            for data in tqdm(
                response.iter_content(chunk_size=1024),
                total=total_size,
                unit="B",
                unit_scale=True,
            ):
                f.write(data)
        print("Downloaded the chapter 1/2 Ralsei spritesheet.")
    # chapters 3-4
    if not os.path.exists("ralsei_sprites_ch34.png"):
        print("Downloading chapter 3/4 ralsei_sprites.png...")
        response = requests.get(ch34DownloadUrl, stream=True)
        with open("ralsei_sprites_ch34.png", "wb") as f:
            total_size = int(response.headers.get("content-length", 0))
            for data in tqdm(
                response.iter_content(chunk_size=1024),
                total=total_size,
                unit="B",
                unit_scale=True,
            ):
                f.write(data)
        print("Downloaded the chapter 3/4 Ralsei spritesheet.")
    extract("ralsei_sprites.png", BG, tol=20, outdir="individual_sprites/ch12")
    extract("ralsei_sprites_ch34.png", BG, tol=20, outdir="individual_sprites/ch34")
