from sqlalchemy import Column, DateTime, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.sql import func

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)


class Student(Base):
    __tablename__ = "students"

    roll_no = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    branch = Column(String)
    semester = Column(Integer)
    admission_year = Column(Integer)
    subject = Column(String)
    gender = Column(String)
    age = Column(Integer)
    face_encoding = Column(LargeBinary)

    @property
    def has_face(self) -> bool:
        return self.face_encoding is not None


class Professor(Base):
    __tablename__ = "professors"

    prof_id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    department = Column(String)
    email = Column(String)
    mobile = Column(String)
    qualification = Column(String)
    experience = Column(String)
    achievements = Column(Text)
    others = Column(Text)
    photo = Column(Text)


class Period(Base):
    __tablename__ = "schedule"

    period_id = Column(Integer, primary_key=True)
    period_name = Column(String, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    prof_id = Column(String, ForeignKey("professors.prof_id"))
    prof_name = Column(String)
    description = Column(Text)
    branch = Column(String)
    semester = Column(Integer)


class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    log_id = Column(Integer, primary_key=True)
    student_roll_no = Column(String, ForeignKey("students.roll_no"))
    student_name = Column(String)
    period_name = Column(String, nullable=False)
    prof_name = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
