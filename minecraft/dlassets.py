import json
import urllib.request

asset_index = open("minecraft/piston-meta.mirror/19.json")
json_index = json.load(asset_index)
for x in json_index["objects"]:
    file = json_index["objects"][x]["hash"]
    print(file)
    urllib.request.urlretrieve(f"https://resources.download.minecraft.net/{file}", f"minecraft/assets.mirror/{file}")
