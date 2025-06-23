from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database.connection import get_db
from ..database.models.user import User
from .middleware import get_current_active_user

router = APIRouter()

@router.post("/recent-works", summary="获取用户最近作品")
async def get_recent_works(
    request_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户最近的处理作品"""
    from ..crud.process_record import process_record_crud
    
    limit = request_data.get('limit', 6)
    try:
        records = process_record_crud.get_user_recent_records(db, current_user.id, limit)
        
        recent_works = []
        for record in records:
            recent_works.append({
                "id": record.id,
                "thumbnail": record.result_image_url or record.original_image_url,
                "title": f"图像修复 #{record.id}",
                "createTime": record.created_at.strftime("%Y-%m-%d %H:%M")
            })
        
        return {"success": True, "data": recent_works}
    except Exception as e:
        # 如果没有记录或出错，返回空列表
        return {"success": True, "data": []}

@router.get("/history", summary="获取用户处理历史")
async def get_user_history(
    page: int = 1,
    limit: int = 20,
    status: str = "",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取用户的处理历史记录"""
    from ..crud.process_record import process_record_crud
    
    try:
        records = process_record_crud.get_user_records_paginated(db, current_user.id, page, limit, status)
        total = process_record_crud.get_user_record_count(db, current_user.id, status)
        
        history_items = []
        for record in records:
            history_items.append({
                "id": record.id,
                "inputUrl": record.original_image_url,
                "outputUrl": record.result_image_url,
                "thumbnail": record.result_image_url or record.original_image_url,
                "status": record.status,
                "createdAt": record.created_at.strftime("%Y-%m-%d %H:%M"),
                "processTime": record.processing_time
            })
        
        return {
            "success": True,
            "data": {
                "items": history_items,
                "total": total,
                "page": page,
                "limit": limit
            }
        }
    except Exception as e:
        return {
            "success": True,
            "data": {
                "items": [],
                "total": 0,
                "page": page,
                "limit": limit
            }
        }

@router.post("/history/delete", summary="删除处理记录")
async def delete_history_item(
    request_data: dict,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """删除用户的处理记录"""
    from ..crud.process_record import process_record_crud
    
    record_id = request_data.get('id')
    if not record_id:
        raise HTTPException(status_code=400, detail="缺少记录ID")
    
    try:
        # 验证记录是否属于当前用户
        record = process_record_crud.get_user_record(db, current_user.id, record_id)
        if not record:
            raise HTTPException(status_code=404, detail="记录不存在")
        
        # 删除记录
        success = process_record_crud.delete_record(db, record_id)
        if success:
            return {"success": True, "message": "删除成功"}
        else:
            raise HTTPException(status_code=500, detail="删除失败")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"删除失败: {str(e)}") 