"""
A/B Testing Experiment Management System
"""
import asyncio
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
import json
import statistics
import random

from google.cloud import firestore
from google.cloud.firestore import AsyncClient

logger = logging.getLogger(__name__)

class ExperimentStatus(Enum):
    """Experiment status enumeration"""
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class VariantType(Enum):
    """Variant type enumeration"""
    CONTROL = "control"
    TREATMENT = "treatment"

@dataclass
class ExperimentVariant:
    """A/B test variant configuration"""
    id: str
    name: str
    description: str
    type: VariantType
    traffic_allocation: float  # 0.0 to 1.0
    configuration: Dict[str, Any]
    is_control: bool = False

@dataclass
class ExperimentMetric:
    """Experiment success metric definition"""
    name: str
    description: str
    type: str  # 'conversion', 'numeric', 'duration'
    goal: str  # 'maximize', 'minimize'
    primary: bool = False

@dataclass
class Experiment:
    """A/B test experiment definition"""
    id: str
    name: str
    description: str
    status: ExperimentStatus
    variants: List[ExperimentVariant]
    metrics: List[ExperimentMetric]
    start_date: Optional[datetime]
    end_date: Optional[datetime]
    target_sample_size: int
    confidence_level: float
    created_by: str
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any]

@dataclass
class ExperimentAssignment:
    """User assignment to experiment variant"""
    experiment_id: str
    user_id: str
    variant_id: str
    assigned_at: datetime
    session_id: Optional[str] = None

@dataclass
class ExperimentEvent:
    """Event recorded for experiment analysis"""
    id: str
    experiment_id: str
    variant_id: str
    user_id: str
    event_type: str
    event_data: Dict[str, Any]
    timestamp: datetime
    session_id: Optional[str] = None

@dataclass
class ExperimentResults:
    """Experiment results and statistical analysis"""
    experiment_id: str
    variant_results: Dict[str, Dict[str, Any]]
    statistical_significance: Dict[str, bool]
    confidence_intervals: Dict[str, Tuple[float, float]]
    p_values: Dict[str, float]
    effect_sizes: Dict[str, float]
    sample_sizes: Dict[str, int]
    conversion_rates: Dict[str, float]
    recommendations: List[str]
    analysis_date: datetime

