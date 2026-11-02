"""
FlowNavigator - Secure Authentication & Role-Based Access Control (RBAC) Service
Provides:
- Cryptographic password hashing (scrypt / PBKDF2 with salt)
- Signed JWT Session Bearer tokens with strict expiration (HS256)
- Brute-force rate limiting & temporary account lockouts (5 failed attempts -> 5 min lock)
- Authentication decorators (@admin_required, @role_required)
- Security audit logging
"""

import os
import time
import uuid
import datetime
from functools import wraps
from flask import request, jsonify, g
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from database import db

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY") or "flownavigator_secure_admin_jwt_secret_token_2026_!@#$%"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = int(os.getenv("JWT_EXPIRATION_SECONDS", 28800))  # 8 hours default
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION_SECONDS = 300  # 5 minutes lockout

class AuthService:
    def __init__(self, database):
        self.db = database
        self._ensure_default_users()

    def _ensure_default_users(self):
        """Ensures default admin accounts are seeded in database with cryptographic password hashes."""
        if self.db.db is None:
            return

        try:
            if self.db.db.users.count_documents({}) == 0:
                admin_pw = os.getenv("ADMIN_DEFAULT_PASSWORD", "admin123")
                now = datetime.datetime.now().isoformat()
                initial_users = [
                    {
                        "id": "u-1",
                        "username": "admin",
                        "name": "System Administrator",
                        "email": "admin@flownavigator.org",
                        "password_hash": generate_password_hash(admin_pw),
                        "role": "Super Admin",
                        "venue_scope": "All Venues & Grounds",
                        "status": "Active",
                        "failed_attempts": 0,
                        "locked_until": None,
                        "last_active": now,
                        "created_at": now,
                        "is_system": True
                    },
                    {
                        "id": "u-2",
                        "username": "dispatcher_palani",
                        "name": "Palani Operations Control",
                        "email": "palani.control@flownavigator.org",
                        "password_hash": generate_password_hash("dispatcher123"),
                        "role": "Safety Dispatcher",
                        "venue_scope": "Palani Pilgrimage Gathering Grounds",
                        "status": "Active",
                        "failed_attempts": 0,
                        "locked_until": None,
                        "last_active": now,
                        "created_at": now,
                        "is_system": False
                    },
                    {
                        "id": "u-3",
                        "username": "chennai_gate",
                        "name": "Nehru Stadium Turnstiles",
                        "email": "chennai.gates@flownavigator.org",
                        "password_hash": generate_password_hash("gatepass123"),
                        "role": "Gate Supervisor",
                        "venue_scope": "Jawaharlal Nehru Stadium Complex",
                        "status": "Active",
                        "failed_attempts": 0,
                        "locked_until": None,
                        "last_active": now,
                        "created_at": now,
                        "is_system": False
                    },
                    {
                        "id": "u-4",
                        "username": "event_coordinator",
                        "name": "College Event Operations",
                        "email": "events@college.edu",
                        "password_hash": generate_password_hash("events123"),
                        "role": "Event Coordinator",
                        "venue_scope": "Sona College of Technology (Campus Ground)",
                        "status": "Active",
                        "failed_attempts": 0,
                        "locked_until": None,
                        "last_active": now,
                        "created_at": now,
                        "is_system": False
                    }
                ]
                self.db.db.users.insert_many(initial_users)
                print("[AuthService] Seeded default secure system users.")
        except Exception as e:
            print(f"[AuthService] Note: user seeding check ({e})")

    def hash_password(self, password: str) -> str:
        return generate_password_hash(password)

    def verify_password(self, password: str, password_hash: str) -> bool:
        if not password or not password_hash:
            return False
        return check_password_hash(password_hash, password)

    def generate_token(self, user: dict) -> str:
        now = int(time.time())
        payload = {
            "sub": user.get("id"),
            "username": user.get("username"),
            "name": user.get("name"),
            "role": user.get("role", "Safety Dispatcher"),
            "venue_scope": user.get("venue_scope", "All Venues & Grounds"),
            "iat": now,
            "exp": now + JWT_EXPIRATION_SECONDS,
            "jti": str(uuid.uuid4())
        }
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

    def decode_token(self, token: str) -> tuple[bool, dict or str]:
        """Validates and decodes JWT token. Returns (is_valid, payload_or_error_message)."""
        if not token:
            return False, "Token missing"
        try:
            # Strip Bearer prefix if provided
            if token.startswith("Bearer "):
                token = token[7:].strip()
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            return True, payload
        except jwt.ExpiredSignatureError:
            return False, "Session expired. Please log in again."
        except jwt.InvalidTokenError as e:
            return False, f"Invalid authentication token: {str(e)}"

    def log_audit_event(self, event_type: str, username: str, ip: str, details: str = ""):
        if self.db.db is None:
            return
        try:
            log_doc = {
                "timestamp": datetime.datetime.now().isoformat(),
                "event": event_type,
                "username": username or "unknown",
                "ip_address": ip or "127.0.0.1",
                "details": details
            }
            self.db.db.auth_audit_logs.insert_one(log_doc)
        except Exception:
            pass

    def authenticate(self, username: str, password: str, ip: str = "127.0.0.1") -> tuple[bool, dict, str]:
        """
        Authenticates an administrator with brute-force protection.
        Returns: (success, user_dict_or_empty, message)
        """
        if not username or not password:
            return False, {}, "Username and password are required"

        username_clean = username.strip().lower()

        # Find user
        user = self.db.db.users.find_one({"username": username_clean})
        if not user:
            self.log_audit_event("LOGIN_FAILED_NOT_FOUND", username_clean, ip, "User does not exist")
            return False, {}, "Invalid credentials"

        # Check temporary lockout
        locked_until = user.get("locked_until")
        now_ts = time.time()
        if locked_until:
            try:
                lock_time = datetime.datetime.fromisoformat(locked_until).timestamp()
                if now_ts < lock_time:
                    remaining_sec = int(lock_time - now_ts)
                    mins = max(1, (remaining_sec + 59) // 60)
                    self.log_audit_event("LOGIN_BLOCKED_LOCKED", username_clean, ip, f"Locked for {remaining_sec}s")
                    return False, {}, f"Account temporarily locked due to consecutive failed attempts. Try again in {mins} minute(s)."
            except Exception:
                pass

        # Verify password hash
        stored_hash = user.get("password_hash")
        is_correct = self.verify_password(password, stored_hash)

        if not is_correct:
            # Increment failed attempts
            failed = user.get("failed_attempts", 0) + 1
            update_data = {"failed_attempts": failed}

            if failed >= MAX_FAILED_ATTEMPTS:
                lock_expiry = datetime.datetime.fromtimestamp(now_ts + LOCKOUT_DURATION_SECONDS).isoformat()
                update_data["locked_until"] = lock_expiry
                self.db.db.users.update_one({"username": username_clean}, {"$set": update_data})
                self.log_audit_event("ACCOUNT_LOCKED", username_clean, ip, f"Exceeded {MAX_FAILED_ATTEMPTS} attempts")
                return False, {}, f"Security Alert: Account locked for {LOCKOUT_DURATION_SECONDS // 60} minutes due to excessive failed attempts."
            else:
                self.db.db.users.update_one({"username": username_clean}, {"$set": update_data})
                remaining = MAX_FAILED_ATTEMPTS - failed
                self.log_audit_event("LOGIN_FAILED_WRONG_PW", username_clean, ip, f"Failed attempt {failed}/{MAX_FAILED_ATTEMPTS}")
                return False, {}, f"Invalid credentials. ({remaining} attempt(s) remaining before temporary lockout)"

        # Successful login: reset failed counters & update last active
        now_iso = datetime.datetime.now().isoformat()
        self.db.db.users.update_one(
            {"username": username_clean},
            {"$set": {
                "failed_attempts": 0,
                "locked_until": None,
                "last_active": now_iso
            }}
        )

        token = self.generate_token(user)
        self.log_audit_event("LOGIN_SUCCESS", username_clean, ip, f"Role: {user.get('role')}")

        safe_user = {
            "id": user.get("id"),
            "username": user.get("username"),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role"),
            "venue_scope": user.get("venue_scope"),
            "last_active": now_iso,
            "is_system": user.get("is_system", False)
        }

        return True, safe_user, token

    def change_password(self, username: str, old_password: str, new_password: str) -> tuple[bool, str]:
        if not new_password or len(new_password) < 6:
            return False, "New password must be at least 6 characters long"

        user = self.db.db.users.find_one({"username": username.lower()})
        if not user:
            return False, "User not found"

        if not self.verify_password(old_password, user.get("password_hash")):
            return False, "Current password is incorrect"

        new_hash = self.hash_password(new_password)
        self.db.db.users.update_one(
            {"username": username.lower()},
            {"$set": {"password_hash": new_hash}}
        )
        self.log_audit_event("PASSWORD_CHANGED", username.lower(), "system", "Password updated successfully")
        return True, "Password changed successfully"

    def get_all_users(self) -> list:
        users = list(self.db.db.users.find({}, {"_id": 0, "password_hash": 0}))
        return users

    def create_user(self, name: str, username: str, password: str, email: str, role: str, venue_scope: str) -> tuple[bool, dict, str]:
        username_clean = username.strip().lower()
        if not name or not username_clean:
            return False, {}, "Name and username are required"

        if not password or len(password) < 6:
            return False, {}, "Password must be at least 6 characters"

        if self.db.db.users.find_one({"username": username_clean}):
            return False, {}, f"Username '{username_clean}' already exists"

        now_iso = datetime.datetime.now().isoformat()
        count = self.db.db.users.count_documents({})
        new_user = {
            "id": f"u-{count + 1}",
            "username": username_clean,
            "name": name.strip(),
            "email": email.strip() if email else f"{username_clean}@flownavigator.org",
            "password_hash": self.hash_password(password),
            "role": role or "Safety Dispatcher",
            "venue_scope": venue_scope or "All Venues & Grounds",
            "status": "Active",
            "failed_attempts": 0,
            "locked_until": None,
            "last_active": "Just created",
            "created_at": now_iso,
            "is_system": False
        }

        self.db.db.users.insert_one(new_user)
        self.log_audit_event("USER_CREATED", username_clean, "admin", f"Role: {role}")

        safe_user = {k: v for k, v in new_user.items() if k not in ["_id", "password_hash"]}
        return True, safe_user, "User created successfully"

    def delete_user(self, username: str) -> tuple[bool, str]:
        username_clean = username.strip().lower()
        user = self.db.db.users.find_one({"username": username_clean})
        if not user:
            return False, "User not found"
        if user.get("is_system"):
            return False, "Cannot delete primary Super Admin user"

        self.db.db.users.delete_one({"username": username_clean})
        self.log_audit_event("USER_DELETED", username_clean, "admin", "User account removed")
        return True, f"User '{username_clean}' deleted successfully"

    def get_audit_logs(self, limit: int = 50) -> list:
        if self.db.db is None:
            return []
        try:
            return list(self.db.db.auth_audit_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit))
        except Exception:
            return []

