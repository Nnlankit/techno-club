import uuid
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_token(email: str, password: str = "TechnoClub@2026") -> str:
    res = client.post("/api/v1/auth/json-login", json={"email": email, "password": password})
    return res.json()["access_token"]


def test_root_status():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "Techno Club" in data["platform"]


def test_login_president():
    response = client.post(
        "/api/v1/auth/json-login",
        json={"email": "president@technoclub.org", "password": "TechnoClub@2026"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"]["name"] == "President"
    assert data["user"]["email"] == "president@technoclub.org"


def test_demo_switch():
    # Test switching to VP
    response = client.post("/api/v1/auth/demo-switch/vp")
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"]["name"] == "Vice President"
    assert data["user"]["email"] == "vp@technoclub.org"

    # Test switching to Member
    response = client.post("/api/v1/auth/demo-switch/member")
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"]["name"] == "Member"


def test_get_domains():
    response = client.get("/api/v1/domains/")
    assert response.status_code == 200
    domains = response.json()
    assert len(domains) >= 10
    codes = [d["code"] for d in domains]
    assert "AIML" in codes
    assert "WEB" in codes
    assert "CYBER" in codes


def test_get_events():
    response = client.get("/api/v1/events/")
    assert response.status_code == 200
    events = response.json()
    assert len(events) >= 1
    assert any("Technovate" in e["name"] or "Agentic AI" in e["name"] for e in events)


def test_get_hackathons_and_leaderboard():
    response = client.get("/api/v1/hackathons/")
    assert response.status_code == 200
    hacks = response.json()
    assert len(hacks) >= 1
    hack_id = hacks[0]["id"]

    # Leaderboard
    lb_response = client.get(f"/api/v1/hackathons/{hack_id}/leaderboard")
    assert lb_response.status_code == 200
    leaderboard = lb_response.json()
    assert len(leaderboard) >= 1
    assert leaderboard[0]["total_score"] > 0


def test_approval_workflow():
    # Login as President to fetch proposals
    login_res = client.post("/api/v1/auth/demo-switch/president")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    props_res = client.get("/api/v1/approvals/", headers=headers)
    assert props_res.status_code == 200
    props = props_res.json()
    assert len(props) >= 1


def test_certificate_verification():
    # Test valid certificate
    verify_res = client.get("/api/v1/certificates/verify/8f92a10b4c6e4d28a3f120e87b9c1d34")
    assert verify_res.status_code == 200
    data = verify_res.json()
    assert data["valid"] is True
    assert "Rohan Verma" in data["recipient_name"]

    # Test invalid certificate
    invalid_res = client.get("/api/v1/certificates/verify/INVALID-TOKEN-999")
    assert invalid_res.status_code == 200
    inv_data = invalid_res.json()
    assert inv_data["valid"] is False


def test_executive_reports():
    login_res = client.post("/api/v1/auth/demo-switch/president")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/api/v1/reports/executive", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_members"] >= 5
    assert data["total_domains"] >= 10
    assert len(data["domain_distribution"]) >= 10
    assert len(data["task_status_distribution"]) >= 1


def test_global_search():
    response = client.get("/api/v1/search/?q=Techno")
    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] >= 1


def test_get_current_user_profile():
    # Login as Member
    login_res = client.post("/api/v1/auth/demo-switch/member")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["email"] == "member1@technoclub.org"
    assert "skills" in user_data
    assert "status" in user_data
    assert "active_projects_count" in user_data


def test_update_profile():
    login_res = client.post("/api/v1/auth/demo-switch/member")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    update_payload = {
        "full_name": "Arjun Patel Updated",
        "phone": "+91 98765 43210",
        "department": "Computer Science & Engineering",
        "year_semester": "4th Year, Sem 7",
        "bio": "Full-stack developer and AI researcher at Techno Club.",
        "skills": ["Python", "FastAPI", "React", "TypeScript", "Docker"],
        "github_url": "https://github.com/arjunpatel",
        "linkedin_url": "https://linkedin.com/in/arjunpatel"
    }

    res = client.put("/api/v1/auth/profile", json=update_payload, headers=headers)
    assert res.status_code == 200
    updated = res.json()
    assert updated["full_name"] == "Arjun Patel Updated"
    assert updated["phone"] == "+91 98765 43210"
    assert "Docker" in updated["skills"]
    assert updated["bio"] == "Full-stack developer and AI researcher at Techno Club."


