from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user_role import User
from app.models.member_domain import Member
from app.models.operations import Budget, Expense
from app.schemas.operations import (
    BudgetCreate, BudgetResponse, ExpenseCreate, ExpenseUpdate, ExpenseResponse
)
from app.services.audit_service import log_audit_event

router = APIRouter()


def build_budget_response(b: Budget) -> BudgetResponse:
    remaining = b.total_allocated - b.total_spent
    return BudgetResponse(
        id=b.id,
        title=b.title,
        fiscal_year=b.fiscal_year,
        domain_id=b.domain_id,
        event_id=b.event_id,
        total_allocated=b.total_allocated,
        total_spent=b.total_spent,
        remaining_budget=remaining,
        status=b.status,
        notes=b.notes,
        created_at=b.created_at
    )


def build_expense_response(e: Expense) -> ExpenseResponse:
    return ExpenseResponse(
        id=e.id,
        budget_id=e.budget_id,
        event_id=e.event_id,
        event_name=e.event.name if e.event else None,
        domain_id=e.domain_id,
        title=e.title,
        category=e.category,
        amount=e.amount,
        receipt_url=e.receipt_url,
        incurred_by_id=e.incurred_by_id,
        incurred_by_name=e.incurred_by.full_name if e.incurred_by else None,
        status=e.status,
        approved_by_id=e.approved_by_id,
        notes=e.notes,
        date_incurred=e.date_incurred
    )


@router.get("/budgets", response_model=List[BudgetResponse])
def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President", "Treasurer", "Faculty Coordinator"]))
):
    budgets = db.query(Budget).order_by(desc(Budget.created_at)).all()
    return [build_budget_response(b) for b in budgets]


@router.post("/budgets", response_model=BudgetResponse)
def create_budget(
    payload: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President", "Treasurer"]))
):
    b = Budget(
        title=payload.title,
        fiscal_year=payload.fiscal_year or "2025-2026",
        domain_id=payload.domain_id,
        event_id=payload.event_id,
        total_allocated=payload.total_allocated,
        total_spent=0.0,
        status="Approved",
        notes=payload.notes
    )
    db.add(b)
    db.flush()

    log_audit_event(
        db, current_user, "CREATE", "Budget", b.id,
        f"{current_user.email} allocated budget '{b.title}': ${b.total_allocated}"
    )

    db.commit()
    db.refresh(b)
    return build_budget_response(b)


@router.get("/expenses", response_model=List[ExpenseResponse])
def get_expenses(
    event_id: Optional[int] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["Super Admin", "President", "Vice President", "Treasurer", "Faculty Coordinator"]))
):
    query = db.query(Expense)
    if event_id:
        query = query.filter(Expense.event_id == event_id)
    if status_filter:
        query = query.filter(Expense.status == status_filter)

    expenses = query.order_by(desc(Expense.date_incurred)).all()
    return [build_expense_response(e) for e in expenses]


@router.post("/expenses", response_model=ExpenseResponse)
def record_expense(
    payload: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    incurred_by_id = current_user.member.id if current_user.member else None

    e = Expense(
        budget_id=payload.budget_id,
        event_id=payload.event_id,
        domain_id=payload.domain_id,
        title=payload.title,
        category=payload.category,
        amount=payload.amount,
        receipt_url=payload.receipt_url,
        incurred_by_id=incurred_by_id,
        status="Pending",
        notes=payload.notes
    )
    db.add(e)
    db.flush()

    log_audit_event(
        db, current_user, "SUBMIT_EXPENSE", "Expense", e.id,
        f"{current_user.email} filed expense claim: '{e.title}' (${e.amount})"
    )

    db.commit()
    db.refresh(e)
    return build_expense_response(e)


@router.put("/expenses/{expense_id}/status", response_model=ExpenseResponse)
def update_expense_status(
    expense_id: int,
    payload: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["President", "Treasurer", "Vice President"]))
):
    e = db.query(Expense).filter(Expense.id == expense_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Expense not found")

    old_status = e.status
    if payload.status:
        e.status = payload.status
        e.approved_by_id = current_user.member.id if current_user.member else None

        # If approved or reimbursed, update associated budget total_spent
        if payload.status in ["Approved", "Reimbursed"] and old_status not in ["Approved", "Reimbursed"] and e.budget_id:
            b = db.query(Budget).filter(Budget.id == e.budget_id).first()
            if b:
                b.total_spent += e.amount

    if payload.notes:
        e.notes = payload.notes

    log_audit_event(
        db, current_user, "UPDATE_EXPENSE_STATUS", "Expense", e.id,
        f"{current_user.email} changed expense #{e.id} status to {e.status}"
    )

    db.commit()
    db.refresh(e)
    return build_expense_response(e)
