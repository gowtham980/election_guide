import { describe, it, expect } from 'vitest';
import { extractRoadmapStep, extractSuggestions, cleanText } from '../App';

// ─── extractRoadmapStep ────────────────────────────────────────────────────────
describe('extractRoadmapStep', () => {
  it('extracts a valid step number from a response', () => {
    const text = 'Here is some info about voter registration.\nROADMAP_STEP:0';
    expect(extractRoadmapStep(text)).toBe(0);
  });

  it('extracts the maximum step value (4)', () => {
    const text = 'You are ready to vote! 🗳️\nROADMAP_STEP:4';
    expect(extractRoadmapStep(text)).toBe(4);
  });

  it('returns null when no ROADMAP_STEP tag is present', () => {
    const text = 'This is a generic response with no tags.';
    expect(extractRoadmapStep(text)).toBeNull();
  });

  it('handles step 0 without mistaking it for falsy', () => {
    const text = 'Let\'s start with registration.\nROADMAP_STEP:0\nSUGGESTIONS:["Next"]';
    expect(extractRoadmapStep(text)).toBe(0);
  });

  it('extracts step from middle of a long response', () => {
    const text = 'Para 1.\nPara 2.\nROADMAP_STEP:3\nSUGGESTIONS:["Ok"]';
    expect(extractRoadmapStep(text)).toBe(3);
  });
});

// ─── extractSuggestions ───────────────────────────────────────────────────────
describe('extractSuggestions', () => {
  it('extracts a standard suggestions array', () => {
    const text = 'Some answer.\nROADMAP_STEP:1\nSUGGESTIONS:["How do I register?", "What is EPIC?"]';
    expect(extractSuggestions(text)).toEqual(['How do I register?', 'What is EPIC?']);
  });

  it('returns an empty array when no SUGGESTIONS tag is present', () => {
    const text = 'An answer with no suggestions.';
    expect(extractSuggestions(text)).toEqual([]);
  });

  it('returns an empty array on malformed JSON', () => {
    const text = 'SUGGESTIONS:[broken json}';
    expect(extractSuggestions(text)).toEqual([]);
  });

  it('handles multiline suggestions JSON gracefully', () => {
    // AI might wrap long suggestions across lines
    const text = 'Answer.\nROADMAP_STEP:2\nSUGGESTIONS:[\n"Option A",\n"Option B"\n]';
    expect(extractSuggestions(text)).toEqual(['Option A', 'Option B']);
  });

  it('handles a single suggestion in the array', () => {
    const text = 'SUGGESTIONS:["Find my booth"]';
    expect(extractSuggestions(text)).toEqual(['Find my booth']);
  });
});

// ─── cleanText ────────────────────────────────────────────────────────────────
describe('cleanText', () => {
  it('strips ROADMAP_STEP and SUGGESTIONS tags from the end', () => {
    const raw = 'Great answer!\nROADMAP_STEP:2\nSUGGESTIONS:["Next", "Back"]';
    expect(cleanText(raw)).toBe('Great answer!');
  });

  it('leaves the core content intact', () => {
    const raw = 'Jai Hind! 🇮🇳 Welcome.\nROADMAP_STEP:0\nSUGGESTIONS:["Start"]';
    expect(cleanText(raw)).toBe('Jai Hind! 🇮🇳 Welcome.');
  });

  it('is a no-op when there are no metadata tags', () => {
    const raw = 'Just a plain response.';
    expect(cleanText(raw)).toBe('Just a plain response.');
  });

  it('handles multiline suggestions in cleanText', () => {
    const raw = 'Answer.\nROADMAP_STEP:3\nSUGGESTIONS:[\n"A",\n"B"\n]';
    expect(cleanText(raw)).toBe('Answer.');
  });

  it('does not strip content that contains the word ROADMAP in normal text', () => {
    const raw = 'Your roadmap journey begins here!\nROADMAP_STEP:0\nSUGGESTIONS:["Go"]';
    expect(cleanText(raw)).toContain('Your roadmap journey begins here!');
  });
});
