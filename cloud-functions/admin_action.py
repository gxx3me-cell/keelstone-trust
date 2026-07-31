# admin-action
#
# Approve or reject a pending deposit / withdrawal.
#
# Approving a DEPOSIT is what actually credits the investor:
#   - deposit named a plan  → an active investment is created, earning from now
#   - deposit named no plan → it just becomes spendable balance
#     (get-my-portfolio counts approved, unallocated deposits as balance)
#
# Approving a WITHDRAWAL only marks it paid — payouts are sent by hand.
#
# Payload: { "type": "deposit"|"withdrawal", "record_id": "...",
#            "action": "approve"|"reject", "note": "" }

BRAND = "Keelstone Trust"

COLLECTION = {"deposit": "lumen_deposits", "withdrawal": "lumen_withdrawals"}


def _site_url():
    return config.get("site_url", "https://keelstone-trust.com").rstrip("/")


def _investor_email_html(first_name, headline, body_text, cta_label="View my dashboard"):
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
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:600;color:#111018;">{headline}</h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#3d3450;">{greeting}</p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.65;color:#3d3450;">{body_text}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="background:#6d28d9;border-radius:6px;">
                      <a href="{_site_url()}/dashboard" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">{cta_label}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="background:#f8f6fc;padding:18px 32px;border-top:1px solid #e8e3f0;">
                <p style="margin:0;font-size:11.5px;line-height:1.6;color:#8a829a;">
                  &copy; 2026 {BRAND}. Automated message — please don't reply.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _notify(record_data, subject, headline, body_text):
    to = record_data.get("user_email")
    if not to:
        return
    first = (record_data.get("user_name") or "").split(" ")[0]
    try:
        req.send_mail(to=to, subject=subject, body=_investor_email_html(first, headline, body_text))
    except Exception:
        pass


def main():
    user = req.user
    if not user or "admin" not in (user.get("roles") or []):
        return {"error": "Admins only."}, 403

    payload = req.payload or {}
    rec_type = (payload.get("type") or "").strip()
    record_id = (payload.get("record_id") or "").strip()
    action = (payload.get("action") or "").strip()
    note = (payload.get("note") or "").strip()

    collection = COLLECTION.get(rec_type)
    if not collection:
        return {"error": "Unknown record type."}, 400
    if not record_id:
        return {"error": "Missing record id."}, 400
    if action not in ("approve", "reject"):
        return {"error": "Action must be approve or reject."}, 400

    try:
        record = db.get_document(collection, record_id)
    except Exception:
        record = None
    if not record:
        return {"error": "That request no longer exists."}, 404

    d = record.get("data") or {}
    if d.get("status") != "pending":
        return {"error": f"This request was already {d.get('status')}."}, 400

    amount = float(d.get("amount") or 0)
    amount_label = f"{amount:,.2f}"
    now = datetime.utcnow().isoformat()

    update = {
        "status": "approved" if action == "approve" else "rejected",
        "admin_note": note,
        "reviewed_by": user.get("email"),
        "reviewed_at": now,
    }

    # ── Approving a deposit that named a plan creates the investment ──
    if rec_type == "deposit" and action == "approve" and d.get("plan_id"):
        try:
            db.create_document("lumen_investments", {
                "user_id": d.get("user_id"),
                "user_email": d.get("user_email"),
                "user_name": d.get("user_name"),
                "plan_id": d.get("plan_id"),
                "plan_name": d.get("plan_name"),
                "principal": amount,
                "annual_return_pct": float(d.get("annual_return_pct") or 0),
                "status": "active",
                "start_date": now,
                "source_deposit_id": record_id,
            })
        except Exception:
            return {"error": "Could not open the investment. Nothing was changed."}, 500
        # Mark it allocated so the balance calculation doesn't double-count it.
        update["allocated"] = True

    try:
        db.update_document(collection, record_id, update)
    except Exception:
        return {"error": "Could not update the request."}, 500

    # ── Tell the investor ──
    if rec_type == "deposit":
        if action == "approve":
            where = f"into your {d.get('plan_name')} plan" if d.get("plan_id") else "to your available balance"
            _notify(
                d,
                f"Your ${amount_label} deposit is confirmed",
                "Deposit confirmed",
                f"We've verified your deposit of <b>${amount_label}</b> and credited it {where}. "
                + ("It's now earning returns." if d.get("plan_id")
                   else "You can allocate it to an investment plan whenever you're ready."),
            )
        else:
            reason = f" Reason given: {note}" if note else ""
            _notify(
                d,
                f"About your ${amount_label} deposit request",
                "We couldn't confirm your deposit",
                f"We weren't able to confirm your deposit request of <b>${amount_label}</b>.{reason} "
                "If you believe this is a mistake, reply to this email or contact your advisor and we'll look into it right away.",
            )
    else:
        if action == "approve":
            _notify(
                d,
                f"Your ${amount_label} withdrawal has been approved",
                "Withdrawal approved",
                f"Your withdrawal of <b>${amount_label}</b> has been approved and is being sent to the wallet address you provided.",
            )
        else:
            reason = f" Reason given: {note}" if note else ""
            _notify(
                d,
                f"About your ${amount_label} withdrawal request",
                "Withdrawal request declined",
                f"Your withdrawal request of <b>${amount_label}</b> was not approved.{reason} Please contact your advisor if you have questions.",
            )

    return {"ok": True, "status": update["status"]}
