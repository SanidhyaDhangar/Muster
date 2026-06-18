from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import face
from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import Student
from ..schemas import FilterOptions, StudentCreate, StudentOut, StudentUpdate

router = APIRouter(prefix="/api/students", tags=["students"])


@router.get("", response_model=list[StudentOut])
def list_students(
    branch: str | None = None,
    semester: int | None = None,
    subject: str | None = None,
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    query = db.query(Student)
    if branch:
        query = query.filter(Student.branch == branch)
    if semester is not None:
        query = query.filter(Student.semester == semester)
    if subject:
        query = query.filter(Student.subject == subject)
    return query.order_by(Student.roll_no).all()


@router.get("/filters", response_model=FilterOptions)
def filter_options(db: Session = Depends(get_db), _=Depends(get_current_user)):
    branches = [r[0] for r in db.query(Student.branch).distinct() if r[0]]
    semesters = sorted({r[0] for r in db.query(Student.semester).distinct() if r[0] is not None})
    subjects = [r[0] for r in db.query(Student.subject).distinct() if r[0]]
    return FilterOptions(branches=sorted(branches), semesters=semesters, subjects=sorted(subjects))


@router.get("/{roll_no}", response_model=StudentOut)
def get_student(roll_no: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    student = db.get(Student, roll_no)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.post("", response_model=StudentOut, status_code=201)
def create_student(payload: StudentCreate, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    if db.get(Student, payload.roll_no):
        raise HTTPException(status_code=409, detail="A student with this roll number already exists")

    encoding = None
    if payload.image:
        feature, error = face.encode_from_base64(payload.image)
        if error:
            raise HTTPException(status_code=400, detail=error)
        encoding = feature.tobytes()

    student = Student(
        roll_no=payload.roll_no,
        name=payload.name,
        branch=payload.branch,
        semester=payload.semester,
        admission_year=payload.admission_year,
        subject=payload.subject,
        gender=payload.gender,
        age=payload.age,
        face_encoding=encoding,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


@router.put("/{roll_no}", response_model=StudentOut)
def update_student(roll_no: str, payload: StudentUpdate, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    student = db.get(Student, roll_no)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")

    data = payload.model_dump(exclude_unset=True)
    image = data.pop("image", None)
    for field, value in data.items():
        setattr(student, field, value)

    if image:
        feature, error = face.encode_from_base64(image)
        if error:
            raise HTTPException(status_code=400, detail=error)
        student.face_encoding = feature.tobytes()

    db.commit()
    db.refresh(student)
    return student


@router.delete("/{roll_no}", status_code=204)
def delete_student(roll_no: str, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    student = db.get(Student, roll_no)
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
