#!/usr/bin/env python3
"""
Free Models Performance Testing Script
Task 0.2: Test Free Model Performance

Tests all free models for:
- Response quality
- Stability
- Latency
- Token generation speed
- Error rates

Generates performance report in CSV and JSON formats.
"""

import asyncio
import sys
import os
import json
import csv
import time
from datetime import datetime
from typing import Dict, List, Any
from dataclasses import dataclass, asdict

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.llm.free_models_config import (
    ALL_FREE_MODELS,
    FreeModelConfig,
    get_model_by_id
)
from src.llm.openrouter_client import OpenRouterClient, OpenRouterConfig
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


@dataclass
class TestResult:
    """Result of a single model test"""
    model_id: str
    model_name: str
    provider: str
    test_type: str
    prompt: str
    response: str
    success: bool
    latency_ms: float
    tokens_used: int
    tokens_per_second: float
    error_message: str = ""
    timestamp: str = ""


class FreeModelsPerformanceTester:
    """Test suite for free models performance"""
    
    # Test prompts for different use cases
    TEST_PROMPTS = {
        "general": "Explain what artificial intelligence is in 2-3 sentences.",
        "coding": "Write a Python function to calculate the factorial of a number.",
        "reasoning": "If all roses are flowers and some flowers fade quickly, can we conclude that some roses fade quickly? Explain your reasoning.",
        "creative": "Write a short haiku about technology.",
        "analysis": "Compare and contrast machine learning and deep learning in 3 key points.",
        "instruction": "List 3 benefits of using free AI models for development.",
        "speed_test": "Say 'Hello World' and nothing else."
    }
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.results: List[TestResult] = []
        
    async def test_model(
        self,
        model: FreeModelConfig,
        test_type: str,
        prompt: str
    ) -> TestResult:
        """Test a single model with a specific prompt"""
        
        print(f"  Testing {model.display_name} - {test_type}...", end=" ", flush=True)
        
        config = OpenRouterConfig(
            api_key=self.api_key,
            model=model.model_id,
            max_tokens=500,
            temperature=0.7,
            timeout=30
        )
        
        start_time = time.time()
        
        try:
            async with OpenRouterClient(config) as client:
                response = await client.generate_response(prompt=prompt)
                
                latency_ms = (time.time() - start_time) * 1000
                tokens_used = response.usage.get('total_tokens', 0)
                tokens_per_second = tokens_used / (latency_ms / 1000) if latency_ms > 0 else 0
                
                result = TestResult(
                    model_id=model.model_id,
                    model_name=model.display_name,
                    provider=model.provider,
                    test_type=test_type,
                    prompt=prompt,
                    response=response.content[:200],  # Truncate for storage
                    success=True,
                    latency_ms=latency_ms,
                    tokens_used=tokens_used,
                    tokens_per_second=tokens_per_second,
                    timestamp=datetime.now().isoformat()
                )
                
                print(f"✅ {latency_ms:.0f}ms, {tokens_per_second:.1f} tok/s")
                return result
                
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            
            result = TestResult(
                model_id=model.model_id,
                model_name=model.display_name,
                provider=model.provider,
                test_type=test_type,
                prompt=prompt,
                response="",
                success=False,
                latency_ms=latency_ms,
                tokens_used=0,
                tokens_per_second=0,
                error_message=str(e),
                timestamp=datetime.now().isoformat()
            )
            
            print(f"❌ Error: {str(e)[:50]}")
            return result
    
    async def test_all_models(self, test_types: List[str] = None):
        """Test all free models with specified test types"""
        
        if test_types is None:
            test_types = ["general", "speed_test"]  # Default quick tests
        
        print(f"\n{'='*70}")
        print(f"🧪 FREE MODELS PERFORMANCE TEST")
        print(f"{'='*70}")
        print(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Models to test: {len(ALL_FREE_MODELS)}")
        print(f"Test types: {', '.join(test_types)}")
        print(f"{'='*70}\n")
        
        for i, model in enumerate(ALL_FREE_MODELS, 1):
            print(f"\n[{i}/{len(ALL_FREE_MODELS)}] {model.display_name} ({model.provider})")
            print(f"  Model ID: {model.model_id}")
            print(f"  Context: {model.context_length:,} tokens")
            
            for test_type in test_types:
                if test_type not in self.TEST_PROMPTS:
                    print(f"  ⚠️  Unknown test type: {test_type}")
                    continue
                
                prompt = self.TEST_PROMPTS[test_type]
                result = await self.test_model(model, test_type, prompt)
                self.results.append(result)
                
                # Small delay between tests to avoid rate limiting
                await asyncio.sleep(1)
    
    def generate_report(self, output_dir: str = "docs"):
        """Generate performance report in multiple formats"""
        
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # CSV Report
        csv_path = os.path.join(output_dir, f"free_models_performance_{timestamp}.csv")
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            if self.results:
                writer = csv.DictWriter(f, fieldnames=asdict(self.results[0]).keys())
                writer.writeheader()
                for result in self.results:
                    writer.writerow(asdict(result))
        
        print(f"\n✅ CSV report saved: {csv_path}")
        
        # JSON Report
        json_path = os.path.join(output_dir, f"free_models_performance_{timestamp}.json")
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump([asdict(r) for r in self.results], f, indent=2)
        
        print(f"✅ JSON report saved: {json_path}")
        
        # Summary Report
        self._generate_summary_report(output_dir, timestamp)
    
    def _generate_summary_report(self, output_dir: str, timestamp: str):
        """Generate human-readable summary report"""
        
        summary_path = os.path.join(output_dir, f"free_models_summary_{timestamp}.md")
        
        # Calculate statistics
        successful_tests = [r for r in self.results if r.success]
        failed_tests = [r for r in self.results if not r.success]
        
        # Group by model
        model_stats = {}
        for result in self.results:
            if result.model_id not in model_stats:
                model_stats[result.model_id] = {
                    'name': result.model_name,
                    'provider': result.provider,
                    'tests': [],
                    'successes': 0,
                    'failures': 0,
                    'avg_latency': 0,
                    'avg_tokens_per_sec': 0
                }
            
            model_stats[result.model_id]['tests'].append(result)
            if result.success:
                model_stats[result.model_id]['successes'] += 1
            else:
                model_stats[result.model_id]['failures'] += 1
        
        # Calculate averages
        for model_id, stats in model_stats.items():
            successful = [t for t in stats['tests'] if t.success]
            if successful:
                stats['avg_latency'] = sum(t.latency_ms for t in successful) / len(successful)
                stats['avg_tokens_per_sec'] = sum(t.tokens_per_second for t in successful) / len(successful)
        
        # Write summary
        with open(summary_path, 'w', encoding='utf-8') as f:
            f.write(f"# Free Models Performance Test Summary\n\n")
            f.write(f"**Date:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"## Overview\n\n")
            f.write(f"- **Total Tests:** {len(self.results)}\n")
            f.write(f"- **Successful:** {len(successful_tests)} ({len(successful_tests)/len(self.results)*100:.1f}%)\n")
            f.write(f"- **Failed:** {len(failed_tests)} ({len(failed_tests)/len(self.results)*100:.1f}%)\n")
            f.write(f"- **Models Tested:** {len(model_stats)}\n\n")
            
            f.write(f"## Model Performance Rankings\n\n")
            f.write(f"### By Latency (Lower is Better)\n\n")
            f.write(f"| Rank | Model | Provider | Avg Latency | Success Rate |\n")
            f.write(f"|------|-------|----------|-------------|-------------|\n")
            
            sorted_by_latency = sorted(
                model_stats.items(),
                key=lambda x: x[1]['avg_latency'] if x[1]['successes'] > 0 else float('inf')
            )
            
            for rank, (model_id, stats) in enumerate(sorted_by_latency, 1):
                if stats['successes'] > 0:
                    success_rate = stats['successes'] / len(stats['tests']) * 100
                    f.write(f"| {rank} | {stats['name']} | {stats['provider']} | "
                           f"{stats['avg_latency']:.0f}ms | {success_rate:.0f}% |\n")
            
            f.write(f"\n### By Tokens/Second (Higher is Better)\n\n")
            f.write(f"| Rank | Model | Provider | Tokens/Sec | Success Rate |\n")
            f.write(f"|------|-------|----------|------------|-------------|\n")
            
            sorted_by_speed = sorted(
                model_stats.items(),
                key=lambda x: x[1]['avg_tokens_per_sec'],
                reverse=True
            )
            
            for rank, (model_id, stats) in enumerate(sorted_by_speed, 1):
                if stats['successes'] > 0:
                    success_rate = stats['successes'] / len(stats['tests']) * 100
                    f.write(f"| {rank} | {stats['name']} | {stats['provider']} | "
                           f"{stats['avg_tokens_per_sec']:.1f} | {success_rate:.0f}% |\n")
            
            f.write(f"\n## Detailed Results\n\n")
            for model_id, stats in sorted(model_stats.items(), key=lambda x: x[1]['name']):
                f.write(f"### {stats['name']} ({stats['provider']})\n\n")
                f.write(f"- **Model ID:** `{model_id}`\n")
                f.write(f"- **Tests Run:** {len(stats['tests'])}\n")
                f.write(f"- **Successes:** {stats['successes']}\n")
                f.write(f"- **Failures:** {stats['failures']}\n")
                
                if stats['successes'] > 0:
                    f.write(f"- **Avg Latency:** {stats['avg_latency']:.0f}ms\n")
                    f.write(f"- **Avg Speed:** {stats['avg_tokens_per_sec']:.1f} tokens/sec\n")
                
                f.write(f"\n")
        
        print(f"✅ Summary report saved: {summary_path}")


async def main():
    """Main test execution"""
    
    # Check for API key
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("❌ Error: OPENROUTER_API_KEY not found in environment variables")
        print("Please set it in your .env file or environment")
        sys.exit(1)
    
    print(f"✅ OpenRouter API Key found: {api_key[:20]}...")
    
    # Create tester
    tester = FreeModelsPerformanceTester(api_key)
    
    # Run tests (you can customize test types)
    test_types = ["general", "speed_test", "coding"]  # Add more as needed
    
    await tester.test_all_models(test_types=test_types)
    
    # Generate reports
    tester.generate_report()
    
    print(f"\n{'='*70}")
    print(f"✅ Testing complete!")
    print(f"{'='*70}\n")


if __name__ == "__main__":
    asyncio.run(main())

