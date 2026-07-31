# send_welcome_email
#
# Sent once, right after an investor creates their account.
#
# The job of this email is to move a brand-new signup toward their first
# deposit. It does that in a specific order:
#   1. Welcome + reassurance (they just handed us their details)
#   2. Verify email — the blocker, so it comes first
#   3. Complete KYC — the regulatory gate before money can move
#   4. Fund the account — the thing we actually want
#
# It is deliberately urgent without being pushy: the reason to hurry is framed
# as "returns accrue daily, so earlier capital earns more", which is true and
# in the investor's own interest, rather than manufactured scarcity.
#
# Payload: { "email": "investor@example.com" }  (optional — defaults to req.user)
# Idempotent: writes data.welcome_email_sent_at and refuses to send twice.

BRAND = "Keelstone Trust"


def _site_url():
    return config.get("site_url", "https://keelstone-trust.com").rstrip("/")


def _welcome_html(first_name):
    site = _site_url()
    greeting = f"Welcome, {first_name}." if first_name else "Welcome."

    steps = [
        (
            "1",
            "Verify your email",
            "Confirm your address so we can secure your account and send you "
            "activity alerts. There is a verification link in your inbox — it "
            "takes one click.",
        ),
        (
            "2",
            "Complete your identity check",
            "Every investor completes a short identity verification (KYC) "
            "before funds can move. It is a regulatory requirement and it "
            "protects your account. Have a government-issued ID handy — most "
            "people finish in under five minutes.",
        ),
        (
            "3",
            "Make your first deposit",
            "Choose a strategy, send your deposit, and our team confirms it. "
            "Your capital starts accruing from the day it is confirmed — so "
            "the sooner it lands, the sooner it works for you.",
        ),
    ]

    steps_html = ""
    for num, title, body in steps:
        steps_html += f"""
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
                  <tr>
                    <td width="34" valign="top" style="padding-top:2px;">
                      <div style="width:26px;height:26px;border-radius:50%;background:#6d28d9;color:#ffffff;font-size:13px;font-weight:700;text-align:center;line-height:26px;">{num}</div>
                    </td>
                    <td valign="top">
                      <div style="font-size:15px;font-weight:700;color:#111018;margin-bottom:4px;">{title}</div>
                      <div style="font-size:14px;line-height:1.6;color:#3d3450;">{body}</div>
                    </td>
                  </tr>
                </table>"""

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
              <td style="padding:32px 32px 8px;">
                <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#111018;">{greeting}</h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">
                  Your {BRAND} account is open. You are three short steps away from
                  having your capital professionally managed.
                </p>
                <p style="margin:0 0 26px;font-size:15px;line-height:1.65;color:#3d3450;">
                  Returns accrue <b>daily</b> from the moment a deposit is confirmed,
                  so finishing setup early genuinely matters — every day your account
                  sits idle is a day it is not earning.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                {steps_html}
              </td>
            </tr>
            <tr>
              <td style="padding:14px 32px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 18px;">
                  <tr>
                    <td style="background:#6d28d9;border-radius:6px;">
                      <a href="{site}/dashboard" style="display:inline-block;padding:15px 30px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Complete my setup</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 6px;font-size:13px;line-height:1.6;color:#8a829a;">
                  Prefer to talk it through first? Reply to this email and an advisor
                  will walk you through your options — there is no obligation to invest.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:#f8f6fc;padding:18px 32px;border-top:1px solid #e8e3f0;">
                <p style="margin:0 0 6px;font-size:11.5px;line-height:1.6;color:#8a829a;">
                  Capital is at risk. Past performance does not guarantee future
                  results. Target returns are not guaranteed.
                </p>
                <p style="margin:0;font-size:11.5px;line-height:1.6;color:#8a829a;">
                  &copy; 2026 {BRAND}. You received this because an account was created
                  with this address.
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

    # Prefer the signed-in user; fall back to an explicit email for admin resends.
    user = req.user
    if not user:
        email = (payload.get("email") or "").strip().lower()
        if not email:
            return {"error": "No recipient."}, 400
        try:
            user = db.get_app_user_by_email(email)
        except Exception:
            user = None
        if not user:
            # Never confirm whether an address has an account.
            return {"ok": True}

    to = user.get("email")
    if not to:
        return {"ok": True}

    user_data = user.get("data") or {}

    # Only ever send once per account.
    if user_data.get("welcome_email_sent_at") and not payload.get("force"):
        return {"ok": True, "skipped": "already_sent"}

    first_name = (user_data.get("first_name") or "").strip()

    try:
        req.send_mail(
            to=to,
            subject=f"Welcome to {BRAND} — 3 steps to start earning",
            body=_welcome_html(first_name),
        )
    except Exception:
        # Don't fail signup because email is misconfigured.
        return {"ok": False, "error": "send_failed"}

    try:
        db.update_app_user(user["id"], data={"welcome_email_sent_at": datetime.utcnow().isoformat()})
    except Exception:
        pass

    return {"ok": True}
