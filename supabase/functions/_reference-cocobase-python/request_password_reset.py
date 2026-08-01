# request-password-reset
#
# Issues our OWN password reset token and sends OUR OWN branded email.
# CocoBase's built-in /auth-collections/forgot-password is NOT used, because it
# sends its own email and never hands us the token.
#
# The token is stored (hashed) on the user's own record under data.pw_reset,
# so no extra collection is needed.
#
# Payload: { "email": "investor@example.com" }
# Always returns the same generic message so this cannot be used to discover
# which email addresses have accounts.

RESET_TTL_MINUTES = 30
BRAND = "Keelstone Trust"


def _site_url():
    # Configurable so the link works in dev and prod without a code change.
    return config.get("site_url", "https://keelstone-trust.com").rstrip("/")


def _email_html(first_name, reset_link):
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
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111018;">Reset your password</h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">{greeting}</p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
                  We received a request to reset the password on your {BRAND} account.
                  Click the button below to choose a new one. This link expires in
                  {RESET_TTL_MINUTES} minutes and can only be used once.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td style="background:#6d28d9;border-radius:6px;">
                      <a href="{reset_link}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Reset my password</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#8a829a;">
                  If the button doesn't work, paste this into your browser:
                </p>
                <p style="margin:0 0 24px;font-size:12px;line-height:1.6;color:#6d28d9;word-break:break-all;">{reset_link}</p>
                <p style="margin:0;padding-top:20px;border-top:1px solid #e8e3f0;font-size:13px;line-height:1.6;color:#8a829a;">
                  If you didn't request this, you can safely ignore this email —
                  your password will stay exactly as it is.
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
    email = (payload.get("email") or "").strip().lower()

    # Same response in every branch below — never reveal whether an account exists.
    generic = {"ok": True, "message": "If that email is registered, a reset link is on its way."}

    if not email or "@" not in email:
        return generic

    try:
        user = db.get_app_user_by_email(email)
    except Exception:
        user = None

    if not user:
        return generic

    # Raw token goes in the email; only its hash is stored.
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = (datetime.utcnow() + timedelta(minutes=RESET_TTL_MINUTES)).isoformat()

    # Writing a fresh pw_reset block replaces any previous one, so requesting a
    # new link automatically invalidates the older outstanding token.
    try:
        db.update_app_user(
            user["id"],
            data={
                "pw_reset": {
                    "token_hash": token_hash,
                    "expires_at": expires_at,
                    "used": False,
                }
            },
        )
    except Exception:
        return generic

    reset_link = f"{_site_url()}/reset-password?token={raw_token}"
    first_name = (user.get("data") or {}).get("first_name") or ""

    try:
        req.send_mail(
            to=email,
            subject=f"Reset your {BRAND} password",
            body=_email_html(first_name, reset_link),
        )
    except Exception:
        # Don't leak send failures to the caller.
        pass

    return generic
