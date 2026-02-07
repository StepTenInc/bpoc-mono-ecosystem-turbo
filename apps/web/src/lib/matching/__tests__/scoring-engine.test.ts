/**
 * Unit Tests for Job Matching Scoring Engine
 * Tests skills, salary, experience, shift, location, and overall scoring
 */

import {
  calculateSkillsScore,
  calculateSalaryScore,
  calculateExperienceScore,
  calculateArrangementScore,
  calculateShiftCompatibility,
  calculateLocationCompatibility,
  calculateUrgencyScore,
  calculateOverallScore,
  calculateMatchScores,
} from '../scoring-engine';
import { CandidateData, JobData, MatchScoreBreakdown } from '../types';

describe('Scoring Engine Tests', () => {
  // Mock candidate data
  const mockCandidate: CandidateData = {
    id: 'candidate-1',
    skills: [
      { name: 'JavaScript', proficiency_level: 4 },
      { name: 'React', proficiency_level: 5 },
      { name: 'TypeScript', proficiency_level: 3 },
    ],
    work_experiences: [],
    expected_salary_min: 30000,
    expected_salary_max: 50000,
    experience_years: 3,
    preferred_shift: 'day',
    preferred_work_setup: 'hybrid',
    work_status: 'actively_looking',
    location_city: 'Manila',
    location_region: 'NCR',
    location_country: 'Philippines',
  };

  const mockJob: JobData = {
    id: 'job-1',
    title: 'Senior React Developer',
    description: 'Looking for experienced React developer',
    skills: ['JavaScript', 'React', 'Node.js'],
    salary_min: 40000,
    salary_max: 60000,
    currency: 'PHP',
    work_arrangement: 'hybrid',
    shift: 'day',
    location_city: 'Manila',
    location_region: 'NCR',
    location_country: 'Philippines',
  };

  describe('calculateSkillsScore', () => {
    test('should return 100 when all required skills match', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        skills: [
          { name: 'JavaScript', proficiency_level: 5 },
          { name: 'React', proficiency_level: 5 },
          { name: 'Node.js', proficiency_level: 4 },
        ],
      };
      const score = calculateSkillsScore(candidate, mockJob);
      expect(score).toBeGreaterThanOrEqual(90);
    });

    test('should return lower score when some skills are missing', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        skills: [
          { name: 'JavaScript', proficiency_level: 3 },
        ],
      };
      const score = calculateSkillsScore(candidate, mockJob);
      expect(score).toBeLessThan(50);
    });

    test('should return 100 when job has no required skills', () => {
      const job: JobData = {
        ...mockJob,
        skills: [],
      };
      const score = calculateSkillsScore(mockCandidate, job);
      expect(score).toBe(100);
    });
  });

  describe('calculateSalaryScore', () => {
    test('should return high score for overlapping salary ranges', () => {
      const score = calculateSalaryScore(mockCandidate, mockJob);
      expect(score).toBeGreaterThanOrEqual(85);
    });

    test('should return low score when candidate expects too much', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        expected_salary_min: 70000,
        expected_salary_max: 90000,
      };
      const score = calculateSalaryScore(candidate, mockJob);
      expect(score).toBeLessThan(30);
    });

    test('should return neutral score when salary not specified', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        expected_salary_min: undefined,
        expected_salary_max: undefined,
      };
      const score = calculateSalaryScore(candidate, mockJob);
      expect(score).toBe(85);
    });
  });

  describe('calculateExperienceScore', () => {
    test('should return 100 for matching experience level', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        experience_years: 5,
      };
      const job: JobData = {
        ...mockJob,
        title: 'Senior Developer',
      };
      const score = calculateExperienceScore(candidate, job);
      expect(score).toBeGreaterThanOrEqual(85);
    });

    test('should penalize significant underqualification', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        experience_years: 0,
      };
      const job: JobData = {
        ...mockJob,
        title: 'Senior Lead Developer',
      };
      const score = calculateExperienceScore(candidate, job);
      expect(score).toBeLessThan(50);
    });
  });

  describe('calculateShiftCompatibility', () => {
    test('should return 100 for perfect shift match', () => {
      const score = calculateShiftCompatibility(mockCandidate, mockJob);
      expect(score).toBe(100);
    });

    test('should return 90 for flexible candidate', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        preferred_shift: 'flexible',
      };
      const score = calculateShiftCompatibility(candidate, mockJob);
      expect(score).toBe(90);
    });

    test('should return 30 for day candidate with night job', () => {
      const job: JobData = {
        ...mockJob,
        shift: 'night',
      };
      const score = calculateShiftCompatibility(mockCandidate, job);
      expect(score).toBe(30);
    });

    test('should return 50 for night candidate with day job', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        preferred_shift: 'night',
      };
      const score = calculateShiftCompatibility(candidate, mockJob);
      expect(score).toBe(50);
    });

    test('should return 90 for flexible job', () => {
      const job: JobData = {
        ...mockJob,
        shift: 'flexible',
      };
      const score = calculateShiftCompatibility(mockCandidate, job);
      expect(score).toBe(90);
    });
  });

  describe('calculateLocationCompatibility', () => {
    test('should return 100 for same city', () => {
      const score = calculateLocationCompatibility(mockCandidate, mockJob);
      expect(score).toBe(100);
    });

    test('should return 80 for same region, different city', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        location_city: 'Quezon City',
        location_region: 'NCR',
      };
      const score = calculateLocationCompatibility(candidate, mockJob);
      expect(score).toBe(80);
    });

    test('should return 90 for remote job regardless of location', () => {
      const job: JobData = {
        ...mockJob,
        work_arrangement: 'remote',
      };
      const score = calculateLocationCompatibility(mockCandidate, job);
      expect(score).toBe(90);
    });

    test('should return 40 for different city with onsite job', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        location_city: 'Cebu',
        location_region: 'Central Visayas',
      };
      const job: JobData = {
        ...mockJob,
        work_arrangement: 'onsite',
      };
      const score = calculateLocationCompatibility(candidate, job);
      expect(score).toBe(40);
    });
  });

  describe('calculateArrangementScore', () => {
    test('should return 100 for perfect work arrangement match', () => {
      const score = calculateArrangementScore(mockCandidate, mockJob);
      expect(score).toBe(100);
    });

    test('should return 30 for remote candidate with onsite job', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        preferred_work_setup: 'remote',
      };
      const job: JobData = {
        ...mockJob,
        work_arrangement: 'onsite',
      };
      const score = calculateArrangementScore(candidate, job);
      expect(score).toBe(30);
    });
  });

  describe('calculateUrgencyScore', () => {
    test('should return 100 for actively looking candidates', () => {
      const score = calculateUrgencyScore(mockCandidate);
      expect(score).toBe(100);
    });

    test('should return 70 for open to offers', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        work_status: 'open_to_offers',
      };
      const score = calculateUrgencyScore(candidate);
      expect(score).toBe(70);
    });

    test('should return 30 for not looking', () => {
      const candidate: CandidateData = {
        ...mockCandidate,
        work_status: 'employed_not_looking',
      };
      const score = calculateUrgencyScore(candidate);
      expect(score).toBe(30);
    });
  });

  describe('calculateOverallScore', () => {
    test('should calculate weighted average correctly', () => {
      const breakdown: MatchScoreBreakdown = {
        skills_score: 80,
        salary_score: 90,
        experience_score: 85,
        arrangement_score: 100,
        shift_score: 100,
        location_score: 100,
        urgency_score: 100,
      };

      const overall = calculateOverallScore(breakdown);

      // Manual calculation:
      // 80*0.35 + 90*0.25 + 85*0.15 + 100*0.10 + 100*0.05 + 100*0.05 + 100*0.05
      // = 28 + 22.5 + 12.75 + 10 + 5 + 5 + 5 = 88.25
      expect(overall).toBeCloseTo(88, 0);
    });

    test('should handle low scores', () => {
      const breakdown: MatchScoreBreakdown = {
        skills_score: 30,
        salary_score: 20,
        experience_score: 40,
        arrangement_score: 50,
        shift_score: 30,
        location_score: 40,
        urgency_score: 50,
      };

      const overall = calculateOverallScore(breakdown);
      expect(overall).toBeLessThan(40);
    });
  });

  describe('calculateMatchScores', () => {
    test('should calculate all scores and return breakdown', () => {
      const breakdown = calculateMatchScores(mockCandidate, mockJob);

      expect(breakdown).toHaveProperty('skills_score');
      expect(breakdown).toHaveProperty('salary_score');
      expect(breakdown).toHaveProperty('experience_score');
      expect(breakdown).toHaveProperty('arrangement_score');
      expect(breakdown).toHaveProperty('shift_score');
      expect(breakdown).toHaveProperty('location_score');
      expect(breakdown).toHaveProperty('urgency_score');

      expect(breakdown.skills_score).toBeGreaterThanOrEqual(0);
      expect(breakdown.skills_score).toBeLessThanOrEqual(100);
    });

    test('should produce high overall score for good match', () => {
      const breakdown = calculateMatchScores(mockCandidate, mockJob);
      const overall = calculateOverallScore(breakdown);

      expect(overall).toBeGreaterThanOrEqual(70);
    });
  });
});
