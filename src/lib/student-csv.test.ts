import { describe, expect, it } from 'vitest';
import { parseStudentCsv } from './student-csv';

describe('student-csv', () => {
  it('rejects empty input', () => {
    const res = parseStudentCsv('');
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].field).toBe('csv');
  });

  it('rejects input missing required headers', () => {
    const res = parseStudentCsv('username,batch\njohn,JEE-2027');
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].field).toBe('headers');
  });

  it('parses valid CSV rows with optional password fallback', () => {
    const csv = `Full Name, Username, Email, Batch, Password
Alice Smith, alices, alice@example.com, Batch-A, customPass123
Bob Jones, bobj, bob@example.com, Batch-B,`;

    const res = parseStudentCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.validRows).toHaveLength(2);

    expect(res.validRows[0]).toEqual({
      fullName: 'Alice Smith',
      username: 'alices',
      email: 'alice@example.com',
      phone: null,
      batch: 'Batch-A',
      password: 'customPass123',
      rowNumber: 2,
    });

    expect(res.validRows[1]).toEqual({
      fullName: 'Bob Jones',
      username: 'bobj',
      email: 'bob@example.com',
      phone: null,
      batch: 'Batch-B',
      password: '112345', // Default fallback
      rowNumber: 3,
    });
  });

  it('parses phone number from CSV when provided, normalised to E.164 (FBR-05)', () => {
    const csv = `Full Name, Username, Email, Phone, Batch
Student With Phone, phoneuser, phoneuser@example.com, +91 9876543210, Batch-A`;

    const res = parseStudentCsv(csv);
    expect(res.errors).toHaveLength(0);
    expect(res.validRows).toHaveLength(1);
    // FBR-05: stored as E.164, not the raw formatted string — "+91 9876543210"
    // and "9876543210" must resolve to the same identity, not two "different"
    // strings that could collide invisibly at the DB later.
    expect(res.validRows[0].phone).toBe('+919876543210');
  });

  it('catches duplicate usernames and invalid emails', () => {
    const csv = `name,user,mail
User One, user1, notanemail
User Two, user1, user2@example.com`;

    const res = parseStudentCsv(csv);
    expect(res.validRows).toHaveLength(0);
    expect(res.errors).toHaveLength(2);
    expect(res.errors[0].field).toBe('email');
    expect(res.errors[1].field).toBe('username');
    expect(res.errors[1].message).toContain('Duplicate username');
  });

  describe('phone validation (FBR-05)', () => {
    it('catches two different-looking rows that are the same real phone number', () => {
      const csv = `Full Name, Username, Email, Phone
Sibling One, sib1, sib1@example.com, +91 9876543210
Sibling Two, sib2, sib2@example.com, 9876543210`;

      const res = parseStudentCsv(csv);
      // Matches the existing username/email duplicate convention: the first
      // occurrence is valid, the second (the actual duplicate) is rejected.
      expect(res.validRows).toHaveLength(1);
      expect(res.validRows[0].username).toBe('sib1');
      expect(res.errors).toHaveLength(1);
      expect(res.errors[0].field).toBe('phone');
      expect(res.errors[0].message).toContain('Duplicate phone');
    });

    it('rejects a phone number outside the 7-15 digit range', () => {
      const csv = `Full Name, Username, Email, Phone
Bad Phone, badphone, badphone@example.com, 12345`;

      const res = parseStudentCsv(csv);
      expect(res.validRows).toHaveLength(0);
      expect(res.errors).toHaveLength(1);
      expect(res.errors[0].field).toBe('phone');
    });

    it('accepts two genuinely different phone numbers', () => {
      const csv = `Full Name, Username, Email, Phone
Student A, studenta, a@example.com, 9876543210
Student B, studentb, b@example.com, 9876543211`;

      const res = parseStudentCsv(csv);
      expect(res.errors).toHaveLength(0);
      expect(res.validRows).toHaveLength(2);
      expect(res.validRows[0].phone).toBe('+919876543210');
      expect(res.validRows[1].phone).toBe('+919876543211');
    });
  });
});
