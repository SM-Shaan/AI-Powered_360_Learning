from fastapi import APIRouter, HTTPException, Depends, status
from app.models.schemas import UserCreate, UserLogin, UserResponse, TokenResponse, PasswordChange, ProfileUpdate
from app.core.supabase import get_supabase, get_supabase_admin
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    require_admin
)
import uuid

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    supabase = get_supabase_admin()  # Use admin client to bypass RLS

    # Check if email already exists
    existing = supabase.table("users").select("id").eq("email", user_data.email).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    existing = supabase.table("users").select("id").eq("username", user_data.username).execute()
    if existing.data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)

    new_user = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "role": user_data.role.value
    }

    result = supabase.table("users").insert(new_user).execute()

    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )

    # Generate token
    access_token = create_access_token(data={"sub": user_id})

    user_response = UserResponse(
        id=user_id,
        username=user_data.username,
        email=user_data.email,
        role=user_data.role.value
    )

    return TokenResponse(access_token=access_token, user=user_response)

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    try:
        supabase = get_supabase_admin()  # Use admin client to bypass RLS

        # Find user by email
        result = supabase.table("users").select("*").eq("email", credentials.email).execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection error: {str(e)}"
        )

    user = result.data[0]

    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate token
    access_token = create_access_token(data={"sub": user["id"]})

    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        role=user["role"],
        created_at=user.get("created_at")
    )

    return TokenResponse(access_token=access_token, user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user.get("created_at")
    )

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()
    updates = {}

    if profile_data.username:
        # Check if username is taken
        existing = supabase.table("users").select("id").eq("username", profile_data.username).neq("id", current_user["id"]).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        updates["username"] = profile_data.username

    if profile_data.email:
        # Check if email is taken
        existing = supabase.table("users").select("id").eq("email", profile_data.email).neq("id", current_user["id"]).execute()
        if existing.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        updates["email"] = profile_data.email

    if updates:
        result = supabase.table("users").update(updates).eq("id", current_user["id"]).execute()
        if result.data:
            user = result.data[0]
            return UserResponse(
                id=user["id"],
                username=user["username"],
                email=user["email"],
                role=user["role"],
                created_at=user.get("created_at")
            )

    return UserResponse(
        id=current_user["id"],
        username=current_user["username"],
        email=current_user["email"],
        role=current_user["role"],
        created_at=current_user.get("created_at")
    )

@router.put("/password")
async def change_password(
    password_data: PasswordChange,
    current_user: dict = Depends(get_current_user)
):
    supabase = get_supabase()

    # Verify current password
    if not verify_password(password_data.current_password, current_user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # Update password
    hashed_password = get_password_hash(password_data.new_password)
    supabase.table("users").update({"password": hashed_password}).eq("id", current_user["id"]).execute()

    return {"success": True, "message": "Password updated successfully"}

@router.get("/users")
async def get_users(admin: dict = Depends(require_admin)):
    supabase = get_supabase()
    result = supabase.table("users").select("id, username, email, role, created_at").execute()

    return {"success": True, "data": result.data}
