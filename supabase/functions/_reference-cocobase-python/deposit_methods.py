# deposit-methods
#
# Read + write the payment addresses investors deposit to.
#
#   action="list"   → anyone signed in; returns only ACTIVE methods
#   action="admin_list" → admin only; returns every method including hidden ones
#   action="save"   → admin only; creates (no id) or updates (with id)
#   action="delete" → admin only
#
# Collection: lumen_deposit_methods
#   name            "Bitcoin"          — what the investor picks
#   symbol          "BTC"
#   network         "Bitcoin mainnet"  — the chain, shown as a loud warning
#   wallet_address  "bc1q…"            — what the investor copies
#   instructions    free text shown under the address
#   min_amount      0 = no minimum
#   active          bool
#   sort_order      int


def _is_admin(user):
    return bool(user) and "admin" in (user.get("roles") or [])


def _rows(res):
    return (res.get("data") if isinstance(res, dict) else res) or []


def _public(doc):
    """Shape a method for the investor-facing picker."""
    d = doc.get("data") or {}
    return {
        "id": doc.get("id"),
        "name": d.get("name"),
        "symbol": d.get("symbol"),
        "network": d.get("network"),
        "wallet_address": d.get("wallet_address"),
        "instructions": d.get("instructions"),
        "min_amount": d.get("min_amount") or 0,
        "active": d.get("active") is not False,
        "sort_order": d.get("sort_order") or 0,
    }


def main():
    user = req.user
    if not user:
        return {"error": "You must be signed in."}, 401

    payload = req.payload or {}
    action = (payload.get("action") or "list").strip()

    # ── LIST (investor-facing) ──
    if action == "list":
        try:
            res = db.list_documents("lumen_deposit_methods", limit=50)
        except Exception:
            return {"methods": []}
        methods = [_public(d) for d in _rows(res)]
        methods = [m for m in methods if m["active"] and m["wallet_address"]]
        methods.sort(key=lambda m: (m["sort_order"], m["name"] or ""))
        return {"methods": methods}

    # Everything below is admin-only.
    if not _is_admin(user):
        return {"error": "Admins only."}, 403

    # ── ADMIN LIST (includes hidden) ──
    if action == "admin_list":
        try:
            res = db.list_documents("lumen_deposit_methods", limit=50)
        except Exception:
            return {"methods": []}
        methods = [_public(d) for d in _rows(res)]
        methods.sort(key=lambda m: (m["sort_order"], m["name"] or ""))
        return {"methods": methods}

    # ── SAVE ──
    if action == "save":
        name = (payload.get("name") or "").strip()
        wallet_address = (payload.get("wallet_address") or "").strip()
        if not name:
            return {"error": "Give the deposit method a name (e.g. Bitcoin)."}, 400
        if not wallet_address:
            return {"error": "A wallet address is required."}, 400

        try:
            min_amount = float(str(payload.get("min_amount") or 0).replace(",", ""))
        except Exception:
            min_amount = 0

        data = {
            "name": name,
            "symbol": (payload.get("symbol") or "").strip().upper(),
            "network": (payload.get("network") or "").strip(),
            "wallet_address": wallet_address,
            "instructions": (payload.get("instructions") or "").strip(),
            "min_amount": min_amount,
            "active": payload.get("active") is not False,
            "sort_order": int(payload.get("sort_order") or 0),
        }

        method_id = (payload.get("id") or "").strip()
        try:
            if method_id:
                db.update_document("lumen_deposit_methods", method_id, data)
            else:
                db.create_document("lumen_deposit_methods", data)
        except Exception:
            return {"error": "Could not save the deposit method."}, 500

        return {"ok": True}

    # ── DELETE ──
    if action == "delete":
        method_id = (payload.get("id") or "").strip()
        if not method_id:
            return {"error": "Missing deposit method id."}, 400
        try:
            db.delete_document("lumen_deposit_methods", method_id)
        except Exception:
            return {"error": "Could not delete the deposit method."}, 500
        return {"ok": True}

    return {"error": f"Unknown action '{action}'."}, 400