def test_password_change_flow():
    # Test with treasurer demo user
    login_res = client.post("/api/v1/auth/demo-switch/treasurer")
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Invalid current password
    bad_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "WrongPassword123", "new_password": "NewSecretPassword@2026", "confirm_password": "NewSecretPassword@2026"},
        headers=headers
    )
    assert bad_res.status_code == 400
    assert "Current password is incorrect" in bad_res.json()["detail"]

    # 2. Too short password
    short_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "TechnoClub@2026", "new_password": "short", "confirm_password": "short"},
        headers=headers
    )
    assert short_res.status_code == 400
    assert "at least 8 characters" in short_res.json()["detail"]

    # 3. Mismatched passwords
    mismatch_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "TechnoClub@2026", "new_password": "ValidPassword@2026", "confirm_password": "DifferentPassword@2026"},
        headers=headers
    )
    assert mismatch_res.status_code == 400
    assert "confirmation password do not match" in mismatch_res.json()["detail"]

    # 4. Successful password change
    success_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "TechnoClub@2026", "new_password": "Treasurer@Updated2026", "confirm_password": "Treasurer@Updated2026"},
        headers=headers
    )
    assert success_res.status_code == 200
    assert success_res.json()["success"] is True

    # 5. Verify login with new password works
    relogin_res = client.post(
        "/api/v1/auth/json-login",
        json={"email": "treasurer@technoclub.org", "password": "Treasurer@Updated2026"}
    )
    assert relogin_res.status_code == 200

    # 6. Verify security logs record the change
    new_token = relogin_res.json()["access_token"]
    logs_res = client.get("/api/v1/auth/security-logs", headers={"Authorization": f"Bearer {new_token}"})
    assert logs_res.status_code == 200
    logs = logs_res.json()
    assert len(logs) >= 1
    assert any("CHANGE_PASSWORD" in l["action"] for l in logs)

    # Revert password back so other tests/logins keep working smoothly
    revert_res = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "Treasurer@Updated2026", "new_password": "TechnoClub@2026", "confirm_password": "TechnoClub@2026"},
        headers={"Authorization": f"Bearer {new_token}"}
    )
    assert revert_res.status_code == 200


def test_user_creation_hierarchy_and_permissions():
    # 1. Member cannot create users
    member_token = get_token("member1@technoclub.org")
    member_headers = {"Authorization": f"Bearer {member_token}"}
    
    allowed_res = client.get("/api/v1/users/allowed-roles", headers=member_headers)
    assert allowed_res.status_code == 200
    assert allowed_res.json() == []

    create_fail = client.post(
        "/api/v1/users/",
        json={"full_name": "Unauthorized User", "email": "unauth@technoclub.org", "password": "Password@123", "role": "Member", "domain_id": 1},
        headers=member_headers
    )
    assert create_fail.status_code == 403

    # 2. VP permissions
    vp_token = get_token("vp@technoclub.org")
    vp_headers = {"Authorization": f"Bearer {vp_token}"}

    vp_allowed = client.get("/api/v1/users/allowed-roles", headers=vp_headers)
    assert vp_allowed.status_code == 200
    assert set(vp_allowed.json()) == {"Domain Head", "Member"}

    # VP cannot create President
    vp_create_pres = client.post(
        "/api/v1/users/",
        json={"full_name": "Fake Pres", "email": "fake.pres@technoclub.org", "password": "Password@123", "role": "President"},
        headers=vp_headers
    )
    assert vp_create_pres.status_code == 403

    # 3. President permissions
    pres_token = get_token("president@technoclub.org")
    pres_headers = {"Authorization": f"Bearer {pres_token}"}

    pres_allowed = client.get("/api/v1/users/allowed-roles", headers=pres_headers)
    assert pres_allowed.status_code == 200
    assert set(pres_allowed.json()) == {"Vice President", "Domain Head", "Member"}

    # President cannot create Super Admin
    pres_create_sa = client.post(
        "/api/v1/users/",
        json={"full_name": "Fake SA", "email": "fake.sa@technoclub.org", "password": "Password@123", "role": "Super Admin"},
        headers=pres_headers
    )
    assert pres_create_sa.status_code == 403

    # 4. Validation: Password < 8 characters
    short_pw = client.post(
        "/api/v1/users/",
        json={"full_name": "Short Pw User", "email": "shortpw@technoclub.org", "password": "123", "role": "Member", "domain_id": 1},
        headers=pres_headers
    )
    assert short_pw.status_code == 400
    assert "at least 8 characters" in short_pw.json()["detail"]

    # 5. Validation: Member requires Domain
    no_domain = client.post(
        "/api/v1/users/",
        json={"full_name": "No Domain Member", "email": "nodomain@technoclub.org", "password": "ValidPassword@123", "role": "Member"},
        headers=pres_headers
    )
    assert no_domain.status_code == 400
    assert "Domain is required" in no_domain.json()["detail"]

    # 6. Reporting options query
    reports_res = client.get("/api/v1/users/reports-to-options?role=Member&domain_id=1", headers=pres_headers)
    assert reports_res.status_code == 200
    assert len(reports_res.json()) >= 1
    assert any(o["role"] == "Domain Head" for o in reports_res.json())

    # 7. Successful creation of a Domain Head by President
    unique_email = f"test.newdh.{uuid.uuid4().hex[:8]}@technoclub.org"
    create_res = client.post(
        "/api/v1/users/",
        json={
            "full_name": "Test New Domain Head",
            "email": unique_email,
            "password": "SecurePassword@2026",
            "role": "Domain Head",
            "domain_id": 4,  # Cloud & DevOps
            "designation": "Cloud Lead"
        },
        headers=pres_headers
    )
    assert create_res.status_code == 201
    created_dh = create_res.json()
    assert created_dh["full_name"] == "Test New Domain Head"
    assert created_dh["email"] == unique_email
    assert created_dh["role_name"] == "Domain Head"
    assert created_dh["reports_to_name"] is not None

    # 8. Duplicate email rejection
    dup_res = client.post(
        "/api/v1/users/",
        json={
            "full_name": "Duplicate User",
            "email": unique_email,
            "password": "SecurePassword@2026",
            "role": "Member",
            "domain_id": 1
        },
        headers=pres_headers
    )
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]


