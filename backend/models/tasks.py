from datetime import datetime, timezone
from uuid import uuid4

from pydantic import BaseModel, Field


class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str
    completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    completed: bool | None = None


class TaskDeleteResponse(BaseModel):
    id: str
    deleted: bool
