from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.schemas import UserCreate, UserResponse
from backend.repositories import UserRepository

router = APIRouter()

@router.get("", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return UserRepository.get_all(db)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = UserRepository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = UserRepository.get_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=409, detail=f"User with email '{payload.email}' already exists")
    
    avatar = payload.avatar or f"https://api.dicebear.com/7.x/avataaars/svg?seed={payload.name}"
    user_dict = payload.dict()
    user_dict["avatar"] = avatar

    return UserRepository.create(db, user_dict)
