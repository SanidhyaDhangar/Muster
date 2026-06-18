from datetime import datetime

import numpy as np
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import face
from ..database import get_db
from ..deps import require_roles
from ..models import AttendanceLog, Student
from ..schemas import FaceResult, RecognizeRequest, RecognizeResponse
from ..services import active_period, already_logged, matches_session

router = APIRouter(prefix="/api/recognition", tags=["recognition"])


def load_known(db: Session) -> list[tuple[str, np.ndarray]]:
    students = db.query(Student).filter(Student.face_encoding.isnot(None)).all()
    return [(s.roll_no, np.frombuffer(s.face_encoding, np.float32)) for s in students]


def log_attendance(db: Session, student: Student, request: RecognizeRequest, period, now: datetime) -> str:
    if not request.branches and request.semester is None:
        return "session_not_configured"
    if not matches_session(student, request.branches, request.semester, request.subject):
        return "not_in_session"
    if period is None:
        return "no_active_period"

    day = now.strftime("%Y-%m-%d")
    if already_logged(db, student.roll_no, period.period_name, day):
        return "already_present"

    db.add(AttendanceLog(
        student_roll_no=student.roll_no,
        student_name=student.name,
        period_name=period.period_name,
        prof_name=period.prof_name,
        timestamp=now,
    ))
    db.commit()
    return "present"


@router.post("/recognize", response_model=RecognizeResponse)
def recognize(request: RecognizeRequest, db: Session = Depends(get_db), _=Depends(require_roles("admin", "professor"))):
    known = load_known(db)
    detections = face.analyze_frame(request.image, known)
    now = datetime.now()
    period = active_period(db, now)

    faces = []
    for item in detections:
        name = None
        status = "unknown"
        roll_no = item["roll_no"]
        if roll_no:
            student = db.get(Student, roll_no)
            if student:
                name = student.name
                status = log_attendance(db, student, request, period, now)
        faces.append(FaceResult(
            box=item["box"],
            name=name,
            roll_no=roll_no,
            age=item["age"],
            gender=item["gender"],
            status=status,
            score=item["score"],
        ))
    return RecognizeResponse(faces=faces)
