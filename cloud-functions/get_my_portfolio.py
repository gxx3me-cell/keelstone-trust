# get-my-portfolio
#
# Everything the investor dashboard renders in one call.
#
# Returns, in addition to the plan-based investment figures:
#   pending_total    — deposits submitted but not yet confirmed by an admin
#   pending_count
#   available_balance — approved funds NOT allocated to a plan, ready to invest
#
# The dashboard shows pending money separately from confirmed money so an
# investor always sees that their deposit landed, even before it's approved.


def _accrued(principal, annual_pct, start_iso):
    try:
        start = datetime.fromisoformat(str(start_iso).replace("Z", ""))
    except Exception:
        return 0.0
    days = max((datetime.utcnow() - start).total_seconds() / 86400.0, 0)
    return principal * (annual_pct / 100.0) * (days / 365.0)


def _rows(res):
    return (res.get("data") if isinstance(res, dict) else res) or []


def main():
    user = req.user
    if not user:
        return {"error": "You must be signed in."}, 401

    uid = user["id"]

    try:
        inv_rows = _rows(db.list_documents("lumen_investments", limit=200))
    except Exception:
        inv_rows = []
    try:
        dep_rows = _rows(db.list_documents("lumen_deposits", limit=200))
    except Exception:
        dep_rows = []
    try:
        wd_rows = _rows(db.list_documents("lumen_withdrawals", limit=200))
    except Exception:
        wd_rows = []

    mine = lambda rows: [r for r in rows if (r.get("data") or {}).get("user_id") == uid]

    # ── Active investments ──
    investments = []
    total_principal = 0.0
    total_earnings = 0.0
    for row in mine(inv_rows):
        d = row.get("data") or {}
        if d.get("status") != "active":
            continue
        principal = float(d.get("principal") or 0)
        annual = float(d.get("annual_return_pct") or 0)
        earnings = _accrued(principal, annual, d.get("start_date"))
        total_principal += principal
        total_earnings += earnings
        investments.append({
            "id": row.get("id"),
            "plan_name": d.get("plan_name"),
            "plan_id": d.get("plan_id"),
            "principal": round(principal, 2),
            "annual_return_pct": annual,
            "earnings": round(earnings, 2),
            "current_value": round(principal + earnings, 2),
            "start_date": d.get("start_date"),
        })

    # ── Deposits: pending vs approved-but-unallocated ──
    deposits = []
    pending_total = 0.0
    pending_count = 0
    unallocated = 0.0
    for row in sorted(mine(dep_rows), key=lambda r: str((r.get("data") or {}).get("created_at") or ""), reverse=True):
        d = row.get("data") or {}
        amount = float(d.get("amount") or 0)
        status = d.get("status") or "pending"

        if status == "pending":
            pending_total += amount
            pending_count += 1
        # An approved deposit with no plan is spendable balance. Approved
        # deposits that named a plan already became an investment above.
        elif status == "approved" and not d.get("plan_id") and not d.get("allocated"):
            unallocated += amount

        deposits.append({
            "id": row.get("id"),
            "amount": round(amount, 2),
            "status": status,
            "method": d.get("method"),
            "method_name": d.get("method_name"),
            "plan_name": d.get("plan_name"),
            "reference": d.get("reference"),
            "tx_hash": d.get("tx_hash"),
            "admin_note": d.get("admin_note"),
            "created_at": d.get("created_at"),
        })

    # ── Withdrawals (approved ones spend the unallocated balance) ──
    withdrawals = []
    for row in sorted(mine(wd_rows), key=lambda r: str((r.get("data") or {}).get("created_at") or ""), reverse=True):
        d = row.get("data") or {}
        amount = float(d.get("amount") or 0)
        status = d.get("status") or "pending"
        if status == "approved":
            unallocated -= amount
        withdrawals.append({
            "id": row.get("id"),
            "amount": round(amount, 2),
            "status": status,
            "bank_details": d.get("bank_details"),
            "admin_note": d.get("admin_note"),
            "created_at": d.get("created_at"),
        })

    available_balance = max(unallocated, 0.0)
    total_value = total_principal + total_earnings
    return_pct = round((total_earnings / total_principal * 100), 2) if total_principal else 0

    return {
        "investment_count": len(investments),
        "investments": investments,
        "total_principal": round(total_principal, 2),
        "total_earnings": round(total_earnings, 2),
        "total_value": round(total_value, 2),
        "return_pct": return_pct,
        "available_balance": round(available_balance, 2),
        "pending_total": round(pending_total, 2),
        "pending_count": pending_count,
        "deposits": deposits,
        "withdrawals": withdrawals,
    }
