from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import TaskCreate, TaskUpdate, TaskResponse, PaginatedTasksResponse, CommentCreate, CommentResponse
from backend.repositories import TaskRepository, CommentRepository, UserRepository

router = APIRouter()

@router.get("", response_model=PaginatedTasksResponse)
def list_tasks(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    assignee: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    overdue: Optional[bool] = Query(False),
    sort_by: str = Query("updated_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    tasks, total = TaskRepository.get_all(
        db=db,
        status=status,
        priority=priority,
        assignee=assignee,
        search=search,
        overdue=overdue,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

    enriched_tasks = []
    for t in tasks:
        task_dict = {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "status": t.status,
            "priority": t.priority,
            "assigned_to": t.assigned_to,
            "due_date": t.due_date,
            "created_at": t.created_at,
            "updated_at": t.updated_at,
            "assignee_name": t.assignee.name if t.assignee else None,
            "assignee_email": t.assignee.email if t.assignee else None,
            "assignee_avatar": t.assignee.avatar if t.assignee else None,
            "assignee_role": t.assignee.role if t.assignee else None,
            "comment_count": len(t.comments) if t.comments else 0
        }
        enriched_tasks.append(task_dict)

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "tasks": enriched_tasks,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages
    }

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = TaskRepository.get_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "priority": task.priority,
        "assigned_to": task.assigned_to,
        "due_date": task.due_date,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "assignee_name": task.assignee.name if task.assignee else None,
        "assignee_email": task.assignee.email if task.assignee else None,
        "assignee_avatar": task.assignee.avatar if task.assignee else None,
        "assignee_role": task.assignee.role if task.assignee else None,
        "comment_count": len(task.comments) if task.comments else 0
    }

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, db: Session = Depends(get_db)):
    task = TaskRepository.create(db, payload.dict())
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_db)):
    task = TaskRepository.get_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    updated_task = TaskRepository.update(db, task, payload.dict(exclude_unset=True))
    return updated_task

@router.delete("/{task_id}", status_code=status.HTTP_200_OK)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = TaskRepository.get_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    TaskRepository.delete(db, task)
    return {"success": True, "message": f"Task {task_id} deleted successfully"}

@router.post("/{task_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(task_id: int, payload: CommentCreate, db: Session = Depends(get_db)):
    task = TaskRepository.get_by_id(db, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    user = UserRepository.get_by_id(db, payload.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    comment_data = {
        "task_id": task_id,
        "user_id": payload.user_id,
        "comment": payload.comment
    }
    comment = CommentRepository.create(db, comment_data)
    
    return {
        "id": comment.id,
        "task_id": comment.task_id,
        "user_id": comment.user_id,
        "comment": comment.comment,
        "created_at": comment.created_at,
        "user_name": user.name,
        "user_avatar": user.avatar
    }
