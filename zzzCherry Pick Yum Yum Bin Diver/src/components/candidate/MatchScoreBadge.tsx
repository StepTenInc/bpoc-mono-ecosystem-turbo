import React from 'react';
import { Badge } from '@/components/shared/ui/badge';
import { Sparkles } from 'lucide-react';

interface MatchScoreBadgeProps {
    score: number;
    compact?: boolean;
}

export function MatchScoreBadge({ score, compact = false }: MatchScoreBadgeProps) {
    // Determine color and label based on score
    const getMatchLevel = (score: number) => {
        if (score >= 80) {
            return {
                level: 'Excellent Match',
                icon: '🎯',
                className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            };
        } else if (score >= 60) {
            return {
                level: 'Good Match',
                icon: '✨',
                className: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
            };
        } else if (score >= 40) {
            return {
                level: 'Fair Match',
                icon: '🤔',
                className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
            };
        } else {
            return {
                level: 'Low Match',
                icon: '📊',
                className: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
            };
        }
    };

    const matchInfo = getMatchLevel(score);

    if (compact) {
        return (
            <Badge variant="outline" className={matchInfo.className}>
                <Sparkles className="h-3 w-3 mr-1" />
                {score}%
            </Badge>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Badge variant="outline" className={matchInfo.className}>
                <span className="mr-1">{matchInfo.icon}</span>
                <span className="font-medium">{score}%</span>
                <span className="ml-1 text-xs opacity-80">{matchInfo.level}</span>
            </Badge>
        </div>
    );
}
