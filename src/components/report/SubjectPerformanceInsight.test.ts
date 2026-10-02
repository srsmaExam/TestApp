import { describe, expect, it } from 'vitest';
import { getSubjectPerformanceInsight } from './BoardReadinessReport';

describe('Subject Performance Insight Evaluation (9 Exact Cases)', () => {
  it('Case 1: Dual High (Maths High, Science High — Balanced)', () => {
    const result = getSubjectPerformanceInsight(90, 88);
    expect(result.label).toBe('Dual High — Balanced');
    expect(result.message).toBe(
      'Awesome work! You are in great shape to score top marks in your board exams. To push for a full 100%, focus on writing down every step clearly with proper units, drawing neat diagrams, and practicing full 3-hour sample papers so you don\'t lose marks to tiny calculation slips.',
    );
  });

  it('Case 2: Dual Mid (Maths Mid, Science Mid — Balanced)', () => {
    const result = getSubjectPerformanceInsight(60, 62);
    expect(result.label).toBe('Dual Mid — Balanced');
    expect(result.message).toBe(
      'You have a solid base in both subjects, and you are totally ready to push into the 80s and 90s! Split your study time equally between Maths and Science, and focus on practicing chapter-wise previous years\' board questions (PYQs) so you can get used to how board questions are framed.',
    );
  });

  it('Case 3: Dual Low (Maths Low, Science Low — Balanced)', () => {
    const result = getSubjectPerformanceInsight(10, 15);
    expect(result.label).toBe('Dual Low — Balanced');
    expect(result.message).toBe(
      'Don\'t lose heart at all—everyone starts somewhere, and board exams are very predictable. Put full mock tests on hold for now; just pick the 3 easiest, high-mark chapters in your textbook (like Statistics in Maths or Life Processes in Science) and master the basic examples first to build steady confidence.',
    );
  });

  it('Case 4: Maths High, Science Mid (Maths Much Better)', () => {
    const result = getSubjectPerformanceInsight(88, 65);
    expect(result.label).toBe('Maths Much Better');
    expect(result.message).toBe(
      'Your Maths is looking super strong! Since your problem-solving is already sharp, you can easily pull your Science score up too. Dedicate more of your study time to Science by practicing textbook definitions, balancing chemical equations, and drawing neat, labeled diagrams.',
    );
  });

  it('Case 5: Maths High/Mid, Science Low (Maths Much Better — Wide Gap)', () => {
    const result = getSubjectPerformanceInsight(80, 30);
    expect(result.label).toBe('Maths Much Better — Wide Gap');
    expect(result.message).toBe(
      'Your strong Maths score shows you have great focus and logic—that is a huge advantage! Don\'t stress about Science; it is very scoring once you know the direct textbook questions. Spend 20 minutes a day keeping your Maths sharp, and use the rest of your study time to rebuild Science chapter by chapter.',
    );
  });

  it('Case 6: Maths Ahead, Both Low (Maths Better — Foundational Tier)', () => {
    const result = getSubjectPerformanceInsight(40, 20);
    expect(result.label).toBe('Maths Better — Foundational Tier');
    expect(result.message).toBe(
      'You\'re making steady headway in Maths, and we can do the exact same thing for Science! Take it one step at a time: keep practicing your basic Maths formulas daily, and start Science by reading the easiest chapter summaries and learning the short 1-mark and 2-mark textbook questions.',
    );
  });

  it('Case 7: Science High, Maths Mid (Science Much Better)', () => {
    const result = getSubjectPerformanceInsight(62, 85);
    expect(result.label).toBe('Science Much Better');
    expect(result.message).toBe(
      'You clearly understand your Science concepts really well—great job! For Maths, remember that board examiners give generous step marks even if your final calculation goes off. Spend more of your study time writing out Maths textbook problems by hand so you build speed and avoid small slips.',
    );
  });

  it('Case 8: Science High/Mid, Maths Low (Science Much Better — Wide Gap)', () => {
    const result = getSubjectPerformanceInsight(25, 80);
    expect(result.label).toBe('Science Much Better — Wide Gap');
    expect(result.message).toBe(
      'Scoring well in Science proves you have what it takes to understand big, detailed ideas! Maths only feels tricky when formulas and basic steps are missing. Make a one-page formula sheet for easy chapters like Real Numbers and Statistics, and solve 4 to 5 textbook examples by hand every day—you will see fast results.',
    );
  });

  it('Case 9: Science Ahead, Both Low (Science Better — Foundational Tier)', () => {
    const result = getSubjectPerformanceInsight(20, 38);
    expect(result.label).toBe('Science Better — Foundational Tier');
    expect(result.message).toBe(
      'Your Science gives you a solid starting point, and you can definitely bring your Maths score up alongside it! Focus your energy on direct, high-scoring Maths chapters first—work through simple textbook questions step-by-step, and your marks and confidence will climb quickly.',
    );
  });
});