# Singleton instance
auth_service = AuthService(db)

def admin_required(f):
    """
    Decorator to protect routes requiring authenticated administrator session.
    Inspects Authorization header (Bearer <jwt>) or X-Admin-Token header.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        token = None

        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()
        elif request.headers.get("X-Admin-Token"):
            token = request.headers.get("X-Admin-Token").strip()
        elif request.args.get("token"):
            token = request.args.get("token").strip()

        if not token:
            return jsonify({
                "success": False,
                "error": "UNAUTHORIZED",
                "message": "Authentication required. Please log in with admin credentials."
            }), 401

        is_valid, result = auth_service.decode_token(token)
        if not is_valid:
            return jsonify({
                "success": False,
                "error": "SESSION_EXPIRED",
                "message": result
            }), 401

        # Store authenticated user in request context
        g.current_user = result
        return f(*args, **kwargs)

    return decorated_function

def role_required(*allowed_roles):
    """
    Decorator to restrict access to specific roles (e.g. 'Super Admin').
    """
    def decorator(f):
        @wraps(f)
        @admin_required
        def decorated_function(*args, **kwargs):
            user_role = g.current_user.get("role", "")
            if allowed_roles and user_role not in allowed_roles and user_role != "Super Admin":
                return jsonify({
                    "success": False,
                    "error": "FORBIDDEN",
                    "message": f"Access denied. Requires one of the following roles: {', '.join(allowed_roles)}"
                }), 403
            return f(*args, **kwargs)
        return decorated_function
    return decorator

