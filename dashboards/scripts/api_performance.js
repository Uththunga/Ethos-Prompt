/**
 * Dashboard: API Performance Dashboard
 * Auto-generated monitoring dashboard script
 */

class Dashboard {
    constructor() {
        this.config = {
        "id": "api_performance",
        "name": "API Performance Dashboard",
        "description": "Detailed API endpoint performance and usage metrics",
        "created": "2025-07-22T19:16:02.526Z",
        "refreshInterval": 30,
        "widgets": [
                {
                        "id": "api_performance_function_invocations",
                        "type": "metric",
                        "title": "Function Invocations",
                        "query": "cloud_function_invocations",
                        "visualization": "bar_chart",
                        "breakdown": [
                                "generate_prompt",
                                "execute_prompt",
                                "test_cors"
                        ],
                        "refreshInterval": 30
                },
                {
                        "id": "api_performance_function_duration",
                        "type": "metric",
                        "title": "Function Execution Duration",
                        "query": "cloud_function_duration",
                        "visualization": "heatmap",
                        "breakdown": [
                                "generate_prompt",
                                "execute_prompt",
                                "test_cors"
                        ],
                        "refreshInterval": 30
                },
                {
                        "id": "api_performance_api_errors",
                        "type": "metric",
                        "title": "API Errors by Endpoint",
                        "query": "api_errors_by_endpoint",
                        "visualization": "stacked_bar",
                        "breakdown": [
                                "4xx_errors",
                                "5xx_errors"
                        ],
                        "refreshInterval": 30
                },
                {
                        "id": "api_performance_request_volume",
                        "type": "metric",
                        "title": "Request Volume",
                        "query": "requests_per_minute",
                        "visualization": "line_chart",
                        "timeframe": "24h",
                        "refreshInterval": 30
                }
        ]
};
        this.refreshInterval = 30000;
        this.charts = {};
        this.init();
    }

    init() {
        console.log('Initializing API Performance Dashboard...');
        this.loadInitialData();
        this.startAutoRefresh();
    }

    async loadInitialData() {
        for (const widget of this.config.widgets) {
            await this.updateWidget(widget);
        }
        this.updateLastRefreshTime();
    }

    async updateWidget(widget) {
        try {
            const data = await this.fetchWidgetData(widget);
            this.renderWidget(widget, data);
        } catch (error) {
            console.error(`Error updating widget ${widget.id}:`, error);
            this.renderError(widget, error.message);
        }
    }

    async fetchWidgetData(widget) {
        // Simulate data fetching (replace with actual API calls)
        await new Promise(resolve => setTimeout(resolve, 100));
        
        switch (widget.type) {
            case 'metric':
                return this.generateMockMetricData(widget);
            default:
                return { value: 'No data', status: 'unknown' };
        }
    }

    generateMockMetricData(widget) {
        const baseValue = Math.random() * 100;
        const target = widget.target;
        
        let status = 'good';
        if (target) {
            if (widget.title.includes('Error') || widget.title.includes('Response Time')) {
                status = baseValue > target ? 'error' : 'good';
            } else {
                status = baseValue < target ? 'warning' : 'good';
            }
        }
        
        return {
            value: baseValue.toFixed(1),
            target: target,
            status: status,
            unit: this.getUnit(widget.title),
            timestamp: new Date().toISOString()
        };
    }

    getUnit(title) {
        if (title.includes('Time')) return 'ms';
        if (title.includes('Rate') || title.includes('Percentage')) return '%';
        if (title.includes('Count') || title.includes('Users')) return '';
        if (title.includes('Usage') && title.includes('GB')) return 'GB';
        return '';
    }

    renderWidget(widget, data) {
        const contentElement = document.getElementById(`content-${widget.id}`);
        
        const statusClass = `status-${data.status}`;
        const targetText = data.target ? `Target: ${data.target}${data.unit}` : '';
        
        contentElement.innerHTML = `
            <div class="metric-value ${statusClass}">${data.value}${data.unit}</div>
            <div class="metric-target">${targetText}</div>
        `;
    }

    renderError(widget, error) {
        const contentElement = document.getElementById(`content-${widget.id}`);
        contentElement.innerHTML = `<div class="status-error">Error: ${error}</div>`;
    }

    startAutoRefresh() {
        setInterval(() => {
            this.loadInitialData();
        }, this.refreshInterval);
    }

    updateLastRefreshTime() {
        const element = document.getElementById('lastUpdate');
        if (element) {
            element.textContent = new Date().toLocaleTimeString();
        }
    }
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});