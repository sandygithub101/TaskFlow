from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

# User Schemas
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    role: str = "Member"
    avatar: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Comment Schemas
class CommentBase(BaseModel):
    comment: str = Field(..., min_length=1)

class CommentCreate(CommentBase):
    user_id: int

class CommentResponse(CommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True

# Task Schemas
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    status: str = Field(default="Pending", pattern="^(Pending|In Progress|Completed|Blocked)$")
    priority: str = Field(default="Medium", pattern="^(Low|Medium|High|Urgent)$")
    assigned_to: Optional[int] = None
    due_date: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(Pending|In Progress|Completed|Blocked)$")
    priority: Optional[str] = Field(None, pattern="^(Low|Medium|High|Urgent)$")
    assigned_to: Optional[int] = None
    due_date: Optional[str] = None

class TaskResponse(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    assignee_name: Optional[str] = None
    assignee_email: Optional[str] = None
    assignee_avatar: Optional[str] = None
    assignee_role: Optional[str] = None
    comment_count: Optional[int] = 0

    class Config:
        from_attributes = True

class PaginatedTasksResponse(BaseModel):
    tasks: List[TaskResponse]
    total: int
    page: int
    limit: int
    totalPages: int

# Dashboard Schemas
class PriorityBreakdown(BaseModel):
    low: int
    medium: int
    high: int
    urgent: int

class DashboardMetricsResponse(BaseModel):
    totalTasks: int
    pendingTasks: int
    inProgressTasks: int
    completedTasks: int
    blockedTasks: int
    overdueTasks: int
    assignedToUserTasks: int
    currentUser: Optional[UserResponse] = None
    priorityDistribution: PriorityBreakdown
