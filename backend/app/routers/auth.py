from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import get_db
from app.models import User

from app.services.email import send_confirmation_email
import secrets

router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

@router.get("/confirm")
def confirm_email(token: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.confirmation_token == token).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user.is_confirmed = True
    user.confirmation_token = None
    db.commit()

    return {"message": "Email confirmed"}


@router.post("/signup")
def signup(email: str, db: Session = Depends(get_db)):
    token = secrets.token_urlsafe(32)

    user = User(
        email=email,
        is_confirmed=False,
        confirmation_token=token
    )

    db.add(user)
    db.commit()

    try:
        send_confirmation_email(email, token)
    except Exception as e:
        print("Email failed:", e)

    return {"message": "Check your email to confirm your account"}
