from fastapi import FastAPI, APIRouter, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from enum import Enum
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Digital ProScan API", version="1.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class TeamMemberStatus(str, Enum):
    WORKING = "WORKING"
    SUPPORT_ACTIVITY = "SUPPORT_ACTIVITY"
    WORK_DELAY = "WORK_DELAY"
    TRAVELING = "TRAVELING"
    IDLE = "IDLE"
    OFFLINE = "OFFLINE"

class SupportActivityType(str, Enum):
    SAFETY_MEETING = "SAFETY_MEETING"
    GET_RETURN_TOOLS = "GET_RETURN_TOOLS"
    GET_RETURN_PARTS = "GET_RETURN_PARTS"
    JOB_WALK = "JOB_WALK"
    JSA_PERMITTING = "JSA_PERMITTING"
    LOCK_OUT_TAG_OUT = "LOCK_OUT_TAG_OUT"
    HOUSEKEEPING = "HOUSEKEEPING"

class WorkDelayType(str, Enum):
    WAITING_PERMIT = "WAITING_PERMIT"
    WAITING_PARTS = "WAITING_PARTS"
    WAITING_EQUIPMENT = "WAITING_EQUIPMENT"
    WAITING_INSTRUCTIONS = "WAITING_INSTRUCTIONS"
    WEATHER_DELAY = "WEATHER_DELAY"
    EQUIPMENT_FAILURE = "EQUIPMENT_FAILURE"
    SAFETY_STOP = "SAFETY_STOP"
    BREAK_IN_WORK = "BREAK_IN_WORK"
    WAITING_ACCESS = "WAITING_ACCESS"
    COORDINATION_DELAY = "COORDINATION_DELAY"
    MATERIAL_SHORTAGE = "MATERIAL_SHORTAGE"
    REWORK = "REWORK"
    INSPECTION_DELAY = "INSPECTION_DELAY"
    ENVIRONMENTAL_ISSUE = "ENVIRONMENTAL_ISSUE"
    UTILITY_DELAY = "UTILITY_DELAY"
    SUBCONTRACTOR_DELAY = "SUBCONTRACTOR_DELAY"
    DESIGN_ISSUE = "DESIGN_ISSUE"
    OTHER = "OTHER"

class AlertStatus(str, Enum):
    TRIGGERED = "TRIGGERED"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    CANCELED = "CANCELED"
    RESOLVED = "RESOLVED"

