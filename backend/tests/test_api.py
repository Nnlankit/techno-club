import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


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
    response = client.get("/api/v1/reports/executive")
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
