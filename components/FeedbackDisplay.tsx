import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import type { AnalysisReport, BodySegment, FeedbackIssue } from '@/types/pose';

interface FeedbackDisplayProps {
  analysisReport: AnalysisReport;
  onSegmentPress?: (segment: BodySegment) => void;
}

/**
 * FeedbackDisplay Component
 * 
 * Displays analysis results with categorized feedback issues.
 * Shows overall score, feedback categories, and individual issues with severity badges.
 */
export function FeedbackDisplay({ analysisReport, onSegmentPress }: FeedbackDisplayProps) {
  const { overallScore, categories } = analysisReport;

  // Determine score color based on value
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Determine severity badge color
  const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
    }
  };

  const handleIssuePress = (issue: FeedbackIssue) => {
    if (onSegmentPress) {
      onSegmentPress(issue.segment);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Overall Score Section */}
      <View className="bg-white p-6 items-center border-b border-gray-200">
        <Text className="text-gray-600 text-lg mb-2">Overall Score</Text>
        <Text className={`text-6xl font-bold ${getScoreColor(overallScore)}`}>
          {overallScore}
        </Text>
        <Text className="text-gray-500 text-sm mt-1">out of 100</Text>
      </View>

      {/* Feedback Categories */}
      <View className="p-4">
        {categories.map((category, categoryIndex) => (
          <View
            key={categoryIndex}
            className="bg-white rounded-lg p-4 mb-4 shadow-sm"
          >
            {/* Category Header */}
            <Text className="text-xl font-semibold text-gray-800 mb-3">
              {category.name}
            </Text>

            {/* Category Issues */}
            {category.issues.length === 0 ? (
              <Text className="text-gray-500 italic">No issues detected</Text>
            ) : (
              category.issues.map((issue, issueIndex) => (
                <TouchableOpacity
                  key={issueIndex}
                  onPress={() => handleIssuePress(issue)}
                  className="mb-4 last:mb-0"
                  activeOpacity={0.7}
                >
                  {/* Issue Header with Severity Badge */}
                  <View className="flex-row items-center mb-2">
                    <View
                      className={`${getSeverityColor(issue.severity)} px-3 py-1 rounded-full mr-2`}
                    >
                      <Text className="text-white text-xs font-semibold uppercase">
                        {issue.severity}
                      </Text>
                    </View>
                    <Text className="text-gray-700 font-medium flex-1">
                      {issue.segment.charAt(0).toUpperCase() + issue.segment.slice(1)}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {issue.deviationDegrees.toFixed(1)}°
                    </Text>
                  </View>

                  {/* Issue Description */}
                  <Text className="text-gray-600 text-sm mb-2 leading-5">
                    {issue.description}
                  </Text>

                  {/* Recommendation */}
                  <View className="bg-blue-50 p-3 rounded-md">
                    <Text className="text-blue-900 text-xs font-semibold mb-1">
                      RECOMMENDATION
                    </Text>
                    <Text className="text-blue-800 text-sm leading-5">
                      {issue.recommendation}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
