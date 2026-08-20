import time
import httpx
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User
from backend.schemas import UserCreate, UserResponse
from backend.repositories import UserRepository

router = APIRouter()

EXTERNAL_URL = "https://jsonplaceholder.typicode.com/users"
CACHE = {"data": None, "timestamp": 0}

@router.get("/users")
async def get_external_users(refresh: bool = Query(False), db: Session = Depends(get_db)):
    start_time = time.time()
    now = time.time()

    if not refresh and CACHE["data"] and (now - CACHE["timestamp"] < 60):
        data = CACHE["data"]
        latency = 1
        source = "FastAPI In-Memory Cache"
    else:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(EXTERNAL_URL, headers={"Accept": "application/json"})
                if resp.status_code != 200:
                    raise HTTPException(status_code=502, detail="External API failed")
                raw_users = resp.json()
                latency = int((time.time() - start_time) * 1000)

                departments = ["Engineering", "Design", "Infrastructure", "Product", "Security", "Analytics"]
                roles = ["Product Manager", "Frontend Engineer", "Security Analyst", "Cloud Architect", "Data Scientist", "UX Researcher"]

                data = []
                for idx, u in enumerate(raw_users):
                    data.append({
                        "id": u["id"],
                        "name": u["name"],
                        "username": u["username"],
                        "email": u["email"].lower(),
                        "phone": u["phone"],
                        "website": u["website"],
                        "company": u["company"],
                        "address": u["address"],
                        "department": departments[idx % len(departments)],
                        "suggestedRole": roles[idx % len(roles)],
                        "avatar": f"https://images.unsplash.com/photo-{1534528741775 + idx * 1000}?w=150&auto=format&fit=crop&q=80"
                    })

                CACHE["data"] = data
                CACHE["timestamp"] = now
                source = "JSONPlaceholder Public REST API"
        except Exception as err:
            raise HTTPException(status_code=504, detail=f"External API connection failed: {str(err)}")

    # Check imported status
    existing_emails = {u.email.lower() for u in UserRepository.get_all(db)}
    enriched = [{**u, "isImported": u["email"].lower() in existing_emails} for u in data]

    return {
        "success": True,
        "data": enriched,
        "source": source,
        "latencyMs": latency,
        "rateLimit": {
            "limit": 100,
            "remaining": 95,
            "resetInSeconds": 60
        }
    }

@router.post("/import", response_model=UserResponse)
def import_external_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing = UserRepository.get_by_email(db, payload.email)
    if existing:
        raise HTTPException(status_code=409, detail=f"User {payload.email} already exists")
    
    return UserRepository.create(db, payload.dict())
