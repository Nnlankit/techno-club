import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

ROLES_CREDENTIALS = [
    ("Super Admin", "president@technoclub.org"),  # Super Admin credentials
    ("President", "president@technoclub.org"),
    ("Vice President", "vp@technoclub.org"),
    ("Domain Head", "aiml.head@technoclub.org"),
    ("Member", "member1@technoclub.org"),
    ("Treasurer", "treasurer@technoclub.org"),
    ("Faculty Coordinator", "faculty@technoclub.org"),
]


def test_system_health_and_root():
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert res_root.json()["status"] == "online"

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"


def test_all_roles_login_and_auth_profile():
    for role_name, email in ROLES_CREDENTIALS:
        res = client.post("/api/v1/auth/json-login", json={"email": email, "password": "TechnoClub@2026"})
        assert res.status_code == 200, f"Login failed for {role_name} ({email})"
        data = res.json()
        assert "access_token" in data
        token = data["access_token"]

        # /auth/me
        me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert me_res.status_code == 200
        me = me_res.json()
        assert me["email"] == email


def test_full_module_suite_for_leadership():
    # President has full access
    pres_res = client.post("/api/v1/auth/json-login", json={"email": "president@technoclub.org", "password": "TechnoClub@2026"})
    token = pres_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Members
    res = client.get("/api/v1/members/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 2. Domains
    res = client.get("/api/v1/domains/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 3. Events
    res = client.get("/api/v1/events/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 4. Hackathons
    res = client.get("/api/v1/hackathons/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 5. Projects
    res = client.get("/api/v1/projects/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 6. Tasks
    res = client.get("/api/v1/tasks/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 7. Activities
    res = client.get("/api/v1/activities/", headers=headers)
    assert res.status_code == 200

    # 8. Approvals
    res = client.get("/api/v1/approvals/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 9. Meetings
    res = client.get("/api/v1/meetings/", headers=headers)
    assert res.status_code == 200

    # 10. Resources
    res = client.get("/api/v1/resources/", headers=headers)
    assert res.status_code == 200

    # 11. Finance
    res = client.get("/api/v1/finance/budgets", headers=headers)
    assert res.status_code == 200
    res_exp = client.get("/api/v1/finance/expenses", headers=headers)
    assert res_exp.status_code == 200

    # 12. Sponsors
    res = client.get("/api/v1/sponsors/", headers=headers)
    assert res.status_code == 200

    # 13. Certificates
    res = client.get("/api/v1/certificates/", headers=headers)
    assert res.status_code == 200

    # 14. Achievements
    res = client.get("/api/v1/achievements/", headers=headers)
    assert res.status_code == 200

    # 15. Announcements
    res = client.get("/api/v1/announcements/", headers=headers)
    assert res.status_code == 200

    # 16. Notifications
    res = client.get("/api/v1/notifications/", headers=headers)
    assert res.status_code == 200

    # 17. Documents
    res = client.get("/api/v1/documents/", headers=headers)
    assert res.status_code == 200

    # 18. Calendar
    res = client.get("/api/v1/calendar/events", headers=headers)
    assert res.status_code == 200

    # 19. Reports
    res = client.get("/api/v1/reports/executive", headers=headers)
    assert res.status_code == 200
    res_csv = client.get("/api/v1/reports/export-csv/members", headers=headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers.get("content-type", "")

    # 20. Audit
    res = client.get("/api/v1/audit/", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1

    # 21. Global Search
    res = client.get("/api/v1/search/?q=AI", headers=headers)
    assert res.status_code == 200
    assert "results" in res.json()


def test_member_role_rbac_boundary():
    # Regular member should be blocked from audit logs and finance budgets
    mem_res = client.post("/api/v1/auth/json-login", json={"email": "member1@technoclub.org", "password": "TechnoClub@2026"})
    token = mem_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Audit logs: Member must be blocked with 403
    audit_res = client.get("/api/v1/audit/", headers=headers)
    assert audit_res.status_code == 403

    # Finance budgets: Member must be blocked with 403
    fin_res = client.get("/api/v1/finance/budgets", headers=headers)
    assert fin_res.status_code == 403
