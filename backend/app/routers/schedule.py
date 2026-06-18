from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, require_roles
from ..models import Period, Professor
from ..schemas import PeriodCreate, PeriodOut, PeriodUpdate

router = APIRouter(prefix="/api/schedule", tags=["schedule"])


def _prof_name(db: Session, prof_id: str | None) -> str | None:
    if not prof_id:
        return None
    professor = db.get(Professor, prof_id)
    return professor.name if professor else None


@router.get("", response_model=list[PeriodOut])
def list_periods(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(Period).order_by(Period.start_time).all()


@router.post("", response_model=PeriodOut, status_code=201)
def create_period(payload: PeriodCreate, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    period = Period(**payload.model_dump(), prof_name=_prof_name(db, payload.prof_id))
    db.add(period)
    db.commit()
    db.refresh(period)
    return period


@router.put("/{period_id}", response_model=PeriodOut)
def update_period(period_id: int, payload: PeriodUpdate, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    period = db.get(Period, period_id)
    if period is None:
        raise HTTPException(status_code=404, detail="Period not found")
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(period, field, value)
    if "prof_id" in data:
        period.prof_name = _prof_name(db, period.prof_id)
    db.commit()
    db.refresh(period)
    return period


@router.delete("/{period_id}", status_code=204)
def delete_period(period_id: int, db: Session = Depends(get_db), _=Depends(require_roles("admin"))):
    period = db.get(Period, period_id)
    if period is None:
        raise HTTPException(status_code=404, detail="Period not found")
    db.delete(period)
    db.commit()
