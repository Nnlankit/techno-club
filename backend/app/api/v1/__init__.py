from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.members import router as members_router
from app.api.v1.domains import router as domains_router
from app.api.v1.events import router as events_router
from app.api.v1.hackathons import router as hackathons_router
from app.api.v1.projects import router as projects_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.activities import router as activities_router
from app.api.v1.approvals import router as approvals_router
from app.api.v1.meetings import router as meetings_router
from app.api.v1.resources import router as resources_router
from app.api.v1.finance import router as finance_router
from app.api.v1.sponsors import router as sponsors_router
from app.api.v1.certificates import router as certificates_router
from app.api.v1.achievements import router as achievements_router
from app.api.v1.announcements import router as announcements_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.documents import router as documents_router
from app.api.v1.calendar import router as calendar_router
from app.api.v1.reports import router as reports_router
from app.api.v1.audit import router as audit_router
from app.api.v1.search import router as search_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router, prefix="/auth", tags=["Authentication & RBAC"])
api_v1_router.include_router(users_router, prefix="/users", tags=["User & Role Management"])
api_v1_router.include_router(members_router, prefix="/members", tags=["Member Directory"])
api_v1_router.include_router(domains_router, prefix="/domains", tags=["Domain Operations"])
api_v1_router.include_router(events_router, prefix="/events", tags=["Events & Attendance"])
api_v1_router.include_router(hackathons_router, prefix="/hackathons", tags=["Hackathon Engine"])
api_v1_router.include_router(projects_router, prefix="/projects", tags=["Project Management"])
api_v1_router.include_router(tasks_router, prefix="/tasks", tags=["Task Kanban & Tracking"])
api_v1_router.include_router(activities_router, prefix="/activities", tags=["Initiatives & Activities"])
api_v1_router.include_router(approvals_router, prefix="/approvals", tags=["Multi-Tier Approval Workflow"])
api_v1_router.include_router(meetings_router, prefix="/meetings", tags=["Meeting Management & MoM"])
api_v1_router.include_router(resources_router, prefix="/resources", tags=["Hardware & Digital Resources"])
api_v1_router.include_router(finance_router, prefix="/finance", tags=["Finance & Budget Tracking"])
api_v1_router.include_router(sponsors_router, prefix="/sponsors", tags=["Sponsorship CRM"])
api_v1_router.include_router(certificates_router, prefix="/certificates", tags=["Certificates & QR Verification"])
api_v1_router.include_router(achievements_router, prefix="/achievements", tags=["Hall of Fame & Achievements"])
api_v1_router.include_router(announcements_router, prefix="/announcements", tags=["Broadcast Announcements"])
api_v1_router.include_router(notifications_router, prefix="/notifications", tags=["Notification Center"])
api_v1_router.include_router(documents_router, prefix="/documents", tags=["Document Vault"])
api_v1_router.include_router(calendar_router, prefix="/calendar", tags=["Unified Club Calendar"])
api_v1_router.include_router(reports_router, prefix="/reports", tags=["Executive Reports & CSV Export"])
api_v1_router.include_router(audit_router, prefix="/audit", tags=["Immutable Audit Trail"])
api_v1_router.include_router(search_router, prefix="/search", tags=["Global Multi-Entity Search"])
