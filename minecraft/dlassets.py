import json
import urllib.request
import os

asset_index = open("minecraft/piston-meta.mirror/19.json")
json_index = json.load(asset_index)

update = input("update/new(default) ")

for x in json_index["objects"]:
    file = json_index["objects"][x]["hash"]
    print(file)
    file0 = file[0]
    print(file0)
    file1 = file[1]
    print(file1)
    if not(os.path.isdir(f"minecraft/assets.mirror/{file0}{file1}")):
        os.mkdir(f"minecraft/assets.mirror/{file0}{file1}")
    if not(os.path.exists(f"minecraft/assets.mirror/{file0}{file1}/{file}")) or update == "update":
        urllib.request.urlretrieve(f"https://resources.download.minecraft.net/{file0}{file1}/{file}", f"minecraft/assets.mirror/{file0}{file1}/{file}")
