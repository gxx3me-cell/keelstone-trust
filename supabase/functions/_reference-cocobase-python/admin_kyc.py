# admin_kyc
#
# Approve or reject an investor's KYC submission.
# Admin-only: an admin cannot write to another user's record from the browser
# SDK, so the decision has to be applied here with service privileges.
#
# Payload: { "user_id": "...", "action": "approve" | "reject", "reason": "..." }

BRAND = "Keelstone Trust"


def _email_html(first_name, approved, reason):
    greeting = f"Hello {first_name}," if first_name else "Hello,"
    if approved:
        headline = "Your identity has been verified"
        message = (
            f"Thank you for completing verification. Your {BRAND} account is now "
            "fully activated, with higher limits and faster withdrawal processing."
        )
        accent = "#137045"
    else:
        headline = "We need another look at your documents"
        reason_line = f"<p style=\"margin:0 0 22px;padding:12px 14px;background:#fdeeec;border-radius:8px;font-size:14px;line-height:1.6;color:#c0392f;\"><strong>Reason:</strong> {reason}</p>" if reason else ""
        message = (
            "We weren't able to verify the documents you submitted. "
            f"{reason_line}"
            "You can submit again from your account settings — make sure every "
            "corner of the document is visible and the image is in focus."
        )
        accent = "#c0392f"

    return f"""<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f7f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f5;padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #dde5e0;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#0b3622;padding:26px 32px;">
            <div style="font-size:20px;color:#ffffff;letter-spacing:.3px;">{BRAND}</div>
            <div style="font-size:11px;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">Investor Portal</div>
          </td></tr>
          <tr><td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#0f1b16;">{headline}</h1>
            <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d4c45;">{greeting}</p>
            <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d4c45;">{message}</p>
            <p style="margin:0;padding-top:20px;border-top:1px solid #dde5e0;font-size:13px;line-height:1.6;color:#64756c;">
              Questions? Reply to this email or contact us at contact@keelstone-trust.com.
            </p>
          </td></tr>
          <tr><td style="background:#f4f7f5;padding:18px 32px;border-top:1px solid #dde5e0;">
            <p style="margin:0;font-size:11.5px;line-height:1.6;color:#64756c;">&copy; 2026 {BRAND}. Automated message.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>"""


def main():
    # ── authorise ────────────────────────────────────────────
    if not req.user or "admin" not in (req.user.get("roles") or []):
        return {"error": "Forbidden"}, 403

    payload = req.payload or {}
    user_id = (payload.get("user_id") or "").strip()
    action = (payload.get("action") or "").strip().lower()
    reason = (payload.get("reason") or "").strip()

    if not user_id:
        return {"error": "user_id is required"}, 400
    if action not in ("approve", "reject"):
        return {"error": "action must be 'approve' or 'reject'"}, 400
    if action == "reject" and not reason:
        return {"error": "A reason is required when rejecting."}, 400

    # ── load target user ─────────────────────────────────────
    try:
        target = db.find_user(id=user_id)
    except Exception:
        target = None
    if not target:
        return {"error": "Investor not found"}, 404

    existing = (target.get("data") or {}).get("kyc") or {}
    if not existing.get("submitted_at"):
        return {"error": "This investor has not submitted KYC."}, 400

    # ── apply the decision ───────────────────────────────────
    approved = action == "approve"
    reviewer = req.user.get("email") or req.user.get("id")

    updated_kyc = dict(existing)
    updated_kyc.update({
        "status": "verified" if approved else "rejected",
        "reviewed_at": datetime.utcnow().isoformat(),
        "reviewed_by": reviewer,
        "rejection_reason": None if approved else reason,
    })

    try:
        db.update_app_user(user_id, data={"kyc": updated_kyc})
    except Exception as e:
        return {"error": f"Could not update this investor: {e}"}, 500

    # ── notify the investor (never block on email failure) ───
    try:
        req.send_mail(
            to=target.get("email"),
            subject=(
                f"Your {BRAND} identity verification is complete"
                if approved else
                f"Action needed on your {BRAND} verification"
            ),
            body=_email_html((target.get("data") or {}).get("first_name") or "", approved, reason),
        )
    except Exception:
        pass

    return {"ok": True, "status": updated_kyc["status"]}
