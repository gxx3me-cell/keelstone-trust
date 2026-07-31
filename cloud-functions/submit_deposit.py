# submit-deposit
#
# An investor tells us they've sent funds to one of our published deposit
# addresses. Nothing is credited here — this only files a PENDING request that
# an admin reviews in the admin console (admin-action approves it).
#
# The deposit may optionally be tied to an investment plan. If plan_id is
# omitted the funds land in the investor's general balance once approved, and
# they can allocate to a plan later.
#
# Payload: {
#   "amount": "5000",
#   "method_id": "<lumen_deposit_methods doc id>",
#   "plan_id": "<lumen_plans doc id>" | null,
#   "reference": "0xabc… tx hash or exchange reference"   (optional)
# }

BRAND = "Keelstone Trust"


def _site_url():
    return config.get("site_url", "https://keelstone-trust.com").rstrip("/")


def _admin_email_html(investor_name, investor_email, amount, method_label, plan_label, reference):
    ref_row = ""
    if reference:
        ref_row = f"""
                <tr>
                  <td style="padding:7px 0;font-size:13px;color:#8a829a;">Reference</td>
                  <td style="padding:7px 0;font-size:13px;color:#111018;font-family:monospace;word-break:break-all;">{reference}</td>
                </tr>"""

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
                <div style="font-size:11px;color:rgba(255,255,255,.55);text-transform:uppercase;letter-spacing:.1em;margin-top:3px;">Admin Notification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111018;">New deposit request</h1>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">
                  An investor has submitted a deposit request and is waiting on confirmation.
                  Verify the funds arrived, then approve or reject it in the admin console.
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8e3f0;margin-bottom:24px;">
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#8a829a;width:38%;">Investor</td>
                    <td style="padding:7px 0;font-size:13px;color:#111018;font-weight:600;">{investor_name}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#8a829a;">Email</td>
                    <td style="padding:7px 0;font-size:13px;color:#111018;">{investor_email}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#8a829a;">Amount</td>
                    <td style="padding:7px 0;font-size:15px;color:#111018;font-weight:700;">${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#8a829a;">Method</td>
                    <td style="padding:7px 0;font-size:13px;color:#111018;">{method_label}</td>
                  </tr>
                  <tr>
                    <td style="padding:7px 0;font-size:13px;color:#8a829a;">Destination</td>
                    <td style="padding:7px 0;font-size:13px;color:#111018;">{plan_label}</td>
                  </tr>{ref_row}
                </table>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#6d28d9;border-radius:6px;">
                      <a href="{_site_url()}/admin" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Review in admin console</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f8f6fc;padding:18px 32px;border-top:1px solid #e8e3f0;">
                <p style="margin:0;font-size:11.5px;line-height:1.6;color:#8a829a;">
                  &copy; 2026 {BRAND}. Automated notification — please don't reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _notify_admins(investor_name, investor_email, amount, method_label, plan_label, reference):
    """Email every admin. Never let a send failure fail the request itself."""
    try:
        users = db.list_app_users(limit=200)
    except Exception:
        return

    rows = users.get("data") if isinstance(users, dict) else users
    body = _admin_email_html(investor_name, investor_email, amount, method_label, plan_label, reference)

    for u in (rows or []):
        if "admin" not in (u.get("roles") or []):
            continue
        addr = u.get("email")
        if not addr:
            continue
        try:
            req.send_mail(
                to=addr,
                subject=f"New deposit request — ${amount} from {investor_name}",
                body=body,
            )
        except Exception:
            continue


def main():
    user = req.user
    if not user:
        return {"error": "You must be signed in to make a deposit."}, 401

    payload = req.payload or {}

    # ── Amount ──
    raw_amount = str(payload.get("amount") or "").replace(",", "").strip()
    try:
        amount = float(raw_amount)
    except Exception:
        return {"error": "Enter a valid deposit amount."}, 400
    if amount <= 0:
        return {"error": "Enter a valid deposit amount."}, 400

    # ── Deposit method (must be one we actually published) ──
    method_id = (payload.get("method_id") or "").strip()
    if not method_id:
        return {"error": "Choose a deposit method."}, 400
    try:
        method = db.get_document("lumen_deposit_methods", method_id)
    except Exception:
        method = None
    if not method:
        return {"error": "That deposit method is no longer available."}, 400

    method_data = method.get("data") or {}
    if method_data.get("active") is False:
        return {"error": "That deposit method is no longer available."}, 400

    method_name = method_data.get("name") or "Deposit"
    method_network = method_data.get("network") or ""
    method_label = f"{method_name} ({method_network})" if method_network else method_name

    # ── Plan (optional — omitted means "deposit to balance") ──
    plan_id = (payload.get("plan_id") or "").strip() or None
    plan_name = None
    annual_return_pct = 0
    if plan_id:
        try:
            plan = db.get_document("lumen_plans", plan_id)
        except Exception:
            plan = None
        if not plan:
            return {"error": "That investment plan is no longer available."}, 400

        plan_data = plan.get("data") or {}
        plan_name = plan_data.get("name")
        annual_return_pct = float(plan_data.get("annual_return_pct") or 0)

        min_usd = float(plan_data.get("min_usd") or 0)
        max_usd = float(plan_data.get("max_usd") or 0)
        if min_usd and amount < min_usd:
            return {"error": f"The minimum for {plan_name} is ${min_usd:,.0f}."}, 400
        if max_usd and amount > max_usd:
            return {"error": f"The maximum for {plan_name} is ${max_usd:,.0f}."}, 400

    plan_label = plan_name or "General balance (unallocated)"

    user_data = user.get("data") or {}
    investor_name = (
        user_data.get("full_name")
        or " ".join(filter(None, [user_data.get("first_name"), user_data.get("last_name")])).strip()
        or user.get("email")
        or "Investor"
    )

    reference = (payload.get("reference") or "").strip()

    record = {
        "user_id": user["id"],
        "user_email": user.get("email"),
        "user_name": investor_name,
        "amount": amount,
        "status": "pending",
        "method": method_label,
        "method_id": method_id,
        "method_name": method_name,
        "method_network": method_network,
        "wallet_address": method_data.get("wallet_address"),
        "plan_id": plan_id,
        "plan_name": plan_name,
        "annual_return_pct": annual_return_pct,
        "created_at": datetime.utcnow().isoformat(),
    }
    # A reference that looks like a BSC tx hash goes in tx_hash too, so the
    # admin table renders it as a BscScan link.
    if reference:
        record["reference"] = reference
        if reference.startswith("0x") and len(reference) == 66:
            record["tx_hash"] = reference

    try:
        created = db.create_document("lumen_deposits", record)
    except Exception:
        return {"error": "Could not submit your deposit request. Please try again."}, 500

    _notify_admins(investor_name, user.get("email"), f"{amount:,.2f}", method_label, plan_label, reference)

    return {
        "ok": True,
        "deposit_id": created.get("id") if isinstance(created, dict) else None,
        "status": "pending",
        "message": "Your deposit request has been submitted and is awaiting confirmation.",
    }
