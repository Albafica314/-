#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
FastAPI Backend Application Entry Point
Course: Big Data Comprehensive Practice (大数据综合实践)
Team: 华文涛, 阳泽宇, 许钧柏
Author: 许钧柏 (Backend & API Lead)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import overview, hotspots, trips, od_flow, predict, statistics

app = FastAPI(
    title="城市出租车时空轨迹挖掘与智慧交通可视化系统 API",
    description="基于SF Cabspotting 1122万GPS点与537辆出租车的四层架构大数据综合实践系统后端接口",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for Vue3 / modern frontend clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(overview.router)
app.include_router(hotspots.router)
app.include_router(trips.router)
app.include_router(od_flow.router)
app.include_router(predict.router)
app.include_router(statistics.router)

@app.get("/")
def root():
    return {
        "project": "城市出租车时空轨迹挖掘与智慧交通可视化系统",
        "team": ["华文涛", "阳泽宇", "许钧柏"],
        "dataset": "San Francisco Cabspotting (CRAWDAD epfl/mobility)",
        "status": "healthy",
        "docs": "/docs"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "taxi-bigdata-fastapi-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
