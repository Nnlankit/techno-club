import json
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user_role import Role, Permission, User, role_permissions
from app.models.member_domain import Domain, Member
from app.models.event_hackathon import (
    Event, EventRegistration, EventAttendance, 
    Hackathon, HackathonTeam, HackathonSubmission
)
from app.models.project_task import Project, ProjectMember, Task, TaskComment, Activity
from app.models.operations import (
    ApprovalProposal, Meeting, Resource, ResourceAssignment, 
    Budget, Expense, Sponsor, Certificate, Achievement, 
    Announcement, Notification, Document, AuditLog
)


def init_db(db: Session) -> None:
    # 1. Create Roles if not present
    roles_data = [
        {"name": "President", "description": "Full club-level executive control, approvals, analytics, and leadership", "is_system_role": True},
        {"name": "Vice President", "description": "Operational management, coordination, task monitoring, and approval review", "is_system_role": True},
        {"name": "Domain Head", "description": "Domain-level lead managing domain projects, tasks, resources, and members", "is_system_role": True},
        {"name": "Member", "description": "Club member with access to assigned tasks, projects, events, achievements", "is_system_role": True},
        {"name": "Faculty Coordinator", "description": "Faculty advisor monitoring governance, permissions, and official reports", "is_system_role": False},
        {"name": "Treasurer", "description": "Finance and budget management, expenses, reimbursements, sponsorships", "is_system_role": False},
        {"name": "Technical Lead", "description": "Architecture, technical roadmaps, and cross-domain project supervision", "is_system_role": False},
    ]

    roles = {}
    for r in roles_data:
        role_obj = db.query(Role).filter(Role.name == r["name"]).first()
        if not role_obj:
            role_obj = Role(**r)
            db.add(role_obj)
            db.flush()
        roles[r["name"]] = role_obj

    # 2. Permissions
    permissions_list = [
        ("events:view", "View events", "events"),
        ("events:create", "Create events", "events"),
        ("events:edit", "Edit events", "events"),
        ("events:approve", "Approve events", "events"),
        ("events:delete", "Delete events", "events"),
        ("members:view", "View members", "members"),
        ("members:create", "Create members", "members"),
        ("members:edit", "Edit members", "members"),
        ("members:delete", "Delete members", "members"),
        ("domains:view", "View domains", "domains"),
        ("domains:manage", "Manage domains", "domains"),
        ("projects:view", "View projects", "projects"),
        ("projects:create", "Create projects", "projects"),
        ("projects:edit", "Edit projects", "projects"),
        ("tasks:view", "View tasks", "tasks"),
        ("tasks:create", "Create tasks", "tasks"),
        ("tasks:edit", "Edit tasks", "tasks"),
        ("hackathons:manage", "Manage hackathons", "hackathons"),
        ("hackathons:judge", "Judge hackathon submissions", "hackathons"),
        ("approvals:submit", "Submit proposals", "approvals"),
        ("approvals:review", "Review proposals", "approvals"),
        ("approvals:president", "Presidential approval", "approvals"),
        ("finance:manage", "Manage finances and expenses", "finance"),
        ("resources:manage", "Manage hardware/software resources", "resources"),
        ("certificates:issue", "Issue verifiable certificates", "certificates"),
        ("audit:view", "View audit trail logs", "audit"),
        ("reports:view", "View reports and analytics", "reports"),
    ]

    perms_dict = {}
    for code, name, module in permissions_list:
        perm = db.query(Permission).filter(Permission.code == code).first()
        if not perm:
            perm = Permission(code=code, name=name, module=module)
            db.add(perm)
            db.flush()
        perms_dict[code] = perm

    # Assign all permissions to President
    roles["President"].permissions = list(perms_dict.values())
    
    # VP has operational permissions
    vp_perm_codes = [c for c, _, _ in permissions_list if c not in ["members:delete", "approvals:president"]]
    roles["Vice President"].permissions = [perms_dict[c] for c in vp_perm_codes]

    # Domain Head
    dh_perm_codes = ["events:view", "events:create", "events:edit", "members:view", "domains:view", 
                     "projects:view", "projects:create", "projects:edit", "tasks:view", "tasks:create", 
                     "tasks:edit", "hackathons:manage", "hackathons:judge", "approvals:submit", 
                     "approvals:review", "resources:manage", "reports:view"]
    roles["Domain Head"].permissions = [perms_dict[c] for c in dh_perm_codes if c in perms_dict]

    # Member
    member_perm_codes = ["events:view", "members:view", "domains:view", "projects:view", "tasks:view", "approvals:submit"]
    roles["Member"].permissions = [perms_dict[c] for c in member_perm_codes if c in perms_dict]

    # Treasurer
    treasurer_perm_codes = ["finance:manage", "events:view", "approvals:review", "reports:view"]
    roles["Treasurer"].permissions = [perms_dict[c] for c in treasurer_perm_codes if c in perms_dict]

    db.commit()

    # 3. Create Domains
    domains_data = [
        {"name": "AI & Machine Learning", "code": "AIML", "description": "Computer Vision, NLP, LLMs, Deep Learning, and Autonomous Agents.", "icon": "Brain", "color": "#6366F1"},
        {"name": "Web Development", "code": "WEB", "description": "Modern full-stack web engineering, scalable microservices, and reactive UIs.", "icon": "Globe", "color": "#0EA5E9"},
        {"name": "Cyber Security", "code": "CYBER", "description": "Ethical hacking, penetration testing, cryptography, and network defense.", "icon": "ShieldCheck", "color": "#EF4444"},
        {"name": "Cloud & DevOps", "code": "CLOUD", "description": "Kubernetes, Docker, CI/CD pipelines, Terraform, and cloud infrastructure.", "icon": "Cloud", "color": "#8B5CF6"},
        {"name": "IoT & Robotics", "code": "IOT", "description": "Embedded microcontrollers, robotics, sensor telemetry, and hardware prototypes.", "icon": "Cpu", "color": "#F59E0B"},
        {"name": "Competitive Programming", "code": "CP", "description": "Advanced algorithms, data structures, Codeforces, and ICPC training.", "icon": "Terminal", "color": "#10B981"},
        {"name": "App Development", "code": "APP", "description": "Mobile app engineering using Flutter, React Native, iOS, and Android.", "icon": "Smartphone", "color": "#EC4899"},
        {"name": "Design & UI/UX", "code": "UIUX", "description": "Design systems, user experience research, Figma prototyping, and brand identity.", "icon": "Palette", "color": "#F97316"},
        {"name": "Blockchain & Web3", "code": "BLOCKCHAIN", "description": "Smart contracts, decentralized apps, cryptographic ledgers, and zero-knowledge proofs.", "icon": "Box", "color": "#14B8A6"},
        {"name": "Research & Innovation", "code": "RESEARCH", "description": "Academic papers, patents, technical publications, and exploratory research.", "icon": "BookOpen", "color": "#84CC16"},
    ]

    domains = {}
    for d in domains_data:
        dom = db.query(Domain).filter(Domain.code == d["code"]).first()
        if not dom:
            dom = Domain(**d)
            db.add(dom)
            db.flush()
        domains[d["code"]] = dom

    db.commit()

    # 4. Create Users & Members
    default_pw_hash = get_password_hash("TechnoClub@2026")

    users_seed = [
        {
            "email": "president@technoclub.org",
            "full_name": "Aarav Sharma",
            "college_id": "2023CS0101",
            "role": "President",
            "role_title": "Club President",
            "dept": "Computer Science & Engineering",
            "year": "4th Year / 7th Sem",
            "domain": "WEB",
            "skills": ["Leadership", "Full-Stack Dev", "System Architecture", "Cloud", "Public Speaking"],
            "bio": "President of Techno Club. Leading technical initiatives, hackathons, and strategic collaborations.",
            "is_superuser": True
        },
        {
            "email": "vp@technoclub.org",
            "full_name": "Priya Patel",
            "college_id": "2023IT0204",
            "role": "Vice President",
            "role_title": "Vice President - Operations",
            "dept": "Information Technology",
            "year": "4th Year / 7th Sem",
            "domain": "AIML",
            "skills": ["Operations", "Project Management", "Machine Learning", "Event Coordination"],
            "bio": "Vice President overseeing operational workflows, project delivery, and cross-domain synergy.",
            "is_superuser": False
        },
        {
            "email": "aiml.head@technoclub.org",
            "full_name": "Rohan Verma",
            "college_id": "2024CS0312",
            "role": "Domain Head",
            "role_title": "Head of AI & Machine Learning",
            "dept": "Computer Science & Engineering",
            "year": "3rd Year / 5th Sem",
            "domain": "AIML",
            "skills": ["PyTorch", "TensorFlow", "Computer Vision", "LLMs", "NLP"],
            "bio": "Directing AI/ML workshops, deep learning research projects, and national hackathon challenges.",
            "is_superuser": False
        },
        {
            "email": "web.head@technoclub.org",
            "full_name": "Ananya Sen",
            "college_id": "2024CS0418",
            "role": "Domain Head",
            "role_title": "Head of Web Development",
            "dept": "Computer Science & Engineering",
            "year": "3rd Year / 5th Sem",
            "domain": "WEB",
            "skills": ["React", "TypeScript", "Node.js", "FastAPI", "PostgreSQL", "Next.js"],
            "bio": "Leading web application developments and mentor for modern frontend/backend engineering.",
            "is_superuser": False
        },
        {
            "email": "cyber.head@technoclub.org",
            "full_name": "Vikram Nair",
            "college_id": "2024EC0521",
            "role": "Domain Head",
            "role_title": "Head of Cyber Security",
            "dept": "Electronics & Communication",
            "year": "3rd Year / 5th Sem",
            "domain": "CYBER",
            "skills": ["Network Security", "Reverse Engineering", "Wireshark", "Metasploit", "Cryptography"],
            "bio": "Organizing CTF competitions, security audits, and defensive cyber workshops.",
            "is_superuser": False
        },
        {
            "email": "treasurer@technoclub.org",
            "full_name": "Neha Reddy",
            "college_id": "2024IT0630",
            "role": "Treasurer",
            "role_title": "Club Treasurer & Finance Head",
            "dept": "Information Technology",
            "year": "3rd Year / 5th Sem",
            "domain": "BLOCKCHAIN",
            "skills": ["Financial Budgeting", "Auditing", "Sponsorship Coordination", "Excel Modeling"],
            "bio": "Managing club budgets, vendor settlements, sponsorships, and reimbursements.",
            "is_superuser": False
        },
        {
            "email": "faculty@technoclub.org",
            "full_name": "Dr. K. Ramanathan",
            "college_id": "FAC-CSE-012",
            "role": "Faculty Coordinator",
            "role_title": "Faculty Advisor & Professor",
            "dept": "Computer Science & Engineering",
            "year": "Faculty",
            "domain": "RESEARCH",
            "skills": ["Academic Research", "Distributed Systems", "Grant Advisory", "Mentorship"],
            "bio": "Faculty Advisor providing academic mentorship, institutional governance, and research grants.",
            "is_superuser": False
        },
        {
            "email": "member1@technoclub.org",
            "full_name": "Sneha Kulkarni",
            "college_id": "2025CS0715",
            "role": "Member",
            "role_title": "Core Member - AI/ML",
            "dept": "Computer Science & Engineering",
            "year": "2nd Year / 3rd Sem",
            "domain": "AIML",
            "skills": ["Python", "Pandas", "Scikit-Learn", "FastAPI"],
            "bio": "Passionate about generative AI models and data analytics.",
            "is_superuser": False
        },
        {
            "email": "member2@technoclub.org",
            "full_name": "Devansh Gupta",
            "college_id": "2025IT0822",
            "role": "Member",
            "role_title": "Core Member - Web Dev",
            "dept": "Information Technology",
            "year": "2nd Year / 3rd Sem",
            "domain": "WEB",
            "skills": ["React", "Tailwind CSS", "JavaScript", "REST APIs"],
            "bio": "Frontend developer building responsive UI components and interactive web apps.",
            "is_superuser": False
        }
    ]

    members_map = {}
    for u in users_seed:
        user_obj = db.query(User).filter(User.email == u["email"]).first()
        if not user_obj:
            user_obj = User(
                email=u["email"],
                hashed_password=default_pw_hash,
                role_id=roles[u["role"]].id,
                is_superuser=u["is_superuser"]
            )
            db.add(user_obj)
            db.flush()

            member_obj = Member(
                user_id=user_obj.id,
                college_id=u["college_id"],
                full_name=u["full_name"],
                email=u["email"],
                phone="+91 98765 43210",
                department=u["dept"],
                year_semester=u["year"],
                domain_id=domains[u["domain"]].id if u["domain"] in domains else None,
                role_title=u["role_title"],
                skills=json.dumps(u["skills"]),
                bio=u["bio"],
                status="Active",
                avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={u['full_name'].replace(' ', '')}"
            )
            db.add(member_obj)
            db.flush()
            members_map[u["email"]] = member_obj
        else:
            members_map[u["email"]] = user_obj.member

    # Set Domain Heads
    if "aiml.head@technoclub.org" in members_map:
        domains["AIML"].head_id = members_map["aiml.head@technoclub.org"].id
    if "web.head@technoclub.org" in members_map:
        domains["WEB"].head_id = members_map["web.head@technoclub.org"].id
    if "cyber.head@technoclub.org" in members_map:
        domains["CYBER"].head_id = members_map["cyber.head@technoclub.org"].id

    db.commit()

    # 5. Seed Events
    now = datetime.now(timezone.utc)
    if not db.query(Event).first():
        events_data = [
            {
                "name": "Technovate 2026: National Technical Fest",
                "event_type": "Technical Fest",
                "description": "The flagship annual tech fest featuring hackathons, robotics arenas, paper presentations, coding sprints, and esports.",
                "domain_id": None,
                "organizer_id": members_map["president@technoclub.org"].id,
                "start_time": now + timedelta(days=20),
                "end_time": now + timedelta(days=22),
                "venue": "Main College Auditorium & Innovation Labs",
                "capacity": 1000,
                "registration_deadline": now + timedelta(days=15),
                "budget": 250000.0,
                "status": "Approved",
                "speakers": json.dumps([{"name": "Dr. Sundar Pillai", "org": "Google Cloud", "topic": "Keynote on Frontier Models"}]),
                "judges": json.dumps([{"name": "Prof. R. Mehta", "org": "IIT Bombay"}]),
                "coordinators": json.dumps([{"name": "Aarav Sharma", "role": "Lead Organizer"}]),
                "banner_url": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80"
            },
            {
                "name": "Agentic AI & LLM Systems Hands-On Masterclass",
                "event_type": "Workshop",
                "description": "Comprehensive practical workshop on building autonomous agent workflows using LangChain, LlamaIndex, and Gemini 2.0 Flash APIs.",
                "domain_id": domains["AIML"].id,
                "organizer_id": members_map["aiml.head@technoclub.org"].id,
                "start_time": now + timedelta(days=5, hours=9),
                "end_time": now + timedelta(days=5, hours=17),
                "venue": "Turing Computer Lab (Lab 4)",
                "capacity": 80,
                "registration_deadline": now + timedelta(days=3),
                "budget": 15000.0,
                "status": "Registration Open",
                "speakers": json.dumps([{"name": "Rohan Verma", "org": "Techno Club", "topic": "Tool Use and Multi-Agent Orchestration"}]),
                "banner_url": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1200&q=80"
            },
            {
                "name": "Zero-Trust & Offensive Security Bootcamp",
                "event_type": "Seminar",
                "description": "Deep dive into web application penetration testing, active directory reconnaissance, and modern malware analysis.",
                "domain_id": domains["CYBER"].id,
                "organizer_id": members_map["cyber.head@technoclub.org"].id,
                "start_time": now + timedelta(days=10, hours=10),
                "end_time": now + timedelta(days=10, hours=16),
                "venue": "Seminar Hall B",
                "capacity": 120,
                "registration_deadline": now + timedelta(days=8),
                "budget": 12000.0,
                "status": "Approved",
                "speakers": json.dumps([{"name": "Vikram Nair", "org": "Cyber Domain", "topic": "Buffer Overflows & Privilege Escalation"}]),
                "banner_url": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80"
            },
            {
                "name": "CodeSprint Inter-College Algorithm Clash",
                "event_type": "Coding Contest",
                "description": "Intense 3-hour competitive programming showdown with ICPC-style rules, instant automated grading, and live leaderboards.",
                "domain_id": domains["CP"].id,
                "organizer_id": members_map["vp@technoclub.org"].id,
                "start_time": now + timedelta(days=12, hours=14),
                "end_time": now + timedelta(days=12, hours=17),
                "venue": "Advanced Programming Center",
                "capacity": 150,
                "registration_deadline": now + timedelta(days=11),
                "budget": 20000.0,
                "status": "Approved",
                "banner_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80"
            }
        ]

        for edata in events_data:
            ev = Event(**edata)
            db.add(ev)
        db.commit()

    # 6. Seed Hackathon
    if not db.query(Hackathon).first():
        hackathon = Hackathon(
            title="TechnoHacks 2026: The 36-Hour National Hackathon",
            theme="AI for Social Impact & Sustainable Infrastructure",
            description="Our premier national 36-hour hackathon where top student developers build production-grade solutions across healthcare, smart cities, and edtech.",
            problem_statements=json.dumps([
                {
                    "id": "PS-01",
                    "title": "Decentralized Disaster Telemetry & Offline Mesh Alert System",
                    "domain": "IoT & Cyber",
                    "description": "Develop a lightweight hardware & software mesh network enabling emergency distress signals during network cutoffs."
                },
                {
                    "id": "PS-02",
                    "title": "Autonomous Clinical Diagnostics Copilot for Rural Clinics",
                    "domain": "AI / ML",
                    "description": "Create an offline-first computer vision & speech agent assisting village health workers in diagnosing dermatological and retinal symptoms."
                },
                {
                    "id": "PS-03",
                    "title": "Smart Campus Energy Microgrid Optimization",
                    "domain": "Cloud & IoT",
                    "description": "Predict power load peaks and automate solar battery storage switching across college academic blocks."
                }
            ]),
            rules="1. All code must be authored during the 36-hour window. 2. Git commit history required. 3. Open source licenses only.",
            eligibility="All undergraduate and postgraduate college engineering students.",
            start_date=now + timedelta(days=25),
            end_date=now + timedelta(days=27),
            registration_deadline=now + timedelta(days=18),
            min_team_size=2,
            max_team_size=4,
            status="Registration",
            evaluation_criteria=json.dumps([
                {"criteria": "Technical Complexity & Architecture", "weight": 30, "max_score": 30},
                {"criteria": "Innovation & Originality", "weight": 25, "max_score": 25},
                {"criteria": "Execution & Working Demo", "weight": 25, "max_score": 25},
                {"criteria": "Presentation & UI/UX Polish", "weight": 20, "max_score": 20}
            ]),
            mentors=json.dumps([{"name": "Dr. Ramanathan", "expertise": "Systems Architecture"}, {"name": "Aarav Sharma", "expertise": "DevOps"}]),
            judges=json.dumps([{"name": "Industry CTO Panel", "org": "FinTech & Cloud Inc."}]),
            prizes=json.dumps([
                {"rank": 1, "title": "Grand Winner", "cash": 75000, "perks": "Incubation Support & Cloud Credits"},
                {"rank": 2, "title": "First Runner Up", "cash": 40000, "perks": "Fast-track interviews"},
                {"rank": 3, "title": "Best AI Solution", "cash": 25000, "perks": "Hardware kits"}
            ]),
            banner_url="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80"
        )
        db.add(hackathon)
        db.commit()

        # Seed a registered team and submission
        team = HackathonTeam(
            hackathon_id=hackathon.id,
            name="NeuralPulse",
            team_code="TEAM-NP2026",
            leader_id=members_map["aiml.head@technoclub.org"].id,
            members_info=json.dumps([
                {"name": "Rohan Verma", "role": "Lead & ML", "email": "aiml.head@technoclub.org"},
                {"name": "Sneha Kulkarni", "role": "Data Engineer", "email": "member1@technoclub.org"}
            ]),
            project_name="Offline Clinical Diagnostic Assistant",
            status="Approved"
        )
        db.add(team)
        db.commit()

        submission = HackathonSubmission(
            hackathon_id=hackathon.id,
            team_id=team.id,
            project_title="NeuralPulse: Offline Diagnostics Edge Copilot",
            description="Quantized vision-language model running directly on edge devices with zero cloud dependency to analyze medical radiology scans in remote primary healthcare centers.",
            problem_statement_id="PS-02",
            repo_url="https://github.com/technoclub/neural-pulse-diagnostics",
            demo_url="https://neuralpulse.technoclub.org",
            video_url="https://youtube.com/watch?v=demo123",
            presentation_url="https://docs.google.com/presentation/d/demo",
            total_score=94.5,
            rank=1,
            winner_category="1st Place - Grand Winner",
            judge_feedback="Exceptional execution, quantisation benchmarks verified on Raspberry Pi 5 with impressive 800ms inference times.",
            scores=json.dumps([
                {"judge": "Dr. Ramanathan", "score": 28, "max": 30, "criteria": "Technical Complexity"},
                {"judge": "Dr. Ramanathan", "score": 24, "max": 25, "criteria": "Innovation"},
                {"judge": "Dr. Ramanathan", "score": 24, "max": 25, "criteria": "Working Demo"},
                {"judge": "Dr. Ramanathan", "score": 18.5, "max": 20, "criteria": "Presentation"}
            ])
        )
        db.add(submission)
        db.commit()

    # 7. Seed Projects
    if not db.query(Project).first():
        proj1 = Project(
            name="TechnoClub ERP & Central Operating System",
            description="The unified digital operating platform managing all domains, events, hackathons, finances, members, and audit logs.",
            objective="Eliminate paper approvals, unify student club operations into a centralized cloud platform.",
            domain_id=domains["WEB"].id,
            project_lead_id=members_map["web.head@technoclub.org"].id,
            start_date=now - timedelta(days=30),
            target_date=now + timedelta(days=45),
            status="Active",
            priority="Critical",
            repository_url="https://github.com/technoclub/techno-club-os",
            demo_url="http://localhost:5173",
            milestones=json.dumps([
                {"id": 1, "title": "Architecture & Schema Design", "completed": True, "due": "2026-09-15"},
                {"id": 2, "title": "Auth & RBAC Subsystem", "completed": True, "due": "2026-09-22"},
                {"id": 3, "title": "Event & Hackathon Engine", "completed": True, "due": "2026-09-28"},
                {"id": 4, "title": "QR Verification & Financial Tracking", "completed": False, "due": "2026-10-10"}
            ])
        )
        db.add(proj1)

        proj2 = Project(
            name="Autonomous Campus Delivery & Patrol Rover",
            description="Four-wheel differential drive rover equipped with LiDAR, stereoscopic cameras, and ROS2 navigation stack for autonomous inter-department document delivery.",
            objective="Demonstrate autonomous mobile robot (AMR) SLAM in dynamic college corridors.",
            domain_id=domains["IOT"].id,
            project_lead_id=members_map["president@technoclub.org"].id,
            start_date=now - timedelta(days=60),
            target_date=now + timedelta(days=60),
            status="Active",
            priority="High",
            milestones=json.dumps([
                {"id": 1, "title": "Chassis & Motor Driver Assembly", "completed": True, "due": "2026-08-30"},
                {"id": 2, "title": "ROS2 SLAM Mapping", "completed": True, "due": "2026-09-20"},
                {"id": 3, "title": "Obstacle Avoidance Tuning", "completed": False, "due": "2026-10-15"}
            ])
        )
        db.add(proj2)
        db.commit()

        # Project Members
        db.add(ProjectMember(project_id=proj1.id, member_id=members_map["web.head@technoclub.org"].id, role_in_project="Lead Architect"))
        db.add(ProjectMember(project_id=proj1.id, member_id=members_map["member2@technoclub.org"].id, role_in_project="Frontend Developer"))
        db.add(ProjectMember(project_id=proj2.id, member_id=members_map["president@technoclub.org"].id, role_in_project="Hardware Lead"))
        db.add(ProjectMember(project_id=proj2.id, member_id=members_map["member1@technoclub.org"].id, role_in_project="Computer Vision Engineer"))
        db.commit()

        # 8. Seed Tasks
        tasks_data = [
            {
                "title": "Design interactive multi-tier approval modal with revision feedback",
                "description": "Allow President and VP to review proposals with stage history, line item budgets, and feedback comments.",
                "project_id": proj1.id,
                "domain_id": domains["WEB"].id,
                "assignee_id": members_map["member2@technoclub.org"].id,
                "creator_id": members_map["web.head@technoclub.org"].id,
                "due_date": now + timedelta(days=4),
                "priority": "High",
                "status": "In Progress",
                "subtasks": json.dumps([
                    {"id": "1", "title": "Build approval timeline component", "completed": True},
                    {"id": "2", "title": "Add rejection & revision dialog", "completed": True},
                    {"id": "3", "title": "Connect API mutation handler", "completed": False}
                ]),
                "estimated_hours": 8.0,
                "actual_hours": 5.0
            },
            {
                "title": "Integrate QR code scanner for instant event check-in",
                "description": "Implement camera barcode reader scanning attendee registration tokens with sound effect and real-time attendance counter update.",
                "project_id": proj1.id,
                "domain_id": domains["WEB"].id,
                "assignee_id": members_map["member2@technoclub.org"].id,
                "creator_id": members_map["web.head@technoclub.org"].id,
                "due_date": now + timedelta(days=2),
                "priority": "Urgent",
                "status": "Review",
                "subtasks": json.dumps([
                    {"id": "1", "title": "Create QR scanner view", "completed": True},
                    {"id": "2", "title": "Add manual attendance fallback", "completed": True}
                ]),
                "estimated_hours": 6.0,
                "actual_hours": 6.0
            },
            {
                "title": "Calibrate stereoscopic cameras on delivery rover chassis",
                "description": "Run OpenCV chessboard calibration script to rectify distortion and compute disparity map for depth sensing.",
                "project_id": proj2.id,
                "domain_id": domains["IOT"].id,
                "assignee_id": members_map["member1@technoclub.org"].id,
                "creator_id": members_map["president@technoclub.org"].id,
                "due_date": now + timedelta(days=7),
                "priority": "Medium",
                "status": "Todo",
                "subtasks": json.dumps([
                    {"id": "1", "title": "Print 9x6 calibration target", "completed": True},
                    {"id": "2", "title": "Record 30 calibration frames", "completed": False}
                ]),
                "estimated_hours": 10.0,
                "actual_hours": 1.0
            },
            {
                "title": "Complete audit logging service and diff tracking",
                "description": "Ensure every mutation writes user_id, action, timestamp, and diff json for full institutional accountability.",
                "project_id": proj1.id,
                "domain_id": domains["WEB"].id,
                "assignee_id": members_map["web.head@technoclub.org"].id,
                "creator_id": members_map["president@technoclub.org"].id,
                "due_date": now - timedelta(days=1),
                "priority": "High",
                "status": "Completed",
                "subtasks": json.dumps([
                    {"id": "1", "title": "Define AuditLog model", "completed": True},
                    {"id": "2", "title": "Hook into API controllers", "completed": True}
                ]),
                "estimated_hours": 5.0,
                "actual_hours": 4.5
            }
        ]

        for tdata in tasks_data:
            t = Task(**tdata)
            db.add(t)
        db.commit()

    # 9. Seed Approval Proposals
    if not db.query(ApprovalProposal).first():
        ev1 = db.query(Event).filter(Event.name.like("%Agentic AI%")).first()
        proposals_data = [
            {
                "title": "Agentic AI Workshop Budget & Lab Requisition",
                "proposal_type": "Event",
                "entity_type": "Event",
                "entity_id": ev1.id if ev1 else 1,
                "proposer_id": members_map["aiml.head@technoclub.org"].id,
                "current_stage": "President Approval",
                "status": "Under Review",
                "priority": "High",
                "requested_budget": 15000.0,
                "description": "Requesting budget approval for refreshments, participant certificates, guest speaker honorarium, and Lab 4 reservation.",
                "history": json.dumps([
                    {
                        "stage": "Domain Review",
                        "reviewer_id": members_map["aiml.head@technoclub.org"].id,
                        "reviewer_name": "Rohan Verma",
                        "reviewer_role": "Domain Head",
                        "action": "Approve",
                        "timestamp": (now - timedelta(days=2)).isoformat(),
                        "comments": "Curriculum reviewed and verified against industry standards."
                    },
                    {
                        "stage": "Vice President Review",
                        "reviewer_id": members_map["vp@technoclub.org"].id,
                        "reviewer_name": "Priya Patel",
                        "reviewer_role": "Vice President",
                        "action": "Approve",
                        "timestamp": (now - timedelta(days=1)).isoformat(),
                        "comments": "Venue booked with Dept Head. Forwarded to President for final approval."
                    }
                ])
            },
            {
                "title": "Purchase of 5x Raspberry Pi 5 8GB Kits for Robotics Domain",
                "proposal_type": "Resource",
                "entity_type": "Resource",
                "entity_id": None,
                "proposer_id": members_map["president@technoclub.org"].id,
                "current_stage": "Vice President Review",
                "status": "Under Review",
                "priority": "Normal",
                "requested_budget": 45000.0,
                "description": "Procurement of embedded hardware kits to support upcoming inter-college autonomous rover challenges.",
                "history": json.dumps([
                    {
                        "stage": "Domain Review",
                        "reviewer_id": members_map["president@technoclub.org"].id,
                        "reviewer_name": "Aarav Sharma",
                        "reviewer_role": "President",
                        "action": "Approve",
                        "timestamp": now.isoformat(),
                        "comments": "Quotations obtained from three certified educational vendors."
                    }
                ])
            }
        ]

        for pdata in proposals_data:
            p = ApprovalProposal(**pdata)
            db.add(p)
        db.commit()

    # 10. Seed Resources
    if not db.query(Resource).first():
        resources_data = [
            {
                "name": "Raspberry Pi 5 Developer Kit (8GB RAM)",
                "category": "Physical",
                "resource_type": "Raspberry Pi",
                "identifier": "HW-RPI5-001",
                "quantity": 5,
                "available_quantity": 4,
                "status": "Available",
                "location": "Locker A - Shelf 2",
                "notes": "Includes 64GB High Endurance microSD cards and active coolers."
            },
            {
                "name": "Arduino Mega 2560 Sensor Suite",
                "category": "Physical",
                "resource_type": "Arduino",
                "identifier": "HW-ARD-MEGA-04",
                "quantity": 10,
                "available_quantity": 8,
                "status": "Available",
                "location": "Locker A - Shelf 1",
                "notes": "Includes ultrasonic sensors, servo motors, IMU modules."
            },
            {
                "name": "NVIDIA Jetson Orin Nano Edge AI Module",
                "category": "Physical",
                "resource_type": "Lab Equipment",
                "identifier": "HW-JETSON-ORIN-01",
                "quantity": 2,
                "available_quantity": 1,
                "status": "Assigned",
                "location": "Rover Development Workstation",
                "assigned_to_id": members_map["president@technoclub.org"].id,
                "notes": "Assigned for Autonomous Delivery Rover SLAM testing."
            },
            {
                "name": "Google Cloud Platform Institutional Credits Pool",
                "category": "Digital",
                "resource_type": "Cloud Account",
                "identifier": "CLOUD-GCP-TECHNO-2026",
                "quantity": 1,
                "available_quantity": 1,
                "status": "Available",
                "location": "Cloud Console Admin",
                "notes": "$3,000 research credit grant allocated by Google Cloud Education."
            },
            {
                "name": "JetBrains Educational Team Organization License",
                "category": "Digital",
                "resource_type": "Software License",
                "identifier": "LIC-JETBRAINS-50SEATS",
                "quantity": 50,
                "available_quantity": 38,
                "status": "Available",
                "location": "License Server",
                "notes": "Full IDE pack for active club developers."
            }
        ]

        for rdata in resources_data:
            r = Resource(**rdata)
            db.add(r)
        db.commit()

    # 11. Seed Finance & Sponsors
    if not db.query(Budget).first():
        b1 = Budget(
            title="Annual Techno Club Operating Budget 2025-2026",
            fiscal_year="2025-2026",
            total_allocated=500000.0,
            total_spent=85000.0,
            status="Approved",
            notes="Approved by College Technical Directorate and Faculty Advisory Board."
        )
        db.add(b1)
        db.commit()

        exp1 = Expense(
            budget_id=b1.id,
            title="Workshop Refreshments & High-Tea for 80 Participants",
            category="Food & Refreshments",
            amount=4800.0,
            incurred_by_id=members_map["aiml.head@technoclub.org"].id,
            status="Approved",
            approved_by_id=members_map["treasurer@technoclub.org"].id,
            notes="Cafeteria invoice #CFT-882 paid via college account."
        )
        exp2 = Expense(
            budget_id=b1.id,
            title="Domain Banners & Publicity Posters",
            category="Marketing & Printing",
            amount=3200.0,
            incurred_by_id=members_map["vp@technoclub.org"].id,
            status="Reimbursed",
            approved_by_id=members_map["treasurer@technoclub.org"].id,
            notes="Printed 5 standees and 50 A3 poster prints."
        )
        db.add(exp1)
        db.add(exp2)

        sponsors_data = [
            {
                "company_name": "Google Cloud",
                "contact_person": "Vikram Sethi (Campus Relations)",
                "email": "vsethi@google.com",
                "tier": "Title",
                "stage": "Confirmed",
                "amount": 100000.0,
                "benefits": "Keynote speaking slot, logo on all banners, workshop mentorship.",
                "mou_signed": True,
                "payment_status": "Received"
            },
            {
                "company_name": "GitHub Education",
                "contact_person": "Sarah Jenkins",
                "email": "sarahj@github.com",
                "tier": "Platinum",
                "stage": "Confirmed",
                "amount": 50000.0,
                "benefits": "Exclusive swag pack for all 200 participants, GitHub Pro credits.",
                "mou_signed": True,
                "payment_status": "Received"
            },
            {
                "company_name": "Red Hat Enterprise",
                "contact_person": "Manish Rao",
                "email": "mrao@redhat.com",
                "tier": "Gold",
                "stage": "Negotiation",
                "amount": 35000.0,
                "benefits": "Judge panel seats and Linux certification discount vouchers.",
                "mou_signed": False,
                "payment_status": "Pending"
            }
        ]
        for sdata in sponsors_data:
            s = Sponsor(**sdata)
            db.add(s)
        db.commit()

    # 12. Seed Announcements & Meetings
    if not db.query(Announcement).first():
        a1 = Announcement(
            title="Call for Papers & Submissions: Technovate 2026",
            content="Registrations are now officially open for our national hackathon and project exhibitions! All core members are encouraged to mentor domain teams.",
            author_id=members_map["president@technoclub.org"].id,
            priority="Urgent",
            pinned=True
        )
        a2 = Announcement(
            title="Weekly Domain Sync & Lab Requisition Guidelines",
            content="Please ensure all hardware borrowed from Locker A is signed out in the Resource Management portal before removing it from the lab.",
            author_id=members_map["vp@technoclub.org"].id,
            priority="High",
            pinned=False
        )
        db.add(a1)
        db.add(a2)

        m1 = Meeting(
            title="Executive Core Council - Bi-Weekly Operations Review",
            meeting_type="Executive Leadership",
            organizer_id=members_map["president@technoclub.org"].id,
            scheduled_at=now + timedelta(days=1, hours=17),
            duration_minutes=60,
            location="Executive Boardroom & Zoom",
            agenda="1. Technovate sponsorship status update\n2. Hackathon problem statement finalization\n3. Lab equipment procurement approval review",
            action_items=json.dumps([
                {"item": "Follow up with Red Hat regarding MOU signing", "assignee": "Neha Reddy (Treasurer)", "due": "2026-10-02"},
                {"item": "Inspect Jetson Nano camera calibration", "assignee": "Rohan Verma", "due": "2026-10-04"}
            ]),
            status="Scheduled"
        )
        db.add(m1)
        db.commit()

    # 13. Seed Certificates & Achievements
    if not db.query(Certificate).first():
        c1 = Certificate(
            certificate_id="TC-2026-WIN-001",
            verification_code="8f92a10b4c6e4d28a3f120e87b9c1d34",
            title="TechnoHacks 2026 1st Place Excellence Award",
            certificate_type="Winner",
            recipient_name="Rohan Verma",
            recipient_email="aiml.head@technoclub.org",
            recipient_member_id=members_map["aiml.head@technoclub.org"].id,
            issue_date=now - timedelta(days=5),
            status="Active",
            metadata_info=json.dumps({"rank": 1, "score": 94.5, "event": "TechnoHacks 2026"})
        )
        c2 = Certificate(
            certificate_id="TC-2026-PART-042",
            verification_code="3e71d80a1c2f4b59b1e948c27a6d5f12",
            title="Certificate of Active Contribution & Leadership",
            certificate_type="Core Team",
            recipient_name="Sneha Kulkarni",
            recipient_email="member1@technoclub.org",
            recipient_member_id=members_map["member1@technoclub.org"].id,
            issue_date=now - timedelta(days=10),
            status="Active",
            metadata_info=json.dumps({"domain": "AI & Machine Learning", "academic_year": "2025-2026"})
        )
        db.add(c1)
        db.add(c2)

        ach1 = Achievement(
            member_id=members_map["aiml.head@technoclub.org"].id,
            title="1st Place - National Hackathon 2026",
            category="Hackathon Winner",
            description="Built an offline medical diagnostics copilot for rural healthcare centers.",
            badge_icon="Trophy",
            is_featured=True
        )
        ach2 = Achievement(
            member_id=members_map["web.head@technoclub.org"].id,
            title="Architected TechnoClub Management Platform",
            category="Project Completion",
            description="Delivered enterprise-grade club management operating system with full RBAC and audit logging.",
            badge_icon="Award",
            is_featured=True
        )
        db.add(ach1)
        db.add(ach2)
        db.commit()

    # 14. Seed Audit Logs
    if not db.query(AuditLog).first():
        log1 = AuditLog(
            user_id=members_map["president@technoclub.org"].user_id,
            user_email="president@technoclub.org",
            role="President",
            action="CREATE",
            entity="Event",
            entity_id=1,
            description="President Aarav Sharma created Technovate 2026: National Technical Fest",
            diff_json=json.dumps({"name": "Technovate 2026", "budget": 250000.0, "status": "Approved"})
        )
        log2 = AuditLog(
            user_id=members_map["vp@technoclub.org"].user_id,
            user_email="vp@technoclub.org",
            role="Vice President",
            action="APPROVE",
            entity="ApprovalProposal",
            entity_id=1,
            description="Vice President Priya Patel approved Agentic AI Workshop proposal and forwarded to President",
            diff_json=json.dumps({"stage": "President Approval", "status": "Under Review"})
        )
        db.add(log1)
        db.add(log2)
        db.commit()

    print(">> Database initialization completed with rich college techno club seed data.")
