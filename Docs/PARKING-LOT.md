# Parking Lot - Tournament Manager

Ideas and suggestions for future consideration.

---

## Inbox
*Raw ideas awaiting triage*

### Transaction Log Editor
**Priority:** TBD

Add JavaScript functions to manually edit transaction history - WITH CAUTION!
- **Access:** Browser console only (F12) - ZERO UI exposure
- **Use case:** Emergency fixes for corrupted tournament states
- **Implementation ideas:**
  - `editTransaction(index, newData)` - Edit specific transaction
  - `deleteTransaction(index)` - Remove transaction from history
  - `validateTransactionLog()` - Check integrity before/after edits
  - Functions print strong warnings to console when called
  - **Automatic safety backup:** Export current tournament JSON before any edit
  - Automatic backup of transaction log before any edit
  - Validation to prevent creating impossible states
- **Risk:** Could break tournament integrity if misused
- **Philosophy:** Hidden power tool for experts who know how to open browser console
- **Security by obscurity:** Only accessible to users who understand JavaScript and transaction structure

### DOCKER-QUICKSTART.md Enhancements
**Priority:** Low

**Missing sections:**
**Version Updates** - Explain `:latest`, `:3.0.2`, and `:3` tags; safe upgrade procedures

---

## Next
*Ready for implementation when time permits*

*(empty)*

---

## Later
*Worth tracking but not urgent*

*(empty)*

---

**Last updated:** October 22, 2025
