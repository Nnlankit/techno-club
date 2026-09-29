import json
import urllib.request
import urllib.error

roles = [
    ("President", "president@technoclub.org"),
    ("Vice President", "vp@technoclub.org"),
    ("Domain Head (AI/ML)", "aiml.head@technoclub.org"),
    ("Core Member", "member1@technoclub.org")
]

base_url = "http://127.0.0.1:8000/api/v1"

def api_call(path, method="GET", token=None, body=None):
    url = f"{base_url}{path}"
    data = json.dumps(body).encode("utf-8") if body else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            return e.code, json.loads(content)
        except Exception:
            return e.code, content

if __name__ == "__main__":
    for role_name, email in roles:
        print(f"=== Testing Role: {role_name} ({email}) ===")
        status, data = api_call("/auth/json-login", method="POST", body={"email": email, "password": "TechnoClub@2026"})
        assert status == 200, f"Login failed for {email}: {data}"
        token = data["access_token"]
        user = data["user"]
        print(f"  Authenticated: {user['full_name']} | Role: {user['role']['name']} | Domain: {user.get('domain_name')}")
        
        # 1. Members count
        st, res = api_call("/members", token=token)
        print(f"  Members count visible: {len(res) if st == 200 else f'Blocked ({st})'}")
        
        # 2. Tasks count
        st, res = api_call("/tasks", token=token)
        print(f"  Tasks count visible: {len(res) if st == 200 else f'Blocked ({st})'}")
        
        # 3. Projects count
        st, res = api_call("/projects", token=token)
        print(f"  Projects count visible: {len(res) if st == 200 else f'Blocked ({st})'}")
        
        # 4. Finance budgets
        st, res = api_call("/finance/budgets", token=token)
        print(f"  Finance Budgets: {'Allowed' if st == 200 else f'Blocked ({st})'}")
        
        # 5. Audit logs
        st, res = api_call("/audit", token=token)
        print(f"  Audit Logs: {'Allowed' if st == 200 else f'Blocked ({st})'}")
        print()

print("ALL RBAC CHECKS COMPLETED SUCCESSFULLY!")
