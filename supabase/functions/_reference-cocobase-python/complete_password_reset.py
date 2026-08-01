# complete-password-reset
#
# Consumes a token issued by `request-password-reset` and sets the new password.
# Runs with service privileges, so it can set the password WITHOUT the user's
# own auth token (db.update_app_user auto-hashes it).
#
# Payload: { "token": "...", "new_password": "..." }
# Returns: { "ok": True } or { "error": "..." }, <status>

MIN_PASSWORD_LENGTH = 8
BRAND = "Keelstone Trust"

# Deliberately vague: never reveal whether a token was wrong, expired, or reused.
INVALID = "This reset link is invalid or has expired. Please request a new one."


def _confirmation_html(first_name):
    greeting = f"Hello {first_name}," if first_name else "Hello,"
    return f"""<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8f6fc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6fc;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e8e3f0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:#111018;padding:26px 32px;">
                <div style="font-size:20px;color:#ffffff;letter-spacing:.3px;">{BRAND}</div>
                <div style="font-size:11px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">Investor Portal</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111018;">Your password was changed</h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">{greeting}</p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
                  The password on your {BRAND} account was just reset successfully.
                  You can now sign in with your new password.
                </p>
                <p style="margin:0;padding-top:20px;border-top:1px solid #e8e3f0;font-size:13px;line-height:1.6;color:#8a829a;">
                  <strong style="color:#b91c1c;">If this wasn't you</strong>, contact us
                  immediately at contact@keelstone-trust.com — your account may be at risk.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8f6fc;padding:18px 32px;border-top:1px solid #e8e3f0;">
                <p style="margin:0;font-size:11.5px;line-height:1.6;color:#8a829a;">
                  &copy; 2026 {BRAND}. This is an automated message — please don't reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def main():
    payload = req.payload or {}
    token = (payload.get("token") or "").strip()
    new_password = payload.get("new_password") or ""

    if not token:
        return {"error": INVALID}, 400

    if len(new_password) < MIN_PASSWORD_LENGTH:
        return {"error": f"Password must be at least {MIN_PASSWORD_LENGTH} characters."}, 400

    token_hash = hashlib.sha256(token.encode()).hexdigest()

    # Find the user holding this token hash. Tokens are single-use and short
    # lived, so at most one user should ever match.
    try:
        result = db.query_users(limit=200)
        candidates = result.get("data", result) if isinstance(result, dict) else result
    except Exception:
        return {"error": "Could not verify this reset link. Please try again."}, 500

    matched = None
    for u in (candidates or []):
        reset = ((u.get("data") or {}).get("pw_reset") or {})
        if reset.get("token_hash") and secrets.compare_digest(str(reset["token_hash"]), token_hash):
            matched = u
            break

    if not matched:
        return {"error": INVALID}, 400

    reset = (matched.get("data") or {}).get("pw_reset") or {}

    if reset.get("used"):
        return {"error": INVALID}, 400

    try:
        expires_at = datetime.fromisoformat(str(reset.get("expires_at")))
    except Exception:
        return {"error": INVALID}, 400

    if datetime.utcnow() > expires_at:
        return {"error": INVALID}, 400

    # Set the password and burn the token in one write.
    try:
        db.update_app_user(
            matched["id"],
            password=new_password,
            data={
                "pw_reset": {
                    "token_hash": None,
                    "expires_at": None,
                    "used": True,
                }
            },
        )
    except Exception:
        return {"error": "Could not update your password. Please request a new link."}, 500

    # Courtesy notification — never block the reset if this fails.
    try:
        req.send_mail(
            to=matched.get("email"),
            subject=f"Your {BRAND} password was changed",
            body=_confirmation_html((matched.get("data") or {}).get("first_name") or ""),
        )
    except Exception:
        pass

    return {"ok": True}
