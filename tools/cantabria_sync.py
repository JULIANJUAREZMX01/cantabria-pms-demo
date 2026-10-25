#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cantabria PMS Sync — Puente Excel/CSV ↔ Base de datos (Beta)
=============================================================
Usos:
  python cantabria_sync.py pull                 Descarga los CSVs vivos y crea/actualiza cantabria_live.xlsx
  python cantabria_sync.py push cantabria_live.xlsx [--dry-run]   Sube tus ediciones del Excel a la base y republica la web
  python cantabria_sync.py push rooms.csv --entity rooms [--dry-run]  Igual pero con un CSV suelto
  python cantabria_sync.py status               Muestra el estado en vivo de la base

Requisitos:  pip install requests openpyxl
Reglas:
  - Las filas SIN columna 'id' se CREAN como registros nuevos.
  - Las filas CON 'id' se ACTUALIZAN solo si cambiaron.
  - Habitaciones: la clave es (property_name, room_id); no necesitas el id.
  - No borra registros: para eliminar, pídeselo a KynicOS por Telegram.
"""

import csv
import io
import json
import sys
import urllib.request

try:
    import requests
except ImportError:
    sys.exit("Falta 'requests': instala con  pip install requests")

# ---------- CONFIG ----------
SITE = "https://julianjuarezmx01.github.io/cantabria-pms-demo"
API = "https://kynic-os-ee9fcf0d.base44.app/functions"
XLSX = "cantabria_live.xlsx"
AGENT_ID = "69cfdbf8f38ae270ee9fcf0d"
AGENT_API = "https://app.base44.com/api/agents"
import os
CANTABRIA_API_KEY = os.environ.get("CANTABRIA_API_KEY", "")  # API key del agente (Editor > Developer/API)
# ----------------------------

ENTITIES = ["rooms", "stays", "extras", "requests", "properties"]
CSV_URLS = {
    "rooms": f"{SITE}/csv/rooms.csv",
    "stays": f"{SITE}/csv/stays.csv",
    "extras": f"{SITE}/csv/extras.csv",
    "requests": f"{SITE}/csv/requests.csv",
    "properties": f"{SITE}/csv/properties.csv",
}
KEY_COLS = {"rooms": ["property_name", "room_id"], "properties": ["name"]}
DATE_COLS = {"check_in", "check_out"}


def http_json(url, payload, timeout=60):
    req = urllib.request.Request(url, method="POST",
                                 data=json.dumps(payload).encode(),
                                 headers={"Content-Type": "application/json",
                                          "User-Agent": "CantabriaPMS-Sync/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read())


def fetch_csv(name):
    with urllib.request.urlopen(CSV_URLS[name] + "?ts=" + str(__import__("time").time()), timeout=30) as r:
        text = r.read().decode("utf-8-sig")
    rows = list(csv.DictReader(io.StringIO(text)))
    return [row for row in rows if any((v or "").strip() for v in row.values())]


def row_key(entity, row):
    cols = KEY_COLS.get(entity, ["id"])
    return tuple((row.get(c) or "").strip() for c in cols)


def cells(value):
    """Normaliza un valor de celda a texto limpio (como el CSV)."""
    if value is None:
        return ""
    s = str(value).strip()
    if s.endswith(".0"):  # Excel numérico
        s = s[:-2]
    return s


def norm_date(v):
    s = cells(v)
    if not s:
        return ""
    if "-" in s and len(s) >= 10:
        return s[:10]
    for fmt in ("%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"):
        try:
            import datetime
            return datetime.datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return s


def cmd_status(_):
    print("📡 Estado en vivo de la base (CSV públicos):\n")
    for e in ENTITIES:
        rows = fetch_csv(e)
        print(f"  {e:<11} {len(rows):>3} registros")
    print(f"\n🌐 Web: {SITE}")
    print("🤖 KynicOS: mándale operaciones por Telegram y se reflejan aquí en ~1 min.")


def cmd_pull(_):
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    wb.remove(wb.active)
    head_fill = PatternFill("solid", fgColor="7C3AED")
    head_font = Font(bold=True, color="FFFFFF")

    for e in ENTITIES:
        rows = fetch_csv(e)
        ws = wb.create_sheet(e)
        cols = list(rows[0].keys()) if rows else ["(sin datos)"]
        ws.append(cols)
        for c in range(1, len(cols) + 1):
            cell = ws.cell(row=1, column=c)
            cell.fill = head_fill
            cell.font = head_font
        for r in rows:
            ws.append([r.get(c, "") for c in cols])
        for c in range(1, len(cols) + 1):
            width = max([len(str(ws.cell(row=i, column=c).value or "")) for i in range(1, min(ws.max_row, 40) + 1)] or [10])
            ws.column_dimensions[get_column_letter(c)].width = min(42, width + 3)
        ws.freeze_panes = "A2"
        print(f"  ✓ {e}: {len(rows)} filas")

    wb.save(XLSX)
    print(f"\n✅ Creado {XLSX}")
    print("✏️  Edítalo con Excel/LibreOffice y súbelo con:")
    print(f"   python {sys.argv[0]} push {XLSX}")


def read_sheet_rows(path, sheet=None):
    """Lee un xlsx (todas las hojas o una) o un csv suelto. Devuelve {entity: [rows]}."""
    out = {}
    if path.lower().endswith(".csv"):
        entity = sheet
        if not entity:
            base = path.lower().split("/")[-1].split("\\")[-1].replace(".csv", "")
            entity = base if base in ENTITIES else None
            if not entity:
                sys.exit("⚠️  Para un CSV suelto indica la entidad: --entity rooms|stays|extras|requests|properties")
        with open(path, newline="", encoding="utf-8-sig") as f:
            out[entity] = [dict((k.strip(), cells(v)) for k, v in r.items()) for r in csv.DictReader(f)]
        return out
    from openpyxl import load_workbook
    wb = load_workbook(path, data_only=True)
    for ws in wb.worksheets:
        name = ws.title.strip().lower()
        if name not in ENTITIES:
            continue
        if sheet and name != sheet:
            continue
        rows = []
        it = ws.iter_rows(values_only=True)
        try:
            header = [str(h).strip() if h is not None else "" for h in next(it)]
        except StopIteration:
            continue
        for vals in it:
            if vals is None or all(v is None or str(v).strip() == "" for v in vals):
                continue
            row = {}
            for h, v in zip(header, vals):
                if h:
                    row[h] = norm_date(v) if h in DATE_COLS else cells(v)
            rows.append(row)
        if rows:
            out[name] = rows
    return out


def diff_rows(entity, new_rows):
    """Separa creaciones y actualizaciones contra el CSV vivo."""
    live = fetch_csv(entity)
    live_by_key, live_by_id = {}, {}
    for r in live:
        live_by_key[row_key(entity, r)] = r
        if (r.get("id") or "").strip():
            live_by_id[r["id"].strip()] = r
    cols = list(live[0].keys()) if live else (list(new_rows[0].keys()) if new_rows else [])
    creates, updates = [], []
    for nr in new_rows:
        rid = (nr.get("id") or "").strip()
        cur = live_by_id.get(rid) or live_by_key.get(row_key(entity, nr))
        if cur is None:
            creates.append(nr)
            continue
        changed = {}
        for c in cols:
            if c == "id":
                continue
            if c in DATE_COLS:
                if norm_date(nr.get(c, "")) != (cur.get(c) or ""):
                    changed[c] = norm_date(nr.get(c, ""))
            elif cells(nr.get(c, "")) != (cur.get(c) or ""):
                changed[c] = cells(nr.get(c, ""))
        if changed:
            changed["id"] = cur.get("id") or rid
            if entity == "rooms":
                changed.setdefault("room_id", cells(nr.get("room_id", "")))
                changed.setdefault("property_name", cells(nr.get("property_name", "")))
            updates.append(changed)
    return creates, updates


def cmd_push(args):
    dry = "--dry-run" in args
    args = [a for a in args if not a.startswith("--")]
    entity_filter = None
    if "--entity" in args:
        entity_filter = args[args.index("--entity") + 1]
        args = args[:args.index("--entity")]
    path = args[0] if args else XLSX
    sheets = read_sheet_rows(path, entity_filter)
    if not sheets:
        sys.exit("⚠️  No encontré hojas válidas en el archivo. Las hojas deben llamarse: " + ", ".join(ENTITIES))

    for entity, rows in sheets.items():
        creates, updates = diff_rows(entity, rows)
        print(f"\n📄 {entity}: {len(rows)} filas → {len(creates)} nuevas, {len(updates)} con cambios")
        for r in creates:
            print(f"   + NUEVO   {row_key(entity, r)}")
        for r in updates:
            changed_cols = [k for k in r if k not in ("id", "room_id", "property_name")]
            print(f"   ~ EDITADO {row_key(entity, r)}: {', '.join(changed_cols)}")

    if dry:
        print("\n🔍 DRY-RUN: no se escribió nada. Ejecuta sin --dry-run para aplicar.")
        return

    # Construir el paquete de cambios
    changes = {}
    for entity, rows in sheets.items():
        creates, updates = diff_rows(entity, rows)
        if creates or updates:
            changes[entity] = {"creates": creates, "updates": updates}
    if not changes:
        print("\n😌 Sin cambios que aplicar.")
        return

    if CANTABRIA_API_KEY:
        print("\n🤖 Enviando cambios a KynicOS vía Agent API...")
        ok = send_to_kynicos(changes)
        if ok:
            print("   ✓ KynicOS los aplicará y republicará la web en ~1 min.")
        else:
            save_pending(changes)
        return

    # Fallback: escribir archivo + instrucciones
    save_pending(changes)


def save_pending(changes):
    import time
    fname = f"cambios_pendientes_{int(time.time())}.json"
    with open(fname, "w", encoding="utf-8") as f:
        json.dump({"protocolo": "IMPORTAR_CANTABRIA", "cambios": changes}, f, ensure_ascii=False, indent=1)
    print(f"\n💾 Cambios guardados en {fname}")
    print("   Opción A (recomendada): exporta CANTABRIA_API_KEY y reejecuta para envío automático.")
    print("   Opción B: mándale ese archivo a KynicOS por Telegram y él lo aplica.")


def send_to_kynicos(changes):
    """Envía el paquete a la API del agente; KynicOS escribe en la base y republica."""
    import urllib.error
    payload = {"message": "IMPORTAR_CANTABRIA " + json.dumps(changes, ensure_ascii=False)}
    # 1) obtener conversación por defecto
    req = urllib.request.Request(f"{AGENT_API}/{AGENT_ID}/conversations",
                                 headers={"api_key": CANTABRIA_API_KEY,
                                          "User-Agent": "CantabriaPMS-Sync/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            convs = json.loads(r.read())
        conv_id = convs[0]["id"] if isinstance(convs, list) and convs else convs.get("id")
    except Exception:
        conv_id = None
    if not conv_id:
        print("   ✗ No pude obtener la conversación del agente.")
        return False
    # 2) enviar mensaje (dispara el ciclo del agente)
    req2 = urllib.request.Request(f"{AGENT_API}/{AGENT_ID}/conversations/{conv_id}/messages",
                                  method="POST",
                                  data=json.dumps(payload).encode(),
                                  headers={"api_key": CANTABRIA_API_KEY,
                                           "Content-Type": "application/json",
                                           "User-Agent": "CantabriaPMS-Sync/1.0"})
    try:
        with urllib.request.urlopen(req2, timeout=300) as r:
            resp = json.loads(r.read())
        print(f"   → KynicOS respondió: {str(resp)[:200]}")
        return True
    except urllib.error.HTTPError as e:
        print(f"   ✗ HTTP {e.code}: {e.read()[:200]}")
        return False


def main():
    cmds = {"status": cmd_status, "pull": cmd_pull, "push": cmd_push}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        print(__doc__)
        sys.exit(1)
    cmds[sys.argv[1]](sys.argv[2:])


if __name__ == "__main__":
    main()
