import os
import sys
import urllib.request
from PIL import Image
import io

images_to_process = [
    {
        "id": "soil_testing_analysis",
        "url": "https://i.pinimg.com/736x/fd/8d/3d/fd8d3df29ca1cd07f02139ffa02e9376.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/soil_testing_analysis.webp"
    },
    {
        "id": "soil_treatment",
        "url": "https://i.pinimg.com/736x/e7/cd/60/e7cd606bb5c7ef843ef1e429a7b63611.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/soil_treatment.webp"
    },
    {
        "id": "fertilizer_recommendation",
        "url": "https://i.pinimg.com/736x/13/a6/2f/13a62fcd6c265f1f66ca549208059075.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/fertilizer_recommendation.webp"
    },
    {
        "id": "crop_services_cat",
        "url": "https://i.pinimg.com/1200x/d2/1d/10/d21d108c56d6853d594be76053042e51.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/crop_services_cat.webp"
    },
    {
        "id": "rent_machinery",
        "url": "https://i.pinimg.com/736x/da/e0/0b/dae00b0412076dbec07742f467cdd758.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/rent_machinery.webp"
    },
    {
        "id": "warehousing_cold_storage",
        "url": "https://i.pinimg.com/736x/11/a2/69/11a269534c5ad4bf85153304cc6b1b2d.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/warehousing_cold_storage.webp"
    },
    {
        "id": "transportation",
        "url": "https://i.pinimg.com/1200x/d7/9e/ab/d79eab383df654feb5aedb0fe108d3e7.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/transportation.webp"
    },
    {
        "id": "greenhouse",
        "url": "https://i.pinimg.com/736x/2e/58/fd/2e58fd9f8d10adde1d6e5b71c8b4d2fa.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/greenhouse.webp"
    },
    {
        "id": "consult_agronomist",
        "url": "https://i.pinimg.com/1200x/c2/6e/b9/c26eb93240c9b928f6a6e9a8addd3cfd.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/consult_agronomist.webp"
    },
    {
        "id": "ai_breeding",
        "url": "https://i.pinimg.com/1200x/66/6b/d3/666bd3b5aa82404fd009c32f8ceed4ef.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/ai_breeding.webp"
    },
    {
        "id": "veterinary_diagnosis_treatment",
        "url": "https://i.pinimg.com/1200x/8a/a8/17/8aa8174542e4c4decea9b3c7700e74c8.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/veterinary_diagnosis_treatment.webp"
    },
    {
        "id": "borehole_sinking",
        "url": "https://i.pinimg.com/1200x/ea/07/a4/ea07a4f5b6758653e7196e1c8dd04b80.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/borehole_sinking.webp"
    },
    {
        "id": "irrigation_systems",
        "url": "https://i.pinimg.com/1200x/da/11/99/da119918e4767bf917dab778b022bea1.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/irrigation_systems.webp"
    },
    {
        "id": "water_engineering",
        "url": "https://i.pinimg.com/1200x/2f/7c/85/2f7c8568a1cd4de00b04b08b67165f7e.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/water_engineering.webp"
    },
    {
        "id": "consult_irrigation_expert",
        "url": "https://i.pinimg.com/736x/19/a3/f8/19a3f8bfb535a574b436609bea4ce9a9.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/consult_irrigation_expert.webp"
    },
    {
        "id": "get_coaching",
        "url": "https://i.pinimg.com/1200x/53/e0/b5/53e0b51b285454f6204a9070240ab8c6.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/get_coaching.webp"
    },
    {
        "id": "learn_value_addition",
        "url": "https://i.pinimg.com/736x/9c/58/9a/9c589a0df5766828c8bb04436f8936e9.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/learn_value_addition.webp"
    },
    {
        "id": "shed_construction",
        "url": "https://i.pinimg.com/1200x/f3/96/82/f39682ebc38e389dbdea45271bb49915.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/shed_construction.webp"
    },
    {
        "id": "buy_machinery",
        "url": "https://i.pinimg.com/1200x/c0/2b/61/c02b612b11d80aeba89878e580abc328.jpg",
        "output": "/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services/buy_machinery.webp"
    }
]

os.makedirs("/home/user/NYOTA-Clients/mkulima-hub-c7714688/public/images/services", exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

success = 0
failed = []

for item in images_to_process:
    img_id = item["id"]
    url = item["url"]
    out_path = item["output"]
    print(f"Downloading {img_id} from {url}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        
        img = Image.open(io.BytesIO(data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        img.save(out_path, "WEBP", quality=85)
        file_size = os.path.getsize(out_path)
        print(f"  -> Successfully converted and saved {out_path} ({img.size[0]}x{img.size[1]}, {file_size / 1024:.1f} KB)")
        success += 1
    except Exception as e:
        print(f"  -> ERROR downloading {img_id}: {e}")
        failed.append((img_id, str(e)))

print(f"\nFinished: {success}/{len(images_to_process)} succeeded.")
if failed:
    print(f"Failed: {failed}")
    sys.exit(1)
