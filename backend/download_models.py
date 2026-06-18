import shutil
import urllib.request
from pathlib import Path

MODELS_DIR = Path(__file__).resolve().parent / "models"

FILES = {
    "face_detection_yunet.onnx":
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx",
    "face_recognition_sface.onnx":
        "https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx",
    "age_net.caffemodel":
        "https://github.com/smahesh29/Gender-and-Age-Detection/raw/master/age_net.caffemodel",
    "age_deploy.prototxt":
        "https://github.com/smahesh29/Gender-and-Age-Detection/raw/master/age_deploy.prototxt",
    "gender_net.caffemodel":
        "https://github.com/smahesh29/Gender-and-Age-Detection/raw/master/gender_net.caffemodel",
    "gender_deploy.prototxt":
        "https://github.com/smahesh29/Gender-and-Age-Detection/raw/master/gender_deploy.prototxt",
}


def fetch(url: str, target: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "muster-setup"})
    with urllib.request.urlopen(request) as response, open(target, "wb") as output:
        shutil.copyfileobj(response, output)


def main() -> None:
    MODELS_DIR.mkdir(exist_ok=True)
    for name, url in FILES.items():
        target = MODELS_DIR / name
        if target.exists():
            print(f"skip  {name}")
            continue
        print(f"fetch {name}")
        fetch(url, target)
    print("Models ready.")


if __name__ == "__main__":
    main()
