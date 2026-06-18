import base64
import binascii
import io
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

try:
    from PIL import Image, ImageOps
    import pillow_heif

    pillow_heif.register_heif_opener()
    _PIL_AVAILABLE = True
except ImportError:  # pragma: no cover - optional dependency
    _PIL_AVAILABLE = False

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"

YUNET_PATH = MODELS_DIR / "face_detection_yunet.onnx"
SFACE_PATH = MODELS_DIR / "face_recognition_sface.onnx"
AGE_PROTO = MODELS_DIR / "age_deploy.prototxt"
AGE_MODEL = MODELS_DIR / "age_net.caffemodel"
GENDER_PROTO = MODELS_DIR / "gender_deploy.prototxt"
GENDER_MODEL = MODELS_DIR / "gender_net.caffemodel"

AGE_BUCKETS = ["0-2", "4-6", "8-12", "15-20", "25-32", "38-43", "48-53", "60+"]
GENDERS = ["Male", "Female"]
MODEL_MEAN = (78.4263377603, 87.7689143744, 114.895847746)
MATCH_THRESHOLD = 0.363
# YuNet's confidence drops on very large images, so a high-resolution phone
# photo can yield no detection at all. Cap the long side before detection.
DETECTION_MAX_SIDE = 1024

_detector = None
_recognizer = None
_age_net = None
_gender_net = None


def load_models() -> None:
    global _detector, _recognizer, _age_net, _gender_net
    missing = [path.name for path in (YUNET_PATH, SFACE_PATH) if not path.exists()]
    if missing:
        raise FileNotFoundError(
            f"Missing model files: {', '.join(missing)}. "
            "Run 'python download_models.py' from the backend directory first."
        )
    _detector = cv2.FaceDetectorYN.create(str(YUNET_PATH), "", (320, 320), score_threshold=0.8)
    _recognizer = cv2.FaceRecognizerSF.create(str(SFACE_PATH), "")
    if AGE_MODEL.exists() and AGE_PROTO.exists():
        _age_net = cv2.dnn.readNetFromCaffe(str(AGE_PROTO), str(AGE_MODEL))
    if GENDER_MODEL.exists() and GENDER_PROTO.exists():
        _gender_net = cv2.dnn.readNetFromCaffe(str(GENDER_PROTO), str(GENDER_MODEL))


def decode_base64_image(data: str):
    if "," in data:
        data = data.split(",", 1)[1]
    try:
        raw = base64.b64decode(data, validate=False)
    except (binascii.Error, ValueError):
        return None
    if not raw:
        return None

    array = np.frombuffer(raw, np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is not None:
        return image

    # OpenCV cannot decode some formats (e.g. HEIC/HEIF from phones, AVIF).
    # Fall back to Pillow, which supports a much wider range.
    if not _PIL_AVAILABLE:
        return None
    try:
        with Image.open(io.BytesIO(raw)) as pil_image:
            pil_image = ImageOps.exif_transpose(pil_image).convert("RGB")
            rgb = np.asarray(pil_image)
    except Exception:
        return None
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def detect_faces(image) -> list:
    height, width = image.shape[:2]
    scale = DETECTION_MAX_SIDE / max(height, width)
    if scale < 1.0:
        det_image = cv2.resize(
            image, (round(width * scale), round(height * scale)), interpolation=cv2.INTER_AREA
        )
    else:
        scale, det_image = 1.0, image

    det_height, det_width = det_image.shape[:2]
    _detector.setInputSize((det_width, det_height))
    _, faces = _detector.detect(det_image)
    if faces is None:
        return []
    if scale != 1.0:
        faces = faces.copy()
        # Columns 0-13 are bbox + landmark coordinates; 14 is the score.
        faces[:, :14] /= scale
    return list(faces)


def face_encoding(image, face) -> np.ndarray:
    aligned = _recognizer.alignCrop(image, face)
    feature = _recognizer.feature(aligned)
    return feature.flatten().astype(np.float32)


def encode_from_base64(data: str):
    image = decode_base64_image(data)
    if image is None:
        return None, "Could not read the image. Use a JPEG or PNG photo."
    faces = detect_faces(image)
    if not faces:
        return None, "No face detected in the photo."
    if len(faces) > 1:
        return None, "Multiple faces detected. Use a photo with a single face."
    return face_encoding(image, faces[0]), None


def match_encoding(feature: np.ndarray, known: list[tuple[str, np.ndarray]]):
    best_roll, best_score = None, 0.0
    for roll_no, candidate in known:
        denom = np.linalg.norm(feature) * np.linalg.norm(candidate)
        if denom == 0:
            continue
        score = float(np.dot(feature, candidate) / denom)
        if score > best_score:
            best_roll, best_score = roll_no, score
    if best_score >= MATCH_THRESHOLD:
        return best_roll, best_score
    return None, best_score


def predict_age_gender(image, face) -> tuple[Optional[str], Optional[str]]:
    x, y, w, h = (int(v) for v in face[:4])
    x, y = max(x, 0), max(y, 0)
    crop = image[y:y + h, x:x + w]
    if crop.size == 0:
        return None, None
    blob = cv2.dnn.blobFromImage(crop, 1.0, (227, 227), MODEL_MEAN, swapRB=False)
    age = gender = None
    if _gender_net is not None:
        _gender_net.setInput(blob)
        gender = GENDERS[int(_gender_net.forward()[0].argmax())]
    if _age_net is not None:
        _age_net.setInput(blob)
        age = AGE_BUCKETS[int(_age_net.forward()[0].argmax())]
    return age, gender


def analyze_frame(data: str, known: list[tuple[str, np.ndarray]]) -> list[dict]:
    image = decode_base64_image(data)
    if image is None:
        return []
    results = []
    for face in detect_faces(image):
        feature = face_encoding(image, face)
        roll_no, score = match_encoding(feature, known)
        age, gender = predict_age_gender(image, face)
        results.append({
            "box": [int(v) for v in face[:4]],
            "roll_no": roll_no,
            "score": round(score, 3),
            "age": age,
            "gender": gender,
        })
    return results
