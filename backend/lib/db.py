import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, DESCENDING

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.get_database(os.environ.get("DB_NAME", "taskflow"))

INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [
        IndexModel(
            [("timestamp", DESCENDING)],
            name="timestamp_desc",
        )
    ],
    "tasks": [
        IndexModel(
            [("created_at", DESCENDING)],
            name="created_at_desc",
        )
    ],
}

async def ensure_indexes():
    for collection_name, indexes in INDEXES.items():
        collection = db[collection_name]
        try:
            await collection.create_indexes(indexes)
        except Exception as e:
            print(f"Error ensuring indexes for {collection_name}: {e}")
