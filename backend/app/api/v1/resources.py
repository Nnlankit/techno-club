import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member
from app.models.operations import Resource, ResourceAssignment
from app.schemas.operations import (
    ResourceCreate, ResourceUpdate, ResourceResponse, ResourceAssignmentCreate
)
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_resource_response(r: Resource) -> ResourceResponse:
    return ResourceResponse(
        id=r.id,
        name=r.name,
        category=r.category,
        resource_type=r.resource_type,
        identifier=r.identifier,
        quantity=r.quantity,
        available_quantity=r.available_quantity,
        status=r.status,
        location=r.location,
        assigned_to_id=r.assigned_to_id,
        assigned_to_name=r.assigned_to.full_name if r.assigned_to else None,
        specifications=json.loads(r.specifications or "{}"),
        notes=r.notes,
        created_at=r.created_at
    )


@router.get("/", response_model=List[ResourceResponse])
def get_all_resources(
    category: Optional[str] = None,
    resource_type: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db)
):
    query = db.query(Resource)
    if category:
        query = query.filter(Resource.category == category)
    if resource_type:
        query = query.filter(Resource.resource_type == resource_type)
    if status_filter:
        query = query.filter(Resource.status == status_filter)

    resources = query.all()
    return [build_resource_response(r) for r in resources]


@router.post("/", response_model=ResourceResponse)
def add_resource(
    payload: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head", "Treasurer"]))
):
    existing = db.query(Resource).filter(Resource.identifier == payload.identifier).first()
    if existing:
        raise HTTPException(status_code=400, detail="Resource with this identifier / asset tag already exists")

    res = Resource(
        name=payload.name,
        category=payload.category,
        resource_type=payload.resource_type,
        identifier=payload.identifier,
        quantity=payload.quantity or 1,
        available_quantity=payload.quantity or 1,
        status=payload.status or "Available",
        location=payload.location or "Tech Club Hardware Locker",
        specifications=json.dumps(payload.specifications or {}),
        notes=payload.notes
    )
    db.add(res)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Resource", res.id,
        f"{current_user.email} added resource '{res.name}' ({res.identifier})"
    )

    db.commit()
    db.refresh(res)
    return build_resource_response(res)


@router.put("/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    payload: ResourceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "specifications" in update_data and update_data["specifications"] is not None:
        update_data["specifications"] = json.dumps(update_data["specifications"])

    for k, v in update_data.items():
        setattr(res, k, v)

    db.commit()
    db.refresh(res)
    return build_resource_response(res)


@router.post("/assign", response_model=ResourceResponse)
def assign_resource_to_member(
    payload: ResourceAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head"]))
):
    res = db.query(Resource).filter(Resource.id == payload.resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    if res.available_quantity <= 0:
        raise HTTPException(status_code=400, detail="No available units of this resource")

    assignment = ResourceAssignment(
        resource_id=payload.resource_id,
        member_id=payload.member_id,
        project_id=payload.project_id,
        return_due_date=payload.return_due_date,
        status="Active"
    )
    db.add(assignment)

    res.available_quantity -= 1
    if res.available_quantity == 0:
        res.status = "Assigned"
    res.assigned_to_id = payload.member_id

    log_audit_event(
        db, current_user, "ASSIGN", "Resource", res.id,
        f"{current_user.email} assigned resource '{res.name}' to member #{payload.member_id}"
    )

    db.commit()
    db.refresh(res)
    return build_resource_response(res)


@router.post("/{resource_id}/return", response_model=ResourceResponse)
def return_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Domain Head", "Treasurer"]))
):
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    # Find active assignment
    assignment = db.query(ResourceAssignment).filter(
        ResourceAssignment.resource_id == resource_id,
        ResourceAssignment.status == "Active"
    ).order_by(ResourceAssignment.assigned_date.desc()).first()

    if assignment:
        assignment.status = "Returned"
        assignment.returned_date = datetime.now(timezone.utc)

    if res.available_quantity < res.quantity:
        res.available_quantity += 1

    if res.available_quantity == res.quantity:
        res.status = "Available"
        res.assigned_to_id = None
    elif res.available_quantity > 0:
        res.status = "Available"

    log_audit_event(
        db, current_user, "RETURN", "Resource", res.id,
        f"Resource '{res.name}' returned by/for member"
    )

    db.commit()
    db.refresh(res)
    return build_resource_response(res)


@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Vice President", "Treasurer"]))
):
    res = db.query(Resource).filter(Resource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")

    if res.available_quantity < res.quantity and not force:
        raise HTTPException(
            status_code=400,
            detail=f"Resource '{res.name}' currently has units checked out / assigned. Please return units first or pass force=true."
        )

    db.query(ResourceAssignment).filter(ResourceAssignment.resource_id == resource_id).delete(synchronize_session=False)

    log_audit_event(
        db, current_user, "DELETE", "Resource", res.id,
        f"Resource '{res.name}' ({res.identifier}) deleted by {current_user.email}"
    )

    db.delete(res)
    db.commit()
    return {"message": f"Resource '{res.name}' deleted successfully"}