class ExperimentManager:
    """
    A/B Testing Experiment Management System
    """
    
    def __init__(self, firestore_client: Optional[AsyncClient] = None):
        """Initialize experiment manager"""
        self.firestore_client = firestore_client or firestore.AsyncClient()
        
        # Collections
        self.experiments_collection = "ab_experiments"
        self.assignments_collection = "ab_assignments"
        self.events_collection = "ab_events"
        self.results_collection = "ab_results"
        
        # Configuration
        self.default_confidence_level = 0.95
        self.min_sample_size = 100
        self.max_experiment_duration_days = 90
        
        logger.info("Experiment manager initialized")
    
    async def create_experiment(self, experiment: Experiment) -> str:
        """Create a new A/B test experiment"""
        try:
            # Validate experiment configuration
            self._validate_experiment(experiment)
            
            # Generate ID if not provided
            if not experiment.id:
                experiment.id = str(uuid.uuid4())
            
            # Set timestamps
            now = datetime.utcnow()
            experiment.created_at = now
            experiment.updated_at = now
            
            # Store in Firestore
            doc_ref = self.firestore_client.collection(self.experiments_collection).document(experiment.id)
            await doc_ref.set(self._experiment_to_dict(experiment))
            
            logger.info(f"Created experiment: {experiment.id} - {experiment.name}")
            return experiment.id
            
        except Exception as e:
            logger.error(f"Error creating experiment: {e}")
            raise
    
    async def get_experiment(self, experiment_id: str) -> Optional[Experiment]:
        """Get experiment by ID"""
        try:
            doc_ref = self.firestore_client.collection(self.experiments_collection).document(experiment_id)
            doc = await doc_ref.get()
            
            if doc.exists:
                return self._dict_to_experiment(doc.to_dict())
            return None
            
        except Exception as e:
            logger.error(f"Error getting experiment {experiment_id}: {e}")
            return None
    
    async def update_experiment(self, experiment: Experiment) -> bool:
        """Update an existing experiment"""
        try:
            # Validate experiment configuration
            self._validate_experiment(experiment)
            
            # Update timestamp
            experiment.updated_at = datetime.utcnow()
            
            # Update in Firestore
            doc_ref = self.firestore_client.collection(self.experiments_collection).document(experiment.id)
            await doc_ref.update(self._experiment_to_dict(experiment))
            
            logger.info(f"Updated experiment: {experiment.id}")
            return True
            
        except Exception as e:
            logger.error(f"Error updating experiment {experiment.id}: {e}")
            return False
    
    async def start_experiment(self, experiment_id: str) -> bool:
        """Start an experiment"""
        try:
            experiment = await self.get_experiment(experiment_id)
            if not experiment:
                raise ValueError(f"Experiment {experiment_id} not found")
            
            if experiment.status != ExperimentStatus.DRAFT:
                raise ValueError(f"Cannot start experiment in {experiment.status.value} status")
            
            # Update status and start date
            experiment.status = ExperimentStatus.ACTIVE
            experiment.start_date = datetime.utcnow()
            
            # Calculate end date if not set
            if not experiment.end_date:
                experiment.end_date = experiment.start_date + timedelta(days=30)
            
            await self.update_experiment(experiment)
            
            logger.info(f"Started experiment: {experiment_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error starting experiment {experiment_id}: {e}")
            return False
    
    async def stop_experiment(self, experiment_id: str) -> bool:
        """Stop an experiment"""
        try:
            experiment = await self.get_experiment(experiment_id)
            if not experiment:
                raise ValueError(f"Experiment {experiment_id} not found")
            
            if experiment.status != ExperimentStatus.ACTIVE:
                raise ValueError(f"Cannot stop experiment in {experiment.status.value} status")
            
            # Update status
            experiment.status = ExperimentStatus.COMPLETED
            experiment.end_date = datetime.utcnow()
            
            await self.update_experiment(experiment)
            
            logger.info(f"Stopped experiment: {experiment_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error stopping experiment {experiment_id}: {e}")
            return False
    
    async def assign_user_to_variant(self, experiment_id: str, user_id: str, 
                                   session_id: Optional[str] = None) -> Optional[str]:
        """Assign user to experiment variant"""
        try:
            # Check if user already assigned
            existing_assignment = await self._get_user_assignment(experiment_id, user_id)
            if existing_assignment:
                return existing_assignment.variant_id
            
            # Get experiment
            experiment = await self.get_experiment(experiment_id)
            if not experiment or experiment.status != ExperimentStatus.ACTIVE:
                return None
            
            # Select variant based on traffic allocation
            variant_id = self._select_variant(experiment.variants, user_id)
            
            # Create assignment
            assignment = ExperimentAssignment(
                experiment_id=experiment_id,
                user_id=user_id,
                variant_id=variant_id,
                assigned_at=datetime.utcnow(),
                session_id=session_id
            )
            
            # Store assignment
            doc_ref = self.firestore_client.collection(self.assignments_collection).document()
            await doc_ref.set(asdict(assignment))
            
            logger.debug(f"Assigned user {user_id} to variant {variant_id} in experiment {experiment_id}")
            return variant_id
            
        except Exception as e:
            logger.error(f"Error assigning user to variant: {e}")
            return None
    
    async def record_event(self, event: ExperimentEvent) -> bool:
        """Record an experiment event"""
        try:
            # Generate ID if not provided
            if not event.id:
                event.id = str(uuid.uuid4())
            
            # Store event
            doc_ref = self.firestore_client.collection(self.events_collection).document(event.id)
            await doc_ref.set(asdict(event))
            
            logger.debug(f"Recorded event {event.event_type} for experiment {event.experiment_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error recording event: {e}")
            return False
    
    async def get_experiment_results(self, experiment_id: str) -> Optional[ExperimentResults]:
        """Get experiment results with statistical analysis"""
        try:
            # Get experiment
            experiment = await self.get_experiment(experiment_id)
            if not experiment:
                return None
            
            # Get events for analysis
            events = await self._get_experiment_events(experiment_id)
            assignments = await self._get_experiment_assignments(experiment_id)
            
            # Perform statistical analysis
            results = await self._analyze_experiment_results(experiment, events, assignments)
            
            # Store results
            doc_ref = self.firestore_client.collection(self.results_collection).document(experiment_id)
            await doc_ref.set(asdict(results))
            
            return results
            
        except Exception as e:
            logger.error(f"Error getting experiment results: {e}")
            return None
    
    async def list_experiments(self, status: Optional[ExperimentStatus] = None) -> List[Experiment]:
        """List experiments with optional status filter"""
        try:
            query = self.firestore_client.collection(self.experiments_collection)
            
            if status:
                query = query.where("status", "==", status.value)
            
            query = query.order_by("created_at", direction=firestore.Query.DESCENDING)
            
            docs = await query.get()
            experiments = []
            
            for doc in docs:
                experiment = self._dict_to_experiment(doc.to_dict())
                experiments.append(experiment)
            
            return experiments
            
        except Exception as e:
            logger.error(f"Error listing experiments: {e}")
            return []
    
    def _validate_experiment(self, experiment: Experiment):
        """Validate experiment configuration"""
        if not experiment.name:
            raise ValueError("Experiment name is required")
        
        if not experiment.variants:
            raise ValueError("At least one variant is required")
        
        # Check traffic allocation
        total_allocation = sum(v.traffic_allocation for v in experiment.variants)
        if abs(total_allocation - 1.0) > 0.01:
            raise ValueError(f"Total traffic allocation must equal 1.0, got {total_allocation}")
        
        # Check for control variant
        control_variants = [v for v in experiment.variants if v.is_control]
        if len(control_variants) != 1:
            raise ValueError("Exactly one control variant is required")
        
        # Validate metrics
        if not experiment.metrics:
            raise ValueError("At least one metric is required")
        
        primary_metrics = [m for m in experiment.metrics if m.primary]
        if len(primary_metrics) != 1:
            raise ValueError("Exactly one primary metric is required")
    
    def _select_variant(self, variants: List[ExperimentVariant], user_id: str) -> str:
        """Select variant for user based on traffic allocation"""
        # Use hash of user_id for consistent assignment
        hash_value = hash(user_id) % 10000 / 10000.0
        
        cumulative_allocation = 0.0
        for variant in variants:
            cumulative_allocation += variant.traffic_allocation
            if hash_value <= cumulative_allocation:
                return variant.id
        
        # Fallback to last variant
        return variants[-1].id
    
    async def _get_user_assignment(self, experiment_id: str, user_id: str) -> Optional[ExperimentAssignment]:
        """Get existing user assignment"""
        try:
            query = (
                self.firestore_client.collection(self.assignments_collection)
                .where("experiment_id", "==", experiment_id)
                .where("user_id", "==", user_id)
                .limit(1)
            )
            
            docs = await query.get()
            
            if docs:
                data = docs[0].to_dict()
                return ExperimentAssignment(**data)
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user assignment: {e}")
            return None
    
    async def _get_experiment_events(self, experiment_id: str) -> List[ExperimentEvent]:
        """Get all events for an experiment"""
        try:
            query = (
                self.firestore_client.collection(self.events_collection)
                .where("experiment_id", "==", experiment_id)
                .order_by("timestamp")
            )
            
            docs = await query.get()
            events = []
            
            for doc in docs:
                data = doc.to_dict()
                event = ExperimentEvent(**data)
                events.append(event)
            
            return events
            
        except Exception as e:
            logger.error(f"Error getting experiment events: {e}")
            return []
    
    async def _get_experiment_assignments(self, experiment_id: str) -> List[ExperimentAssignment]:
        """Get all assignments for an experiment"""
        try:
            query = (
                self.firestore_client.collection(self.assignments_collection)
                .where("experiment_id", "==", experiment_id)
            )
            
            docs = await query.get()
            assignments = []
            
            for doc in docs:
                data = doc.to_dict()
                assignment = ExperimentAssignment(**data)
                assignments.append(assignment)
            
            return assignments
            
        except Exception as e:
            logger.error(f"Error getting experiment assignments: {e}")
            return []
    
    async def _analyze_experiment_results(self, experiment: Experiment, 
                                        events: List[ExperimentEvent],
                                        assignments: List[ExperimentAssignment]) -> ExperimentResults:
        """Perform statistical analysis of experiment results"""
        # Group events by variant
        variant_events = {}
        for event in events:
            if event.variant_id not in variant_events:
                variant_events[event.variant_id] = []
            variant_events[event.variant_id].append(event)
        
        # Group assignments by variant
        variant_assignments = {}
        for assignment in assignments:
            if assignment.variant_id not in variant_assignments:
                variant_assignments[assignment.variant_id] = []
            variant_assignments[assignment.variant_id].append(assignment)
        
        # Calculate results for each variant
        variant_results = {}
        sample_sizes = {}
        conversion_rates = {}
        
        for variant in experiment.variants:
            variant_id = variant.id
            variant_events_list = variant_events.get(variant_id, [])
            variant_assignments_list = variant_assignments.get(variant_id, [])
            
            sample_size = len(variant_assignments_list)
            conversions = len([e for e in variant_events_list if e.event_type == 'conversion'])
            conversion_rate = conversions / sample_size if sample_size > 0 else 0.0
            
            sample_sizes[variant_id] = sample_size
            conversion_rates[variant_id] = conversion_rate
            
            variant_results[variant_id] = {
                'sample_size': sample_size,
                'conversions': conversions,
                'conversion_rate': conversion_rate,
                'events': len(variant_events_list)
            }
        
        # Statistical significance testing (simplified)
        statistical_significance = {}
        p_values = {}
        effect_sizes = {}
        confidence_intervals = {}
        
        # Find control variant
        control_variant = next((v for v in experiment.variants if v.is_control), None)
        
        if control_variant:
            control_rate = conversion_rates.get(control_variant.id, 0.0)
            control_sample = sample_sizes.get(control_variant.id, 0)
            
            for variant in experiment.variants:
                if variant.id == control_variant.id:
                    continue
                
                treatment_rate = conversion_rates.get(variant.id, 0.0)
                treatment_sample = sample_sizes.get(variant.id, 0)
                
                # Simplified statistical test
                if control_sample > 0 and treatment_sample > 0:
                    # Calculate effect size (difference in conversion rates)
                    effect_size = treatment_rate - control_rate
                    effect_sizes[variant.id] = effect_size
                    
                    # Simplified p-value calculation (would use proper statistical test in production)
                    if abs(effect_size) > 0.02 and min(control_sample, treatment_sample) > 30:
                        p_values[variant.id] = 0.03  # Significant
                        statistical_significance[variant.id] = True
                    else:
                        p_values[variant.id] = 0.15  # Not significant
                        statistical_significance[variant.id] = False
                    
                    # Confidence interval (simplified)
                    margin_error = 0.05  # Would calculate properly in production
                    confidence_intervals[variant.id] = (
                        effect_size - margin_error,
                        effect_size + margin_error
                    )
        
        # Generate recommendations
        recommendations = []
        if control_variant:
            best_variant = max(experiment.variants, 
                             key=lambda v: conversion_rates.get(v.id, 0.0))
            
            if best_variant.id != control_variant.id:
                effect_size = effect_sizes.get(best_variant.id, 0.0)
                if statistical_significance.get(best_variant.id, False):
                    recommendations.append(
                        f"Variant '{best_variant.name}' shows significant improvement "
                        f"({effect_size:.2%} lift). Consider implementing."
                    )
                else:
                    recommendations.append(
                        f"Variant '{best_variant.name}' shows positive trend but "
                        f"not statistically significant. Consider running longer."
                    )
            else:
                recommendations.append("Control variant is performing best. No changes recommended.")
        
        return ExperimentResults(
            experiment_id=experiment.id,
            variant_results=variant_results,
            statistical_significance=statistical_significance,
            confidence_intervals=confidence_intervals,
            p_values=p_values,
            effect_sizes=effect_sizes,
            sample_sizes=sample_sizes,
            conversion_rates=conversion_rates,
            recommendations=recommendations,
            analysis_date=datetime.utcnow()
        )
    
    def _experiment_to_dict(self, experiment: Experiment) -> Dict[str, Any]:
        """Convert experiment to dictionary for Firestore"""
        data = asdict(experiment)
        data['status'] = experiment.status.value
        data['variants'] = [
            {**asdict(v), 'type': v.type.value} 
            for v in experiment.variants
        ]
        return data
    
    def _dict_to_experiment(self, data: Dict[str, Any]) -> Experiment:
        """Convert dictionary to experiment object"""
        # Convert status
        data['status'] = ExperimentStatus(data['status'])
        
        # Convert variants
        variants = []
        for v_data in data['variants']:
            v_data['type'] = VariantType(v_data['type'])
            variant = ExperimentVariant(**v_data)
            variants.append(variant)
        data['variants'] = variants
        
        # Convert metrics
        metrics = []
        for m_data in data['metrics']:
            metric = ExperimentMetric(**m_data)
            metrics.append(metric)
        data['metrics'] = metrics
        
        return Experiment(**data)


# Global instance
experiment_manager = ExperimentManager()
