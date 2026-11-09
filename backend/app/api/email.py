from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.models import User
from app.schemas.email_integration import EmailIntegrationCreate, EmailIntegrationRead, EmailSyncResult
from app.services import email_service

router = APIRouter(prefix="/api/email", tags=["Email Integration"])

@router.get("/config", response_model=EmailIntegrationRead)
def get_config(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the current email integration configuration."""
    integration = email_service.get_integration(db, user.id)
    if not integration:
        raise HTTPException(status_code=404, detail="Configuración no encontrada")
    return integration

@router.post("/config", response_model=EmailIntegrationRead)
def save_config(data: EmailIntegrationCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Save or update the email integration configuration."""
    return email_service.save_integration(db, user.id, data)

@router.post("/sync", response_model=EmailSyncResult)
def sync_emails(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Trigger a manual email synchronization."""
    result = email_service.sync_emails(db, user)
    if not result.success and "Error de autenticación" not in result.message:
        # We don't necessarily raise 400 for everything, but let's just return the result
        pass
    return result