# Models
class TeamMember(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    employee_id: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    device_id: Optional[str] = None
    current_status: TeamMemberStatus = TeamMemberStatus.OFFLINE
    current_job_wo_id: Optional[str] = None
    current_job_wo_number: Optional[str] = None
    last_location: Optional[Dict[str, float]] = None
    last_location_update: Optional[datetime] = None
    speed: float = 0.0
    battery_level: int = 100
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeamMemberCreate(BaseModel):
    name: str
    employee_id: str
    phone_number: Optional[str] = None
    email: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    device_id: Optional[str] = None
    is_active: Optional[bool] = None

class LocationUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: float = 0.0
    altitude: Optional[float] = None
    battery_level: int = 100
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LocationUpdateCreate(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    accuracy: Optional[float] = None
    speed: float = 0.0
    altitude: Optional[float] = None
    battery_level: int = 100

class StatusUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    status: TeamMemberStatus
    details: Optional[str] = None
    support_activity_type: Optional[SupportActivityType] = None
    work_delay_type: Optional[WorkDelayType] = None
    job_wo_id: Optional[str] = None
    job_wo_number: Optional[str] = None
    geofence_id: Optional[str] = None
    geofence_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusUpdateCreate(BaseModel):
    user_id: str
    status: TeamMemberStatus
    details: Optional[str] = None
    support_activity_type: Optional[SupportActivityType] = None
    work_delay_type: Optional[WorkDelayType] = None
    job_wo_id: Optional[str] = None
    job_wo_number: Optional[str] = None
    geofence_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class JobWorkOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_wo_number: str
    description: Optional[str] = None
    location: Optional[str] = None
    client_name: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JobWorkOrderCreate(BaseModel):
    job_wo_number: str
    description: Optional[str] = None
    location: Optional[str] = None
    client_name: Optional[str] = None

class Geofence(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    center_lat: float
    center_lng: float
    radius: float  # in meters
    color: str = "#002FA7"
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GeofenceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    center_lat: float
    center_lng: float
    radius: float
    color: str = "#002FA7"

class GeofenceEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    geofence_id: str
    geofence_name: Optional[str] = None
    event_type: str  # ENTER, EXIT, DWELL
    latitude: float
    longitude: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    sender_name: Optional[str] = None
    receiver_id: str
    receiver_name: Optional[str] = None
    content: str
    job_wo_id: Optional[str] = None
    is_read: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str
    job_wo_id: Optional[str] = None

class SOSAlert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    latitude: float
    longitude: float
    status: AlertStatus = AlertStatus.TRIGGERED
    cancellation_info: Optional[str] = None
    canceled_by: Optional[str] = None
    canceled_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SOSAlertCreate(BaseModel):
    user_id: str
    latitude: float
    longitude: float

class ProductivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: Optional[str] = None
    date: str  # YYYY-MM-DD
    status: TeamMemberStatus
    duration_minutes: float
    job_wo_id: Optional[str] = None
    job_wo_number: Optional[str] = None
    geofence_id: Optional[str] = None
    geofence_name: Optional[str] = None
    work_delay_type: Optional[WorkDelayType] = None
    support_activity_type: Optional[SupportActivityType] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Helper function to serialize datetime
def serialize_doc(doc: dict) -> dict:
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

def deserialize_doc(doc: dict) -> dict:
    datetime_fields = ['timestamp', 'created_at', 'last_location_update', 'canceled_at', 'acknowledged_at']
    for field in datetime_fields:
        if field in doc and isinstance(doc[field], str):
            doc[field] = datetime.fromisoformat(doc[field])
    return doc

# ==================== Team Member Endpoints ====================
@api_router.post("/team-members", response_model=TeamMember)
async def create_team_member(member_input: TeamMemberCreate):
    member = TeamMember(**member_input.model_dump())
    doc = serialize_doc(member.model_dump())
    await db.team_members.insert_one(doc)
    return member

@api_router.get("/team-members", response_model=List[TeamMember])
async def get_team_members(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    members = await db.team_members.find(query, {"_id": 0}).to_list(1000)
    return [deserialize_doc(m) for m in members]

@api_router.get("/team-members/{member_id}", response_model=TeamMember)
async def get_team_member(member_id: str):
    member = await db.team_members.find_one({"id": member_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return deserialize_doc(member)

@api_router.patch("/team-members/{member_id}", response_model=TeamMember)
async def update_team_member(member_id: str, update: TeamMemberUpdate):
    update_dict = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_dict:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.team_members.update_one({"id": member_id}, {"$set": update_dict})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    member = await db.team_members.find_one({"id": member_id}, {"_id": 0})
    return deserialize_doc(member)

@api_router.delete("/team-members/{member_id}")
async def delete_team_member(member_id: str):
    result = await db.team_members.delete_one({"id": member_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Team member deleted"}

# ==================== Location Endpoints ====================
@api_router.post("/locations", response_model=LocationUpdate)
async def submit_location(location_input: LocationUpdateCreate):
    location = LocationUpdate(**location_input.model_dump())
    doc = serialize_doc(location.model_dump())
    await db.locations.insert_one(doc)
    
    # Update team member's last location and check for traveling status
    member = await db.team_members.find_one({"id": location_input.user_id}, {"_id": 0})
    update_data = {
        "last_location": {"lat": location_input.latitude, "lng": location_input.longitude},
        "last_location_update": datetime.now(timezone.utc).isoformat(),
        "speed": location_input.speed,
        "battery_level": location_input.battery_level
    }
    
    # Auto-set status to TRAVELING if speed > 5 mph (8 km/h ≈ 2.2 m/s)
    if location_input.speed > 2.2 and member and member.get("current_status") not in ["TRAVELING", "WORK_DELAY"]:
        update_data["current_status"] = TeamMemberStatus.TRAVELING.value
        # Log status change
        status_update = StatusUpdate(
            user_id=location_input.user_id,
            user_name=member.get("name") if member else None,
            status=TeamMemberStatus.TRAVELING,
            details="Auto-detected: Speed > 5 mph",
            latitude=location_input.latitude,
            longitude=location_input.longitude
        )
        await db.status_updates.insert_one(serialize_doc(status_update.model_dump()))
    
    await db.team_members.update_one({"id": location_input.user_id}, {"$set": update_data})
    
    # Check geofence events
    geofences = await db.geofences.find({"is_active": True}, {"_id": 0}).to_list(100)
    for gf in geofences:
        distance = calculate_distance(location_input.latitude, location_input.longitude, gf["center_lat"], gf["center_lng"])
        # Check if within geofence
        if distance <= gf["radius"]:
            # Check if this is an ENTER event
            last_gf_event = await db.geofence_events.find_one(
                {"user_id": location_input.user_id, "geofence_id": gf["id"]},
                {"_id": 0},
                sort=[("timestamp", -1)]
            )
            if not last_gf_event or last_gf_event.get("event_type") == "EXIT":
                gf_event = GeofenceEvent(
                    user_id=location_input.user_id,
                    user_name=member.get("name") if member else None,
                    geofence_id=gf["id"],
                    geofence_name=gf["name"],
                    event_type="ENTER",
                    latitude=location_input.latitude,
                    longitude=location_input.longitude
                )
                await db.geofence_events.insert_one(serialize_doc(gf_event.model_dump()))
    
    return location

@api_router.get("/locations")
async def get_locations(user_id: Optional[str] = None, start_time: Optional[str] = None, end_time: Optional[str] = None, limit: int = 100):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if start_time:
        query["timestamp"] = {"$gte": start_time}
    if end_time:
        if "timestamp" in query:
            query["timestamp"]["$lte"] = end_time
        else:
            query["timestamp"] = {"$lte": end_time}
    
    locations = await db.locations.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [deserialize_doc(loc) for loc in locations]

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters using Haversine formula"""
    from math import radians, sin, cos, sqrt, atan2
    R = 6371000  # Earth's radius in meters
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c

# ==================== Status Update Endpoints ====================
@api_router.post("/status", response_model=StatusUpdate)
async def submit_status(status_input: StatusUpdateCreate):
    member = await db.team_members.find_one({"id": status_input.user_id}, {"_id": 0})
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    
    # Get geofence name if provided
    geofence_name = None
    if status_input.geofence_id:
        gf = await db.geofences.find_one({"id": status_input.geofence_id}, {"_id": 0})
        geofence_name = gf.get("name") if gf else None
    
    status_update = StatusUpdate(
        **status_input.model_dump(),
        user_name=member.get("name"),
        geofence_name=geofence_name
    )
    doc = serialize_doc(status_update.model_dump())
    await db.status_updates.insert_one(doc)
    
    # Update team member current status
    update_data = {
        "current_status": status_input.status.value,
        "current_job_wo_id": status_input.job_wo_id,
        "current_job_wo_number": status_input.job_wo_number
    }
    await db.team_members.update_one({"id": status_input.user_id}, {"$set": update_data})
    
    # Log productivity if work delay > 30 mins (check and notify - simplified)
    if status_input.status == TeamMemberStatus.WORK_DELAY:
        # In production, this would trigger email/SMS notifications
        logging.info(f"Work delay started for user {status_input.user_id}: {status_input.work_delay_type}")
    
    return status_update

@api_router.get("/status", response_model=List[StatusUpdate])
async def get_status_updates(user_id: Optional[str] = None, limit: int = 50):
    query = {"user_id": user_id} if user_id else {}
    updates = await db.status_updates.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [deserialize_doc(u) for u in updates]

@api_router.get("/status/current")
async def get_current_statuses():
    """Get current status of all active team members"""
    members = await db.team_members.find({"is_active": True}, {"_id": 0}).to_list(1000)
    result = []
    for m in members:
        result.append({
            "user_id": m["id"],
            "name": m["name"],
            "employee_id": m["employee_id"],
            "status": m.get("current_status", "OFFLINE"),
            "job_wo_number": m.get("current_job_wo_number"),
            "last_location": m.get("last_location"),
            "speed": m.get("speed", 0),
            "battery_level": m.get("battery_level", 100),
            "last_update": m.get("last_location_update")
        })
    return result

# ==================== Job/Work Order Endpoints ====================
@api_router.post("/jobs", response_model=JobWorkOrder)
async def create_job(job_input: JobWorkOrderCreate):
    job = JobWorkOrder(**job_input.model_dump())
    doc = serialize_doc(job.model_dump())
    await db.jobs.insert_one(doc)
    return job

@api_router.get("/jobs", response_model=List[JobWorkOrder])
async def get_jobs(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(1000)
    return [deserialize_doc(j) for j in jobs]

@api_router.get("/jobs/{job_id}", response_model=JobWorkOrder)
async def get_job(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return deserialize_doc(job)

@api_router.patch("/jobs/{job_id}")
async def update_job(job_id: str, is_active: bool):
    result = await db.jobs.update_one({"id": job_id}, {"$set": {"is_active": is_active}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job updated"}

@api_router.put("/team-members/{member_id}/job")
async def assign_job_to_member(member_id: str, job_wo_id: Optional[str] = None, job_wo_number: Optional[str] = None):
    update_data = {
        "current_job_wo_id": job_wo_id,
        "current_job_wo_number": job_wo_number
    }
    result = await db.team_members.update_one({"id": member_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Team member not found")
    return {"message": "Job assigned"}

# ==================== Geofence Endpoints ====================
@api_router.post("/geofences", response_model=Geofence)
async def create_geofence(gf_input: GeofenceCreate):
    geofence = Geofence(**gf_input.model_dump())
    doc = serialize_doc(geofence.model_dump())
    await db.geofences.insert_one(doc)
    return geofence

@api_router.get("/geofences", response_model=List[Geofence])
async def get_geofences(active_only: bool = True):
    query = {"is_active": True} if active_only else {}
    geofences = await db.geofences.find(query, {"_id": 0}).to_list(100)
    return [deserialize_doc(gf) for gf in geofences]

@api_router.delete("/geofences/{geofence_id}")
async def delete_geofence(geofence_id: str):
    result = await db.geofences.delete_one({"id": geofence_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Geofence not found")
    return {"message": "Geofence deleted"}

@api_router.get("/geofence-events")
async def get_geofence_events(user_id: Optional[str] = None, geofence_id: Optional[str] = None, limit: int = 100):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if geofence_id:
        query["geofence_id"] = geofence_id
    events = await db.geofence_events.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [deserialize_doc(e) for e in events]

# ==================== Messaging Endpoints ====================
@api_router.post("/messages", response_model=Message)
async def send_message(msg_input: MessageCreate):
    sender = await db.team_members.find_one({"id": msg_input.sender_id}, {"_id": 0})
    receiver = await db.team_members.find_one({"id": msg_input.receiver_id}, {"_id": 0})
    
    message = Message(
        **msg_input.model_dump(),
        sender_name=sender.get("name") if sender else "System",
        receiver_name=receiver.get("name") if receiver else "Portal"
    )
    doc = serialize_doc(message.model_dump())
    await db.messages.insert_one(doc)
    return message

@api_router.get("/messages", response_model=List[Message])
async def get_messages(user_id: Optional[str] = None, limit: int = 50):
    query = {}
    if user_id:
        query["$or"] = [{"sender_id": user_id}, {"receiver_id": user_id}]
    messages = await db.messages.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [deserialize_doc(m) for m in messages]

@api_router.patch("/messages/{message_id}/read")
async def mark_message_read(message_id: str):
    result = await db.messages.update_one({"id": message_id}, {"$set": {"is_read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"message": "Marked as read"}

# ==================== SOS Alert Endpoints ====================
@api_router.post("/alerts/sos", response_model=SOSAlert)
async def trigger_sos_alert(alert_input: SOSAlertCreate):
    member = await db.team_members.find_one({"id": alert_input.user_id}, {"_id": 0})
    
    alert = SOSAlert(
        **alert_input.model_dump(),
        user_name=member.get("name") if member else "Unknown"
    )
    doc = serialize_doc(alert.model_dump())
    await db.sos_alerts.insert_one(doc)
    
    # In production: Send email, SMS, push notifications
    logging.warning(f"SOS ALERT TRIGGERED by {alert.user_name} at ({alert_input.latitude}, {alert_input.longitude})")
    
    return alert

@api_router.get("/alerts/sos", response_model=List[SOSAlert])
async def get_sos_alerts(status: Optional[AlertStatus] = None, limit: int = 50):
    query = {"status": status.value} if status else {}
    alerts = await db.sos_alerts.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return [deserialize_doc(a) for a in alerts]

@api_router.put("/alerts/sos/{alert_id}/acknowledge")
async def acknowledge_sos_alert(alert_id: str, acknowledged_by: str):
    update_data = {
        "status": AlertStatus.ACKNOWLEDGED.value,
        "acknowledged_by": acknowledged_by,
        "acknowledged_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.sos_alerts.update_one({"id": alert_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert acknowledged"}

@api_router.put("/alerts/sos/{alert_id}/cancel")
async def cancel_sos_alert(alert_id: str, canceled_by: str, cancellation_reason: Optional[str] = None):
    update_data = {
        "status": AlertStatus.CANCELED.value,
        "canceled_by": canceled_by,
        "canceled_at": datetime.now(timezone.utc).isoformat(),
        "cancellation_info": cancellation_reason
    }
    result = await db.sos_alerts.update_one({"id": alert_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert canceled"}

@api_router.put("/alerts/sos/{alert_id}/resolve")
async def resolve_sos_alert(alert_id: str):
    result = await db.sos_alerts.update_one({"id": alert_id}, {"$set": {"status": AlertStatus.RESOLVED.value}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert resolved"}

# ==================== Reporting/Analytics Endpoints ====================
@api_router.get("/reports/productivity")
async def get_productivity_report(user_id: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get productivity summary by status"""
    match_query = {}
    if user_id:
        match_query["user_id"] = user_id
    if start_date:
        match_query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in match_query:
            match_query["timestamp"]["$lte"] = end_date
        else:
            match_query["timestamp"] = {"$lte": end_date}
    
    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": "$status",
            "count": {"$sum": 1}
        }}
    ]
    
    results = await db.status_updates.aggregate(pipeline).to_list(100)
    
    status_counts = {r["_id"]: r["count"] for r in results}
    total = sum(status_counts.values()) or 1
    
    return {
        "working": status_counts.get("WORKING", 0),
        "support_activity": status_counts.get("SUPPORT_ACTIVITY", 0),
        "work_delay": status_counts.get("WORK_DELAY", 0),
        "traveling": status_counts.get("TRAVELING", 0),
        "idle": status_counts.get("IDLE", 0),
        "total_updates": total,
        "productivity_percentage": round((status_counts.get("WORKING", 0) / total) * 100, 1)
    }

@api_router.get("/reports/work-barriers")
async def get_work_barriers_report(start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Get breakdown of work delay types"""
    match_query = {"status": "WORK_DELAY", "work_delay_type": {"$ne": None}}
    if start_date:
        match_query["timestamp"] = {"$gte": start_date}
    if end_date:
        if "timestamp" in match_query:
            match_query["timestamp"]["$lte"] = end_date
        else:
            match_query["timestamp"] = {"$lte": end_date}
    
    pipeline = [
        {"$match": match_query},
        {"$group": {
            "_id": "$work_delay_type",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    
    results = await db.status_updates.aggregate(pipeline).to_list(100)
    return [{"barrier_type": r["_id"], "count": r["count"]} for r in results]

@api_router.get("/stats")
async def get_dashboard_stats():
    """Get overview statistics for dashboard"""
    total_members = await db.team_members.count_documents({"is_active": True})
    
    # Count by status
    status_pipeline = [
        {"$match": {"is_active": True}},
        {"$group": {"_id": "$current_status", "count": {"$sum": 1}}}
    ]
    status_results = await db.team_members.aggregate(status_pipeline).to_list(10)
    status_counts = {r["_id"]: r["count"] for r in status_results}
    
    # Active alerts
    active_alerts = await db.sos_alerts.count_documents({"status": {"$in": ["TRIGGERED", "ACKNOWLEDGED"]}})
    
    # Today's updates
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    updates_today = await db.status_updates.count_documents({"timestamp": {"$gte": today_start.isoformat()}})
    
    # Total jobs
    total_jobs = await db.jobs.count_documents({"is_active": True})
    
    # Total geofences
    total_geofences = await db.geofences.count_documents({"is_active": True})
    
    # Recent activity
    recent = await db.status_updates.find({}, {"_id": 0}).sort("timestamp", -1).to_list(10)
    
    return {
        "total_team_members": total_members,
        "working": status_counts.get("WORKING", 0),
        "support_activity": status_counts.get("SUPPORT_ACTIVITY", 0),
        "work_delay": status_counts.get("WORK_DELAY", 0),
        "traveling": status_counts.get("TRAVELING", 0),
        "idle": status_counts.get("IDLE", 0) + status_counts.get("OFFLINE", 0),
        "active_alerts": active_alerts,
        "updates_today": updates_today,
        "total_jobs": total_jobs,
        "total_geofences": total_geofences,
        "recent_activity": [deserialize_doc(r) for r in recent]
    }

# ==================== Lookup/Reference Endpoints ====================
@api_router.get("/support-activities")
async def get_support_activity_types():
    """Get list of support activity types"""
    return [{"value": t.value, "label": t.value.replace("_", " ").title()} for t in SupportActivityType]

@api_router.get("/work-delays")
async def get_work_delay_types():
    """Get list of work delay/barrier types"""
    return [{"value": t.value, "label": t.value.replace("_", " ").title()} for t in WorkDelayType]

# ==================== Health Check ====================
@api_router.get("/")
async def root():
    return {"message": "Digital ProScan API is running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
