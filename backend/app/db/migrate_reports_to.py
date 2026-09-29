import os
import sys
from pathlib import Path

backend_dir = str(Path(__file__).resolve().parent.parent.parent)
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import sqlite3
from sqlalchemy.orm import Session
from app.core.database import engine, get_db, Base
from app.models.user_role import Role, Permission
from app.models.member_domain import Member

def migrate_database():
    # If SQLite, check and add reports_to_id
    if str(engine.url).startswith("sqlite"):
        db_path = str(engine.url).replace("sqlite:///", "")
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("PRAGMA table_info(members)")
        cols = [r[1] for r in c.fetchall()]
        if "reports_to_id" not in cols:
            c.execute("ALTER TABLE members ADD COLUMN reports_to_id INTEGER REFERENCES members(id)")
            print("Successfully added reports_to_id column to members table.")
        else:
            print("Column reports_to_id already exists in members table.")
        conn.commit()
        conn.close()

    # Use SQLAlchemy session to ensure Super Admin role and permissions exist
    db: Session = next(get_db())
    try:
        super_admin_role = db.query(Role).filter(Role.name == "Super Admin").first()
        if not super_admin_role:
            super_admin_role = Role(
                name="Super Admin",
                description="Highest level system administrator with full access to create all roles and oversee club operations",
                is_system_role=True
            )
            db.add(super_admin_role)
            db.flush()
            print("Successfully created Super Admin role.")
        
        # Grant all permissions to Super Admin
        all_perms = db.query(Permission).all()
        super_admin_role.permissions = list(all_perms)

        # Set default reporting relationships for existing seed data if not yet set
        president = db.query(Member).join(Member.user).join(Role).filter(Role.name == "President").first()
        vp = db.query(Member).join(Member.user).join(Role).filter(Role.name == "Vice President").first()
        
        if president and vp and not vp.reports_to_id:
            vp.reports_to_id = president.id
            print(f"Set {vp.full_name} (VP) reports to {president.full_name} (President)")

        if vp:
            domain_heads = db.query(Member).join(Member.user).join(Role).filter(Role.name == "Domain Head").all()
            for dh in domain_heads:
                if not dh.reports_to_id:
                    dh.reports_to_id = vp.id
                    print(f"Set {dh.full_name} (Domain Head) reports to {vp.full_name} (VP)")

            members = db.query(Member).join(Member.user).join(Role).filter(Role.name == "Member").all()
            for m in members:
                if not m.reports_to_id and m.domain_id:
                    # Find Domain Head of that domain
                    dh_of_domain = db.query(Member).join(Member.user).join(Role).filter(
                        Role.name == "Domain Head",
                        Member.domain_id == m.domain_id
                    ).first()
                    if dh_of_domain:
                        m.reports_to_id = dh_of_domain.id
                        print(f"Set {m.full_name} (Member) reports to {dh_of_domain.full_name} (Domain Head)")

        db.commit()
        print("Database migration completed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate_database()
