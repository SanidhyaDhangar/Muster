from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import Professor
from ..schemas import ProfessorCreate, ProfessorOut, ProfessorUpdate

router = APIRouter(prefix="/api/professors", tags=["professors"])


@router.get("", response_model=list[ProfessorOut])
def list_professors(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Professor).order_by(Professor.name).all()


@router.get("/{prof_id}", response_model=ProfessorOut)
def get_professor(prof_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    professor = db.get(Professor, prof_id)
    if professor is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    return professor


@router.post("", response_model=ProfessorOut, status_code=201)
def create_professor(payload: ProfessorCreate, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    if db.get(Professor, payload.prof_id):
        raise HTTPException(status_code=409, detail="A professor with this ID already exists")
    professor = Professor(**payload.model_dump())
    db.add(professor)
    db.commit()
    db.refresh(professor)
    return professor


@router.put("/{prof_id}", response_model=ProfessorOut)
def update_professor(prof_id: str, payload: ProfessorUpdate, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    professor = db.get(Professor, prof_id)
    if professor is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(professor, field, value)
    db.commit()
    db.refresh(professor)
    return professor


@router.delete("/{prof_id}", status_code=204)
def delete_professor(prof_id: str, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    professor = db.get(Professor, prof_id)
    if professor is None:
        raise HTTPException(status_code=404, detail="Professor not found")
    db.delete(professor)
    db.commit()
