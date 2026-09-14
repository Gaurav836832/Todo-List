import asyncio
import logging
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from typing import List

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from lib.db import client, db, ensure_indexes
from routers.tasks import router as tasks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(
        ensure_indexes()
    )

    yield

    client.close()


app = FastAPI(lifespan=lifespan)

api_router = APIRouter(prefix="/api")


class StatusCheck(BaseModel):
    id: str = Field(
        default_factory=lambda: str(uuid.uuid4())
    )
    client_name: str
    timestamp: datetime = Field(
        default_factory=datetime.utcnow
    )


class StatusCheckCreate(BaseModel):
    client_name: str


api_router.include_router(tasks_router)


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.post(
    "/status",
    response_model=StatusCheck,
)
async def create_status_check(
    input: StatusCheckCreate,
):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)

    await db.status_checks.insert_one(
        status_obj.model_dump()
    )

    return status_obj


@api_router.get(
    "/status",
    response_model=List[StatusCheck],
)
async def get_status_checks():
    status_checks = (
        await db.status_checks
        .find()
        .to_list(1000)
    )

    return [
        StatusCheck(**status_check)
        for status_check in status_checks
    ]


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get(
        "CORS_ORIGINS",
        "*",
    ).split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)

app.include_router(api_router)