def test_president_and_vp_project_edit_and_add_members():
    pres_token = get_token("president@technoclub.org")
    vp_token = get_token("vp@technoclub.org")
    pres_headers = {"Authorization": f"Bearer {pres_token}"}
    vp_headers = {"Authorization": f"Bearer {vp_token}"}

    # 1. President creates a new project without members
    create_res = client.post(
        "/api/v1/projects/",
        json={
            "name": f"Autonomous Drone Project {uuid.uuid4().hex[:6]}",
            "description": "Initial design phase",
            "domain_id": 1,
            "status": "Planning",
            "priority": "High"
        },
        headers=pres_headers
    )
    assert create_res.status_code == 200
    proj = create_res.json()
    proj_id = proj["id"]
    assert len(proj["members"]) == 0

    # 2. Vice President edits the project details
    update_res = client.put(
        f"/api/v1/projects/{proj_id}",
        json={
            "description": "Updated roadmap by VP",
            "status": "Active"
        },
        headers=vp_headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["description"] == "Updated roadmap by VP"
    assert update_res.json()["status"] == "Active"

    # 3. Vice President adds a member to the project after creation
    # Get an existing member ID
    members_res = client.get("/api/v1/members/", headers=vp_headers)
    assert members_res.status_code == 200
    target_member = members_res.json()[0]
    target_member_id = target_member["id"]

    add_res = client.post(
        f"/api/v1/projects/{proj_id}/members",
        json={
            "member_id": target_member_id,
            "role_in_project": "AI Lead"
        },
        headers=vp_headers
    )
    assert add_res.status_code == 200
    updated_proj = add_res.json()
    assert len(updated_proj["members"]) == 1
    assert updated_proj["members"][0]["member_id"] == target_member_id
    assert updated_proj["members"][0]["role_in_project"] == "AI Lead"

    # 4. Vice President removes the member from the project
    del_member_res = client.delete(
        f"/api/v1/projects/{proj_id}/members/{target_member_id}",
        headers=vp_headers
    )
    assert del_member_res.status_code == 200
    assert len(del_member_res.json()["members"]) == 0

    # 5. President deletes the project
    del_proj_res = client.delete(f"/api/v1/projects/{proj_id}", headers=pres_headers)
    assert del_proj_res.status_code == 200
    assert "successfully deleted" in del_proj_res.json()["message"]


def test_president_and_vp_crud_and_guards():
    pres_token = get_token("president@technoclub.org")
    pres_headers = {"Authorization": f"Bearer {pres_token}"}
    vp_token = get_token("vp@technoclub.org")
    vp_headers = {"Authorization": f"Bearer {vp_token}"}
    admin_token = get_token("admin@technoclub.org")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Vice President cannot delete or edit Super Admin account
    # Find super admin member id
    members_res = client.get("/api/v1/members/", headers=admin_headers)
    assert members_res.status_code == 200
    admin_member = next(m for m in members_res.json() if m["email"] == "admin@technoclub.org")
    admin_member_id = admin_member["id"]

    # VP tries to delete Super Admin -> 403
    vp_del_admin = client.delete(f"/api/v1/members/{admin_member_id}", headers=vp_headers)
    assert vp_del_admin.status_code == 403

    # VP tries to update Super Admin -> 403
    vp_edit_admin = client.put(f"/api/v1/members/{admin_member_id}", json={"full_name": "Hacked Admin"}, headers=vp_headers)
    assert vp_edit_admin.status_code == 403

    # President tries to delete Super Admin -> 403
    pres_del_admin = client.delete(f"/api/v1/members/{admin_member_id}", headers=pres_headers)
    assert pres_del_admin.status_code == 403

    # 2. Events: President creates, VP duplicates, VP edits, Pres deletes
    ev_res = client.post(
        "/api/v1/events/",
        json={
            "name": "Test Leadership Tech Workshop",
            "event_type": "Workshop",
            "description": "Workshop on Cloud & AI",
            "start_time": "2026-10-15T10:00:00Z",
            "end_time": "2026-10-15T13:00:00Z",
            "venue": "Seminar Hall A",
            "capacity": 80,
            "status": "Draft"
        },
        headers=pres_headers
    )
    assert ev_res.status_code == 200
    ev_id = ev_res.json()["id"]

    # VP duplicates event
    dup_res = client.post(f"/api/v1/events/{ev_id}/duplicate", headers=vp_headers)
    assert dup_res.status_code == 200
    dup_id = dup_res.json()["id"]
    assert dup_res.json()["name"] == "Copy of Test Leadership Tech Workshop"

    # VP edits duplicated event
    edit_ev = client.put(f"/api/v1/events/{dup_id}", json={"venue": "Virtual Room 1"}, headers=vp_headers)
    assert edit_ev.status_code == 200
    assert edit_ev.json()["venue"] == "Virtual Room 1"

    # President archives/deletes events
    del_ev1 = client.delete(f"/api/v1/events/{ev_id}", headers=pres_headers)
    assert del_ev1.status_code == 200
    del_ev2 = client.delete(f"/api/v1/events/{dup_id}", headers=vp_headers)
    assert del_ev2.status_code == 200

    # 3. Tasks: VP creates task, updates task, deletes task
    task_res = client.post(
        "/api/v1/tasks/",
        json={
            "title": "Setup Venue Projectors",
            "description": "Test description",
            "priority": "High",
            "status": "Todo"
        },
        headers=vp_headers
    )
    assert task_res.status_code == 200
    task_id = task_res.json()["id"]

    update_task_res = client.put(f"/api/v1/tasks/{task_id}", json={"priority": "Urgent"}, headers=pres_headers)
    assert update_task_res.status_code == 200
    assert update_task_res.json()["priority"] == "Urgent"

    del_task_res = client.delete(f"/api/v1/tasks/{task_id}", headers=vp_headers)
    assert del_task_res.status_code == 200

    # 4. Announcements: President creates, VP updates, Pres deletes
    ann_res = client.post(
        "/api/v1/announcements/",
        json={
            "title": "General Body Meeting Reminder",
            "content": "Please attend the GBM on Saturday at 4 PM in Auditorium.",
            "priority": "High"
        },
        headers=pres_headers
    )
    assert ann_res.status_code == 200
    ann_id = ann_res.json()["id"]

    edit_ann_res = client.put(f"/api/v1/announcements/{ann_id}", json={"title": "Updated: GBM Rescheduled"}, headers=vp_headers)
    assert edit_ann_res.status_code == 200
    assert edit_ann_res.json()["title"] == "Updated: GBM Rescheduled"

    del_ann_res = client.delete(f"/api/v1/announcements/{ann_id}", headers=pres_headers)
    assert del_ann_res.status_code == 200

    # 5. Resources: Add, return, delete
    res_post = client.post(
        "/api/v1/resources/",
        json={
            "name": "Test LoRa Gateway Kit",
            "category": "Physical",
            "resource_type": "Hardware Kit",
            "identifier": f"TEST-LORA-{uuid.uuid4().hex[:4]}",
            "quantity": 2,
            "status": "Available"
        },
        headers=pres_headers
    )
    assert res_post.status_code == 200
    res_id = res_post.json()["id"]

    return_res = client.post(f"/api/v1/resources/{res_id}/return", headers=vp_headers)
    assert return_res.status_code == 200

    del_res = client.delete(f"/api/v1/resources/{res_id}", headers=vp_headers)
    assert del_res.status_code == 200

    # 6. Sponsors: Create, update, delete
    sp_post = client.post(
        "/api/v1/sponsors/",
        json={
            "company_name": "Test Corp Cloud",
            "contact_person": "Jane Doe",
            "email": "jane@testcorpcloud.com",
            "tier": "Gold",
            "stage": "Negotiation",
            "amount": 25000
        },
        headers=pres_headers
    )
    assert sp_post.status_code == 200
    sp_id = sp_post.json()["id"]

    sp_put = client.put(f"/api/v1/sponsors/{sp_id}", json={"stage": "Confirmed"}, headers=vp_headers)
    assert sp_put.status_code == 200
    assert sp_put.json()["stage"] == "Confirmed"

    sp_del = client.delete(f"/api/v1/sponsors/{sp_id}", headers=pres_headers)
    assert sp_del.status_code == 200

    # 7. VP cannot delete President
    pres_member = next((m for m in members_res.json() if m["email"] == "president@technoclub.org"), None)
    if pres_member:
        vp_del_pres = client.delete(f"/api/v1/members/{pres_member['id']}", headers=vp_headers)
        assert vp_del_pres.status_code == 403


def test_notifications_features():
    token = get_token("president@technoclub.org")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch user notifications
    res = client.get("/api/v1/notifications/", headers=headers)
    assert res.status_code == 200
    assert isinstance(res.json(), list)

    # 2. Add a test notification in database
    from app.core.database import SessionLocal
    from app.models.operations import Notification
    from app.models.user_role import User

    db = SessionLocal()
    user = db.query(User).filter(User.email == "president@technoclub.org").first()
    test_notif = Notification(
        user_id=user.id,
        title="Test Notification Urgent Action",
        message="Please review pending tasks for hackathon",
        type="Task",
        entity_type="task",
        entity_id=1,
        is_read=False,
        priority="Urgent"
    )
    db.add(test_notif)
    db.commit()
    db.refresh(test_notif)
    notif_id = test_notif.id
    db.close()

    try:
        # 3. Test filtering by is_read=false
        res_unread = client.get("/api/v1/notifications/?is_read=false", headers=headers)
        assert res_unread.status_code == 200
        unread_ids = [n["id"] for n in res_unread.json()]
        assert notif_id in unread_ids

        # 4. Test search filter
        res_search = client.get("/api/v1/notifications/?search=Urgent Action", headers=headers)
        assert res_search.status_code == 200
        assert any(n["id"] == notif_id for n in res_search.json())

        # 5. Mark as read
        res_read = client.put(f"/api/v1/notifications/{notif_id}/read", headers=headers)
        assert res_read.status_code == 200
        assert res_read.json()["is_read"] is True

        # 6. Mark as unread
        res_unread_toggle = client.put(f"/api/v1/notifications/{notif_id}/unread", headers=headers)
        assert res_unread_toggle.status_code == 200
        assert res_unread_toggle.json()["is_read"] is False

        # 7. Mark all read
        res_all_read = client.put("/api/v1/notifications/read-all", headers=headers)
        assert res_all_read.status_code == 200

        # Verify it is now read
        res_check = client.get("/api/v1/notifications/?is_read=true", headers=headers)
        assert res_check.status_code == 200
        read_ids = [n["id"] for n in res_check.json()]
        assert notif_id in read_ids

        # 8. Delete the specific notification
        res_del = client.delete(f"/api/v1/notifications/{notif_id}", headers=headers)
        assert res_del.status_code == 200

        # 9. Clear-all endpoint responds 200
        res_clear = client.delete("/api/v1/notifications/clear-all?only_read=true", headers=headers)
        assert res_clear.status_code == 200
    finally:
        db = SessionLocal()
        db.query(Notification).filter(Notification.id == notif_id).delete()
        db.commit()
        db.close()


