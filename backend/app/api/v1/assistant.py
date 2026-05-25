"""
AI Assistant endpoint: natural-language Q&A powered by Claude.
"""
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import CurrentUser, GetCurrentUser
from app.services.ai_assistant import answer_question

router = APIRouter(prefix="/assistant", tags=["assistant"])


class AskRequest(BaseModel):
    question: str
    store_id: UUID
    context_data: Optional[dict] = None


class AskResponse(BaseModel):
    answer: str
    confidence: float
    data_sources: list[str]
    suggested_actions: list[str]


@router.post("/ask", response_model=AskResponse)
async def ask_assistant(
    payload: AskRequest,
    current_user: Annotated[CurrentUser, GetCurrentUser],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Ask the RetailOS AI assistant a natural-language question about the store.

    The AI will automatically gather relevant store data (sales, inventory,
    alerts) and provide a data-driven answer with suggested actions.
    """
    if not payload.question.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question cannot be empty",
        )

    if len(payload.question) > 2000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Question must be 2000 characters or fewer",
        )

    result = await answer_question(
        question=payload.question,
        store_id=payload.store_id,
        context_data=payload.context_data,
        db=db,
    )

    return AskResponse(
        answer=result["answer"],
        confidence=result["confidence"],
        data_sources=result["data_sources"],
        suggested_actions=result["suggested_actions"],
    )
