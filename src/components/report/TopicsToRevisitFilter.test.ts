import { describe, expect, it } from 'vitest';
import { getDisplayedMathsTopics, getDisplayedScienceTopics } from './BoardReadinessReport';
import type { TopicToRevisitItem } from '@/lib/diagnostic-evaluator';

const createMockTopic = (
  qno: number,
  subject: string,
  chapter: string,
  topic: string,
): TopicToRevisitItem => ({
  qno,
  subject,
  chapter,
  topic,
  issueObserved: 'Test Issue',
  category: 'Conceptual / Calculation Gap',
  recommendedFocusArea: 'Focus',
  timeTaken: 90,
  expectedLimit: 60,
  isCorrect: false,
  attempted: true,
});

describe('Topics to Revisit Filtering', () => {
  describe('Maths Topics Filtering (Max 3 chapters)', () => {
    it('returns all topics if count <= 3', () => {
      const items = [
        createMockTopic(1, 'Maths', 'Real Numbers', 'Euclid Lemma'),
        createMockTopic(2, 'Maths', 'Polynomials', 'Zeroes'),
      ];
      const result = getDisplayedMathsTopics(items, 3);
      expect(result).toHaveLength(2);
      expect(result.map((r) => r.qno)).toEqual([1, 2]);
    });

    it('limits to 3 distinct chapters when more topics exist', () => {
      const items = [
        createMockTopic(1, 'Maths', 'Real Numbers', 'Topic A'),
        createMockTopic(2, 'Maths', 'Real Numbers', 'Topic B'),
        createMockTopic(3, 'Maths', 'Polynomials', 'Topic C'),
        createMockTopic(4, 'Maths', 'Quadratic Equations', 'Topic D'),
        createMockTopic(5, 'Maths', 'Triangles', 'Topic E'),
        createMockTopic(6, 'Maths', 'Statistics', 'Topic F'),
      ];
      const result = getDisplayedMathsTopics(items, 3);
      expect(result).toHaveLength(3);
      const chapters = result.map((r) => r.chapter);
      // All 3 selected chapters must be distinct
      expect(new Set(chapters).size).toBe(3);
    });
  });

  describe('Science Topics Filtering (Diversity of Physics, Chemistry, Biology)', () => {
    it('returns all topics if count <= 3', () => {
      const items = [
        createMockTopic(1, 'Physics', 'Light', 'Reflection'),
        createMockTopic(2, 'Chemistry', 'Acids and Bases', 'pH scale'),
      ];
      const result = getDisplayedScienceTopics(items, 3);
      expect(result).toHaveLength(2);
    });

    it('ensures diversity across Physics, Chemistry, and Biology when more topics exist', () => {
      const items = [
        createMockTopic(1, 'Physics', 'Light', 'Reflection'),
        createMockTopic(2, 'Physics', 'Electricity', 'Ohms Law'),
        createMockTopic(3, 'Physics', 'Magnetic Effects', 'Fleming Rule'),
        createMockTopic(4, 'Chemistry', 'Chemical Reactions', 'Balancing'),
        createMockTopic(5, 'Chemistry', 'Acids and Bases', 'Neutralization'),
        createMockTopic(6, 'Biology', 'Life Processes', 'Photosynthesis'),
        createMockTopic(7, 'Biology', 'Control and Coordination', 'Reflex Arc'),
      ];
      const result = getDisplayedScienceTopics(items, 3);
      expect(result).toHaveLength(3);

      const subjects = result.map((r) => r.subject.toLowerCase());
      expect(subjects).toContain('physics');
      expect(subjects).toContain('chemistry');
      expect(subjects).toContain('biology');
    });

    it('handles cases where one discipline has no errors gracefully', () => {
      // Only Physics and Chemistry errors, no Biology
      const items = [
        createMockTopic(1, 'Physics', 'Light', 'Reflection'),
        createMockTopic(2, 'Physics', 'Electricity', 'Ohms Law'),
        createMockTopic(3, 'Chemistry', 'Chemical Reactions', 'Balancing'),
        createMockTopic(4, 'Chemistry', 'Acids and Bases', 'Neutralization'),
      ];
      const result = getDisplayedScienceTopics(items, 3);
      expect(result).toHaveLength(3);
      // Distinct chapters across available disciplines
      const chapters = result.map((r) => r.chapter);
      expect(new Set(chapters).size).toBe(3);
    });
  });
});
