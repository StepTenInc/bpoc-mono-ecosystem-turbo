# BPOC Known Bugs & Issues

> **Bug Registry and Issue Tracking**
> 
> Last Updated: January 15, 2026

---

## ACTIVE BUGS

### High Priority

None currently reported.

### Medium Priority

None currently reported.

### Low Priority

None currently reported.

---

## RESOLVED BUGS

Track resolved bugs here with resolution date and method.

---

## KNOWN LIMITATIONS

### Video Calls
- Daily.co room tokens expire after 24 hours
- Maximum call duration: 4 hours
- Recording size limit: 2GB per call

### File Uploads
- Resume file size limit: 10MB
- Supported formats: PDF, DOC, DOCX
- Images: Max 5MB

### Database
- Application status transitions must follow defined flow
- Cannot delete applications with associated offers
- Cannot delete jobs with active applications

---

## BROWSER COMPATIBILITY

### Fully Supported
- ✅ Chrome 90+
- ✅ Safari 14+
- ✅ Firefox 88+
- ✅ Edge 90+

### Limited Support
- ⚠️ Mobile Safari: Video calls may require specific permissions
- ⚠️ Chrome on iOS: Uses Safari engine, same limitations

### Not Supported
- ❌ Internet Explorer (any version)
- ❌ Browsers without WebRTC support

---

## WORKAROUNDS

### Issue: Video call not connecting
**Workaround**: 
1. Check browser permissions for camera/microphone
2. Refresh the page
3. Try incognito/private mode
4. Check firewall settings

### Issue: Resume upload fails
**Workaround**:
1. Check file size (max 10MB)
2. Ensure file format is PDF/DOC/DOCX
3. Try different browser
4. Check internet connection

---

## REPORTING NEW BUGS

When reporting a bug, include:

1. **Title**: Brief description
2. **Severity**: High/Medium/Low
3. **User Role**: Candidate/Recruiter/Client/Admin
4. **Steps to Reproduce**: Detailed steps
5. **Expected Behavior**: What should happen
6. **Actual Behavior**: What actually happens
7. **Browser/Device**: Browser version, OS
8. **Screenshots**: If applicable
9. **Console Errors**: Any JavaScript errors

### Template

```markdown
## Bug Title

**Severity**: High/Medium/Low  
**User Role**: Candidate/Recruiter/Client/Admin  
**Discovered**: YYYY-MM-DD

### Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- Browser: Chrome 120
- OS: Windows 11
- User: test@example.com

### Console Errors
```
Error message here
```

### Screenshots
(Attach screenshots)
```

---

**Last Updated**: January 15, 2026  
**Maintained By**: BPOC Development Team
