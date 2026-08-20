from datetime import datetime, date
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func
from backend.models import Task, User, Comment

class TaskRepository:
    @staticmethod
    def get_all(
        db: Session,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        assignee: Optional[int] = None,
        search: Optional[str] = None,
        overdue: bool = False,
        sort_by: str = "updated_at",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[Task], int]:
        query = db.query(Task)

        if status:
            statuses = [s.strip() for s in status.split(",")]
            query = query.filter(Task.status.in_(statuses))

        if priority:
            priorities = [p.strip() for p in priority.split(",")]
            query = query.filter(Task.priority.in_(priorities))

        if assignee is not None:
            query = query.filter(Task.assigned_to == assignee)

        if search:
            query = query.filter(or_(
                Task.title.ilike(f"%{search}%"),
                Task.description.ilike(f"%{search}%")
            ))

        if overdue:
            today_str = date.today().isoformat()
            query = query.filter(Task.due_date.isnot(None), Task.due_date < today_str, Task.status != "Completed")

        total = query.count()

        sort_column = getattr(Task, sort_by, Task.updated_at)
        if sort_order.lower() == "asc":
            query = query.order_by(asc(sort_column))
        else:
            query = query.order_by(desc(sort_column))

        offset = (page - 1) * limit
        tasks = query.offset(offset).limit(limit).all()

        return tasks, total

    @staticmethod
    def get_by_id(db: Session, task_id: int) -> Optional[Task]:
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def create(db: Session, task_data: dict) -> Task:
        task = Task(**task_data)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def update(db: Session, task: Task, update_data: dict) -> Task:
        for key, value in update_data.items():
            if value is not None:
                setattr(task, key, value)
        task.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete(db: Session, task: Task) -> None:
        db.delete(task)
        db.commit()


class UserRepository:
    @staticmethod
    def get_all(db: Session) -> List[User]:
        return db.query(User).order_by(User.name.asc()).all()

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        return db.query(User).filter(func.lower(User.email) == func.lower(email)).first()

    @staticmethod
    def create(db: Session, user_data: dict) -> User:
        user = User(**user_data)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user


class CommentRepository:
    @staticmethod
    def get_by_task_id(db: Session, task_id: int) -> List[Comment]:
        return db.query(Comment).filter(Comment.task_id == task_id).order_by(Comment.created_at.asc()).all()

    @staticmethod
    def create(db: Session, comment_data: dict) -> Comment:
        comment = Comment(**comment_data)
        db.add(comment)
        db.commit()
        db.refresh(comment)
        return comment
