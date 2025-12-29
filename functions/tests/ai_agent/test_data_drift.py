import pytest
from unittest.mock import Mock, patch
from src.ai_agent.marketing.data_drift_monitor import DataDriftMonitor

def test_kl_divergence_identical():
    monitor = DataDriftMonitor()
    dist = {"pricing": 0.3, "services": 0.5, "general": 0.2}
    kl = monitor.calculate_kl_divergence(dist, dist)
    assert kl < 0.01  # Should be ~0 for identical

def test_kl_divergence_different():
    monitor = DataDriftMonitor()
    baseline = {"pricing": 0.5, "services": 0.3, "general": 0.2}
    current = {"pricing": 0.2, "services": 0.6, "general": 0.2}
    kl = monitor.calculate_kl_divergence(baseline, current)
    assert kl > 0.1  # Should be significant

def test_classify_query():
    monitor = DataDriftMonitor()
    assert monitor._classify_query("How much does it cost?") == "pricing"
    assert monitor._classify_query("What services do you offer?") == "services"
    assert monitor._classify_query("How does RAG work?") == "technical"
    assert monitor._classify_query("Hello there") == "general"
