import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Search,
    TrendingUp,
    Users,
    Target,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react';
import {
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell
} from 'recharts';

interface SearchAnalyticsProps {
  data: {
    total_searches: number;
    unique_queries: number;
    avg_results_per_search: number;
    most_popular_queries: Array<{
      query: string;
      count: number;
      avg_response_time: number;
    }>;
    search_type_breakdown: Record<string, number>;
    intent_distribution: Record<string, number>;
    spell_corrections: number;
    query_expansions: number;
  };
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

export const SearchAnalytics: React.FC<SearchAnalyticsProps> = ({ data }) => {
  const searchTypeData = Object.entries(data.search_type_breakdown).map(([type, count]) => ({
    name: type,
    value: count
  }));

  const intentData = Object.entries(data.intent_distribution).map(([intent, count]) => ({
    name: intent,
    value: count
  }));

  const enhancementRate = data.total_searches > 0 ?
    ((data.spell_corrections + data.query_expansions) / data.total_searches) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold">{data.total_searches.toLocaleString()}</p>
              </div>
              <Search className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Queries</p>
                <p className="text-2xl font-bold">{data.unique_queries.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Results</p>
                <p className="text-2xl font-bold">{data.avg_results_per_search.toFixed(1)}</p>
              </div>
              <Target className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Enhancement Rate</p>
                <p className="text-2xl font-bold">{enhancementRate.toFixed(1)}%</p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            <span>Most Popular Queries</span>
          </CardTitle>
          <CardDescription>
            Top search queries by frequency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            {data.most_popular_queries.slice(0, 10).map((query, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium truncate">{query.query}</span>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    Avg response: {query.avg_response_time.toFixed(2)}s
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{query.count}</div>
                  <div className="text-sm text-gray-500">searches</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search Type and Intent Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <span>Search Type Distribution</span>
            </CardTitle>
            <CardDescription>
              Breakdown of search methods used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={searchTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {searchTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              <span>Query Intent Distribution</span>
            </CardTitle>
            <CardDescription>
              Classification of user search intents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {Object.entries(data.intent_distribution).map(([intent, count], index) => {
                const total = Object.values(data.intent_distribution).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={intent} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium capitalize">{intent}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query Enhancement Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Query Enhancement Statistics</CardTitle>
          <CardDescription>
            Automatic query improvements and corrections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {data.spell_corrections}
              </div>
              <div className="text-sm text-gray-600 mt-1">Spell Corrections</div>
              <div className="text-xs text-gray-500 mt-1">
                {data.total_searches > 0 ?
                  `${((data.spell_corrections / data.total_searches) * 100).toFixed(1)}% of searches` :
                  '0% of searches'
                }
              </div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {data.query_expansions}
              </div>
              <div className="text-sm text-gray-600 mt-1">Query Expansions</div>
              <div className="text-xs text-gray-500 mt-1">
                {data.total_searches > 0 ?
                  `${((data.query_expansions / data.total_searches) * 100).toFixed(1)}% of searches` :
                  '0% of searches'
                }
              </div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {enhancementRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Enhancement Rate</div>
              <div className="text-xs text-gray-500 mt-1">
                Queries improved automatically
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Search Performance Insights</CardTitle>
          <CardDescription>
            Key insights from search analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Query Diversity</div>
                <div className="text-sm text-gray-600">
                  {data.unique_queries} unique queries out of {data.total_searches} total searches
                  ({data.total_searches > 0 ? ((data.unique_queries / data.total_searches) * 100).toFixed(1) : 0}% diversity)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Search Quality</div>
                <div className="text-sm text-gray-600">
                  Average of {data.avg_results_per_search.toFixed(1)} results per search indicates
                  {data.avg_results_per_search > 5 ? ' good' : data.avg_results_per_search > 2 ? ' moderate' : ' low'}
                  content relevance
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div>
                <div className="font-medium">Enhancement Impact</div>
                <div className="text-sm text-gray-600">
                  {enhancementRate.toFixed(1)}% of searches benefit from automatic improvements
                  (spell correction and query expansion)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
