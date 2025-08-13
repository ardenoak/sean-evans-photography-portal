# Bug Report Template

**Date:** [YYYY-MM-DD]  
**Reporter:** [Name]  
**Severity:** [CRITICAL | HIGH | MEDIUM | LOW]  
**Status:** [OPEN | IN PROGRESS | RESOLVED | CLOSED]  

## **Bug Summary**
Brief, clear description of the bug in one sentence.

## **Environment**
- **Browser:** [Chrome 118, Safari 17, Firefox 119, etc.]
- **Device:** [Desktop, Mobile, Tablet - specific model if relevant]
- **Screen Size:** [1920x1080, iPhone 14 Pro, etc.]
- **User Role:** [Admin, Client, Public]
- **URL:** [Specific page where bug occurs]

## **Steps to Reproduce**
1. Step 1: Detailed action
2. Step 2: Detailed action  
3. Step 3: Detailed action
4. **Expected Result:** What should happen
5. **Actual Result:** What actually happens

## **Error Details**

### **Console Errors**
```
[Copy any console errors here]
```

### **Network Errors**
```
[Copy any network/API errors here]
```

### **Screenshots**
- [ ] Screenshot attached showing the issue
- [ ] Console screenshot if applicable
- [ ] Network tab screenshot if relevant

## **Impact Assessment**

### **User Impact**
- **Affected Users:** [All users | Admin only | Specific user type]
- **Frequency:** [Always | Sometimes | Rarely]
- **Workaround Available:** [Yes/No - describe if yes]

### **Business Impact**
- **Revenue Impact:** [None | Minor | Significant]
- **Data Integrity:** [Not affected | At risk]
- **User Experience:** [Critical | Minor annoyance]

## **Additional Context**

### **Related Issues**
- **Similar Bugs:** Links to related bug reports
- **Recent Changes:** Any recent deployments or changes
- **Browser Compatibility:** Does it happen in all browsers?

### **Data Context**
- **Specific Data:** Does it happen with specific data sets?
- **User Permissions:** Related to specific user roles?
- **Timing:** Does it happen at specific times?

## **Investigation Notes**
[Space for developer investigation notes]

### **Root Cause**
[To be filled by developer investigating]

### **Fix Description**
[Description of the fix implemented]

## **Testing Verification**

### **Fix Verification Steps**
1. [ ] Step 1: Verify original issue resolved
2. [ ] Step 2: Test edge cases
3. [ ] Step 3: Regression testing
4. [ ] Step 4: Cross-browser testing

### **Test Results**
- [ ] **Chrome:** Verified working
- [ ] **Safari:** Verified working  
- [ ] **Firefox:** Verified working
- [ ] **Mobile:** Verified working
- [ ] **Edge Cases:** All tested and working

## **Resolution**

**Fixed Date:** [YYYY-MM-DD]  
**Fixed By:** [Developer name]  
**Deployment Date:** [YYYY-MM-DD]  

### **Files Changed**
- [ ] `/path/to/file1.tsx` - Description of changes
- [ ] `/path/to/file2.ts` - Description of changes
- [ ] Database migrations if applicable

### **Version**
**Git Commit:** [commit hash]  
**PR Number:** [#123]  

---

## **Severity Guidelines**

### **CRITICAL**
- System completely broken
- Data loss or corruption
- Security vulnerabilities
- Complete inability to use core features

### **HIGH**  
- Major feature broken
- Significant user experience degradation
- Business process interruption
- Affects large number of users

### **MEDIUM**
- Minor feature issues
- Cosmetic problems that affect usability
- Workarounds available
- Limited user impact

### **LOW**
- Cosmetic issues
- Nice-to-have improvements
- Edge cases
- Minimal user impact

---

**Usage Instructions:**
1. Fill out all relevant sections when reporting a bug
2. Assign appropriate severity level
3. Include screenshots whenever possible
4. Update status as investigation progresses
5. Archive resolved bugs in `/docs/bugs/resolved/`