from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    file_type: str
    size: int
    folder_id: Optional[str] = None
    tags: List[str] = []
    ocr_text: Optional[str] = None
    thumbnail: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_starred: bool = False
    page_count: int = 1

class DocumentCreate(BaseModel):
    name: str
    file_type: str
    size: int
    folder_id: Optional[str] = None
    tags: List[str] = []
    page_count: int = 1

class DocumentUpdate(BaseModel):
    name: Optional[str] = None
    folder_id: Optional[str] = None
    tags: Optional[List[str]] = None
    is_starred: Optional[bool] = None
    ocr_text: Optional[str] = None

class Folder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    color: str = "#002FA7"
    parent_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FolderCreate(BaseModel):
    name: str
    color: str = "#002FA7"
    parent_id: Optional[str] = None

class Tag(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    color: str = "#002FA7"

class TagCreate(BaseModel):
    name: str
    color: str = "#002FA7"

class ScanActivity(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    document_name: str
    action: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Stats(BaseModel):
    total_documents: int
    total_scans_today: int
    total_pages: int
    storage_used_mb: float
    recent_activity: List[dict]

# Document endpoints
@api_router.post("/documents", response_model=Document)
async def create_document(doc_input: DocumentCreate):
    doc = Document(**doc_input.model_dump())
    doc_dict = doc.model_dump()
    doc_dict['created_at'] = doc_dict['created_at'].isoformat()
    doc_dict['updated_at'] = doc_dict['updated_at'].isoformat()
    await db.documents.insert_one(doc_dict)
    
    activity = ScanActivity(
        document_id=doc.id,
        document_name=doc.name,
        action="uploaded"
    )
    activity_dict = activity.model_dump()
    activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
    await db.activities.insert_one(activity_dict)
    
    return doc

@api_router.get("/documents", response_model=List[Document])
async def get_documents(
    folder_id: Optional[str] = None,
    tag: Optional[str] = None,
    search: Optional[str] = None,
    starred: Optional[bool] = None
):
    query = {}
    if folder_id:
        query["folder_id"] = folder_id
    if tag:
        query["tags"] = tag
    if starred is not None:
        query["is_starred"] = starred
    if search:
        query["name"] = {"$regex": search, "$options": "i"}
    
    docs = await db.documents.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for doc in docs:
        if isinstance(doc.get('created_at'), str):
            doc['created_at'] = datetime.fromisoformat(doc['created_at'])
        if isinstance(doc.get('updated_at'), str):
            doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    return docs

@api_router.get("/documents/{doc_id}", response_model=Document)
async def get_document(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if isinstance(doc.get('updated_at'), str):
        doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    return doc

@api_router.patch("/documents/{doc_id}", response_model=Document)
async def update_document(doc_id: str, update: DocumentUpdate):
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    update_dict['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    result = await db.documents.update_one({"id": doc_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if isinstance(doc.get('created_at'), str):
        doc['created_at'] = datetime.fromisoformat(doc['created_at'])
    if isinstance(doc.get('updated_at'), str):
        doc['updated_at'] = datetime.fromisoformat(doc['updated_at'])
    return doc

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    result = await db.documents.delete_one({"id": doc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}

# Folder endpoints
@api_router.post("/folders", response_model=Folder)
async def create_folder(folder_input: FolderCreate):
    folder = Folder(**folder_input.model_dump())
    folder_dict = folder.model_dump()
    folder_dict['created_at'] = folder_dict['created_at'].isoformat()
    await db.folders.insert_one(folder_dict)
    return folder

@api_router.get("/folders", response_model=List[Folder])
async def get_folders():
    folders = await db.folders.find({}, {"_id": 0}).to_list(100)
    for folder in folders:
        if isinstance(folder.get('created_at'), str):
            folder['created_at'] = datetime.fromisoformat(folder['created_at'])
    return folders

@api_router.delete("/folders/{folder_id}")
async def delete_folder(folder_id: str):
    result = await db.folders.delete_one({"id": folder_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Folder not found")
    await db.documents.update_many({"folder_id": folder_id}, {"$set": {"folder_id": None}})
    return {"message": "Folder deleted"}

# Tag endpoints
@api_router.post("/tags", response_model=Tag)
async def create_tag(tag_input: TagCreate):
    tag = Tag(**tag_input.model_dump())
    await db.tags.insert_one(tag.model_dump())
    return tag

@api_router.get("/tags", response_model=List[Tag])
async def get_tags():
    tags = await db.tags.find({}, {"_id": 0}).to_list(100)
    return tags

@api_router.delete("/tags/{tag_id}")
async def delete_tag(tag_id: str):
    result = await db.tags.delete_one({"id": tag_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tag not found")
    return {"message": "Tag deleted"}

# Activity/History endpoints
@api_router.get("/activities", response_model=List[ScanActivity])
async def get_activities(limit: int = 20):
    activities = await db.activities.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    for activity in activities:
        if isinstance(activity.get('timestamp'), str):
            activity['timestamp'] = datetime.fromisoformat(activity['timestamp'])
    return activities

# Stats endpoint
@api_router.get("/stats")
async def get_stats():
    total_docs = await db.documents.count_documents({})
    
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    scans_today = await db.activities.count_documents({
        "action": "uploaded",
        "timestamp": {"$gte": today_start.isoformat()}
    })
    
    pipeline = [{"$group": {"_id": None, "total_pages": {"$sum": "$page_count"}, "total_size": {"$sum": "$size"}}}]
    agg_result = await db.documents.aggregate(pipeline).to_list(1)
    total_pages = agg_result[0]["total_pages"] if agg_result else 0
    total_size = agg_result[0]["total_size"] if agg_result else 0
    storage_mb = round(total_size / (1024 * 1024), 2)
    
    recent = await db.activities.find({}, {"_id": 0}).sort("timestamp", -1).to_list(5)
    for activity in recent:
        if isinstance(activity.get('timestamp'), str):
            activity['timestamp'] = datetime.fromisoformat(activity['timestamp']).isoformat()
    
    return {
        "total_documents": total_docs,
        "total_scans_today": scans_today,
        "total_pages": total_pages,
        "storage_used_mb": storage_mb,
        "recent_activity": recent
    }

# OCR endpoint (mocked)
@api_router.post("/ocr/{doc_id}")
async def extract_ocr(doc_id: str):
    doc = await db.documents.find_one({"id": doc_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    mock_ocr_text = f"""Document: {doc['name']}
    
SAMPLE EXTRACTED TEXT (MOCKED OCR)

This is a demonstration of the OCR text extraction feature.
The actual OCR integration would process the uploaded document
and extract all readable text content.

Key Features:
- Automatic text recognition
- Multi-language support
- Handwriting recognition
- Table extraction

Document Details:
- File Type: {doc['file_type']}
- Pages: {doc.get('page_count', 1)}
- Size: {doc['size']} bytes

Note: This is mocked data for demonstration purposes.
Real OCR integration would use services like Google Vision,
AWS Textract, or Tesseract for actual text extraction."""
    
    await db.documents.update_one(
        {"id": doc_id},
        {"$set": {"ocr_text": mock_ocr_text, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    activity = ScanActivity(
        document_id=doc_id,
        document_name=doc['name'],
        action="ocr_extracted"
    )
    activity_dict = activity.model_dump()
    activity_dict['timestamp'] = activity_dict['timestamp'].isoformat()
    await db.activities.insert_one(activity_dict)
    
    return {"ocr_text": mock_ocr_text}

# Health check
@api_router.get("/")
async def root():
    return {"message": "Digital ProScan API is running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
