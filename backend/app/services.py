from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from .models import AttendanceLog, Period, Student
from .schemas import AttendanceRow


def active_period(db: Session, now: datetime) -> Period | None:
    current = now.strftime("%H:%M")
    for period in db.query(Period).all():
        if period.start_time <= current <= period.end_time:
            return period
    return None


def already_logged(db: Session, roll_no: str, period_name: str, day: str) -> bool:
    return db.query(AttendanceLog).filter(
        AttendanceLog.student_roll_no == roll_no,
        AttendanceLog.period_name == period_name,
        func.date(AttendanceLog.timestamp) == day,
    ).first() is not None


def matches_session(student: Student, branches: list[str], semester: int | None, subject: str | None) -> bool:
    if branches and student.branch not in branches:
        return False
    if semester is not None and student.semester != semester:
        return False
    if subject and student.subject != subject:
        return False
    return True


def students_query(db: Session, branch: str | None, semester: int | None):
    query = db.query(Student)
    if branch and branch != "all":
        query = query.filter(Student.branch == branch)
    if semester not in (None, "", "all"):
        query = query.filter(Student.semester == int(semester))
    return query.order_by(Student.roll_no)


def build_attendance_rows(db, branch, semester, period_id, date, status) -> list[AttendanceRow]:
    rows: list[AttendanceRow] = []

    if period_id and date:
        period = db.get(Period, int(period_id))
        if period is None:
            return rows
        logs = db.query(AttendanceLog).filter(
            AttendanceLog.period_name == period.period_name,
            func.date(AttendanceLog.timestamp) == date,
        ).all()
        by_roll = {log.student_roll_no: log for log in logs}
        for student in students_query(db, branch, semester).all():
            log = by_roll.get(student.roll_no)
            rows.append(AttendanceRow(
                student_roll_no=student.roll_no,
                student_name=student.name,
                branch=student.branch,
                semester=student.semester,
                period_name=period.period_name,
                prof_name=period.prof_name,
                status="Present" if log else "Absent",
                timestamp=log.timestamp.strftime("%Y-%m-%d %H:%M:%S") if log else None,
            ))
    else:
        query = db.query(AttendanceLog)
        if date:
            query = query.filter(func.date(AttendanceLog.timestamp) == date)
        if period_id:
            period = db.get(Period, int(period_id))
            if period:
                query = query.filter(AttendanceLog.period_name == period.period_name)
        students = {s.roll_no: s for s in db.query(Student).all()}
        for log in query.order_by(AttendanceLog.timestamp.desc()).all():
            student = students.get(log.student_roll_no)
            if branch and branch != "all" and (student is None or student.branch != branch):
                continue
            if semester not in (None, "", "all") and (student is None or student.semester != int(semester)):
                continue
            rows.append(AttendanceRow(
                student_roll_no=log.student_roll_no,
                student_name=log.student_name,
                branch=student.branch if student else None,
                semester=student.semester if student else None,
                period_name=log.period_name,
                prof_name=log.prof_name,
                status="Present",
                timestamp=log.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            ))

    if status and status.lower() != "all":
        rows = [row for row in rows if row.status.lower() == status.lower()]
    return rows
