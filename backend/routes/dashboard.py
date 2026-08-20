from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models import Task, User
from backend.schemas import DashboardMetricsResponse, PriorityBreakdown, UserResponse

router = APIRouter()

@router.get("", response_model=DashboardMetricsResponse)
def get_dashboard_metrics(user_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    today_str = date.today().isoformat()

    # Status counts
    status_counts = {"Pending": 0, "In Progress": 0, "Completed": 0, "Blocked": 0}
    status_query = db.query(Task.status, func.count(Task.id)).group_by(Task.status).all()
    total_tasks = 0
    for status_name, count in status_query:
        if status_name in status_counts:
            status_counts[status_name] = count
        total_tasks += count

    # Overdue tasks
    overdue_count = db.query(Task).filter(
        Task.due_date.isnot(None),
        Task.due_date < today_str,
        Task.status != "Completed"
    ).count()

    # Current user tasks
    current_user_obj = None
    assigned_count = 0
    if user_id:
        current_user_obj = db.query(User).filter(User.id == user_id).first()
    if not current_user_obj:
        current_user_obj = db.query(User).first()

    if current_user_obj:
        assigned_count = db.query(Task).filter(
            Task.assigned_to == current_user_obj.id,
            Task.status != "Completed"
        ).count()

    # Priority counts
    priority_counts = {"low": 0, "medium": 0, "high": 0, "urgent": 0}
    priority_query = db.query(Task.priority, func.count(Task.id)).group_by(Task.priority).all()
    for priority_name, count in priority_query:
        p_key = priority_name.lower()
        if p_key in priority_counts:
            priority_counts[p_key] = count

    return {
        "totalTasks": total_tasks,
        "pendingTasks": status_counts["Pending"],
        "inProgressTasks": status_counts["In Progress"],
        "completedTasks": status_counts["Completed"],
        "blockedTasks": status_counts["Blocked"],
        "overdueTasks": overdue_count,
        "assignedToUserTasks": assigned_count,
        "currentUser": current_user_obj,
        "priorityDistribution": PriorityBreakdown(**priority_counts)
    }
