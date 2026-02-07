import React from 'react';
import { Card, CardContent } from '@/components/shared/ui/card';
import { CheckCircle, AlertCircle, Lightbulb, BarChart3 } from 'lucide-react';
import { MatchScoreBreakdown } from '@/lib/matching/types';

interface MatchInsightsProps {
    reasons: string[];
    concerns: string[];
    summary: string;
    breakdown?: MatchScoreBreakdown;
}

export function MatchInsights({
    reasons,
    concerns,
    summary,
    breakdown,
}: MatchInsightsProps) {
    return (
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm mt-3">
            <CardContent className="p-4 space-y-4">
                {/* AI Summary */}
                <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-300">{summary}</p>
                </div>

                {/* Match Reasons */}
                {reasons && reasons.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-emerald-400 uppercase">
                            Why This Matches
                        </h4>
                        <ul className="space-y-1">
                            {reasons.map((reason, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                    <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Concerns */}
                {concerns && concerns.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-yellow-400 uppercase">
                            Considerations
                        </h4>
                        <ul className="space-y-1">
                            {concerns.map((concern, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                    <span>{concern}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Score Breakdown */}
                {breakdown && (
                    <div className="space-y-2 pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase">
                            <BarChart3 className="h-3 w-3" />
                            Score Breakdown
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <ScoreItem label="Skills" score={breakdown.skills_score} />
                            <ScoreItem label="Salary" score={breakdown.salary_score} />
                            <ScoreItem label="Experience" score={breakdown.experience_score} />
                            <ScoreItem label="Arrangement" score={breakdown.arrangement_score} />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function ScoreItem({ label, score }: { label: string; score: number }) {
    const getColor = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-gray-500';
    };

    return (
        <div className="space-y-1">
            <div className="flex justify-between text-xs">
                <span className="text-gray-400">{label}</span>
                <span className="text-gray-300 font-medium">{score}%</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${getColor(score)} transition-all duration-500`}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    );
}
