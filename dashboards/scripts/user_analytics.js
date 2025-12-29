/**
 * Dashboard: User Analytics Dashboard
 * Auto-generated monitoring dashboard script
 */

class Dashboard {
    constructor() {
        this.config = {
        "id": "user_analytics",
        "name": "User Analytics Dashboard",
        "description": "User behavior, engagement, and authentication metrics",
        "created": "2025-07-22T19:16:02.528Z",
        "refreshInterval": 30,
        "widgets": [
                {
                        "id": "user_analytics_user_registrations",
                        "type": "metric",
                        "title": "New User Registrations",
                        "query": "new_user_registrations",
                        "visualization": "line_chart",
                        "timeframe": "7d",
                        "refreshInterval": 30
                },
                {
                        "id": "user_analytics_authentication_success",
                        "type": "metric",
                        "title": "Authentication Success Rate",
                        "query": "auth_success_rate",
                        "visualization": "gauge",
                        "target": 99,
                        "refreshInterval": 30
                },
                {
                        "id": "user_analytics_user_sessions",
                        "type": "metric",
                        "title": "User Sessions",
                        "query": "user_sessions",
                        "visualization": "area_chart",
                        "breakdown": [
                                "new_sessions",
                                "returning_sessions"
                        ],
                        "refreshInterval": 30
                },
                {
                        "id": "user_analytics_feature_usage",
                        "type": "metric",
                        "title": "Feature Usage",
                        "query": "feature_usage_count",
                        "visualization": "pie_chart",
                        "breakdown": [
                                "prompt_creation",
                                "prompt_execution",
                                "document_upload"
                        ],
                        "refreshInterval": 30
                }
        ]
};
        this.refreshInterval = 30000;
        this.charts = {};
        this.init();
    }

    init() {
        console.log('Initializing User Analytics Dashboard...');
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