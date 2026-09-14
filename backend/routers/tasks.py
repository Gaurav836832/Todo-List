from datetime import timezone

from fastapi import APIRouter, HTTPException

from lib.db import db
from models.tasks import Task, TaskCreate, TaskDeleteResponse, TaskUpdate


router = APIRouter()


def task_from_document(document: dict) -> Task:
    created_at = document.get("created_at")

    if created_at is not None and created_at.tzinfo is None:
        document = {
            **document,
            "created_at": created_at.replace(tzinfo=timezone.utc),
        }

    return Task(**document)


@router.get("/tasks", response_model=list[Task])
async def list_tasks() -> list[Task]:
    documents = (
        await db.tasks.find()
        .sort("created_at", -1)
        .to_list(1000)
    )

    return [
        task_from_document(document)
        for document in documents
    ]


@router.post("/tasks", response_model=Task)
async def create_task(input: TaskCreate) -> Task:
    title = input.title.strip()

    if not title:
        raise HTTPException(
            status_code=422,
            detail="Task title cannot be empty",
        )

    task = Task(title=title)

    await db.tasks.insert_one(task.model_dump())

    return task


@router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, input: TaskUpdate) -> Task:
    changes = input.model_dump(exclude_unset=True)

    if "title" in changes:
        changes["title"] = changes["title"].strip()

        if not changes["title"]:
            raise HTTPException(
                status_code=422,
                detail="Task title cannot be empty",
            )

    result = await db.tasks.update_one(
        {"id": task_id},
        {"$set": changes},
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    document = await db.tasks.find_one({"id": task_id})

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return task_from_document(document)


@router.delete(
    "/tasks/{task_id}",
    response_model=TaskDeleteResponse,
)
async def delete_task(task_id: str) -> TaskDeleteResponse:
    result = await db.tasks.delete_one({"id": task_id})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Task not found",
        )

    return TaskDeleteResponse(
        id=task_id,
        deleted=True,
    )
