# Security Spec for Mochi Study

## Data Invariants
- Users can only read and write their own profile (`users/{userId}`).
- Users can only read and write their own application data (`userData/{userId}`).
- Profile updates must maintain the user's `uid` and `email`.
- Timestamps and stats must be non-negative.

## The Dirty Dozen Payloads
1. Attempt to write to `users/otherUID` as `testUID`.
2. Attempt to write to `userData/otherUID` as `testUID`.
3. Attempt to change `uid` in a `users` document update.
4. Attempt to change `email` in a `users` document update.
5. Attempt to set `streak` to a negative number.
6. Attempt to set `totalHours` to a negative number.
7. Attempt to inject 1MB string into `name`.
8. Attempt to inject script tags into `bio`.
9. Attempt to read `users/otherUID` without admin privileges.
10. Attempt to write a profile without being signed in.
11. Attempt to update a profile with extra "ghost" fields like `isAdmin: true`.
12. Attempt to create a profile with a stolen email but `email_verified: false`.

## The Test Runner
(I will assume standard testing environment or just proceed to rules generation)
