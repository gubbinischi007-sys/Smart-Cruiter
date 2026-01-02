# Bulk Email Feature - Acceptance & Rejection

## ✅ Yes! Bulk Email Functionality is Available

You can send **bulk acceptance** or **bulk rejection** emails to multiple applicants at once with a single click.

---

## How to Use Bulk Emails

### Step 1: Navigate to Job Detail Page
1. Go to **Jobs** page
2. Click on any job to view its details
3. Scroll down to see the **Applicants** section

### Step 2: Select Applicants
- **Check the checkbox** next to each applicant you want to email
- You can select **multiple applicants** at once
- Use the checkbox in the table header to **select all** applicants at once

### Step 3: Send Bulk Emails
Once you've selected applicants, you'll see two buttons appear:
- **"Send Acceptance (N)"** - Green button for accepted candidates
- **"Send Rejection (N)"** - Red button for rejected candidates

*(N) shows the number of selected applicants*

### Step 4: Confirm and Send
- Click either button
- Confirm the action in the popup
- Emails are sent to all selected applicants

---

## Email Content

### Acceptance Email
**Subject:** `Congratulations! You've been accepted for {Job Title}`

**Content:**
```
Congratulations {First Name}!

We are pleased to inform you that you have been accepted for the position of {Job Title}.

Our HR team will be in touch with you shortly regarding next steps.

Best regards,
Smart-Cruiter Team
```

### Rejection Email
**Subject:** `Application Update: {Job Title}`

**Content:**
```
Thank you for your interest, {First Name}

We appreciate you taking the time to apply for the position of {Job Title}.

After careful consideration, we have decided to move forward with other candidates. 
We encourage you to apply for future opportunities that match your skills and experience.

Best regards,
Smart-Cruiter Team
```

---

## Important Notes

### Email Configuration
- **If email is configured** (EMAIL_USER and EMAIL_PASS in `.env`): Emails are actually sent
- **If email is NOT configured**: Email content is logged to the console (useful for development/testing)

### Email Status
After sending bulk emails, you'll see:
- Success message with number of emails sent
- Failed count (if any emails failed to send)
- Error details (if any)

### Best Practices
1. ✅ **Review applicants** before selecting for bulk emails
2. ✅ **Verify email addresses** are correct in applicant records
3. ✅ **Test with one email first** before bulk sending
4. ✅ **Keep email template professional** and personalized

---

## Example Workflow

```
1. HR reviews 50 applicants for a Software Engineer position
2. HR selects 10 applicants to accept → clicks "Send Acceptance (10)"
3. System sends personalized acceptance emails to all 10 candidates
4. HR selects 40 applicants to reject → clicks "Send Rejection (40)"
5. System sends personalized rejection emails to all 40 candidates
6. All done in 2 clicks! 🎉
```

---

## Technical Details

### API Endpoints
- `POST /api/emails/bulk-acceptance` - Send bulk acceptance emails
- `POST /api/emails/bulk-rejection` - Send bulk rejection emails

### Request Format
```json
{
  "applicant_ids": ["id1", "id2", "id3", ...]
}
```

### Response Format
```json
{
  "message": "Sent 10 acceptance emails",
  "successful": 10,
  "failed": 0,
  "errors": []
}
```

---

## Troubleshooting

**Problem:** Emails not sending
- **Solution:** Check email configuration in `server/.env`
- Make sure EMAIL_USER and EMAIL_PASS are set correctly

**Problem:** Some emails failed
- **Solution:** Check the response for error details
- Verify email addresses in applicant records

**Problem:** Want to customize email content
- **Solution:** Edit email templates in `server/src/routes/emails.ts`

