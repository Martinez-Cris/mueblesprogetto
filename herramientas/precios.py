"""Precios y medidas desde una hoja de Excel/CSV.

  python herramientas/precios.py exportar   -> crea precios.csv (ábrelo en Excel)
  python herramientas/precios.py importar   -> lee precios.csv y actualiza productos.json

En Excel llena las columnas precio (solo números, ej. 350000) y medidas (ej. 90 x 60 x 75 cm).
Si guardas desde Excel como "CSV UTF-8", los acentos se conservan.
"""
import csv, json, sys, os
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSON = os.path.join(RAIZ, "productos.json")
CSV = os.path.join(RAIZ, "precios.csv")

def cargar():
    with open(JSON, encoding="utf-8") as f: return json.load(f)

def exportar():
    with open(CSV, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f, delimiter=";")
        w.writerow(["id", "nombre", "precio", "medidas"])
        for p in cargar():
            w.writerow([p["id"], p["nombre"], p["precio"] if p["precio"] is not None else "", p["medidas"]])
    print("Listo: precios.csv")

def importar():
    P = cargar(); por_id = {p["id"]: p for p in P}; n = 0
    with open(CSV, newline="", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f, delimiter=";"):
            p = por_id.get(r["id"])
            if not p: print("id desconocido:", r["id"]); continue
            txt = (r["precio"] or "").replace("$", "").replace(".", "").replace(",", "").strip()
            p["precio"] = int(txt) if txt.isdigit() else None
            p["medidas"] = (r["medidas"] or "").strip(); n += 1
    with open(JSON, "w", encoding="utf-8") as f: json.dump(P, f, ensure_ascii=False, indent=2)
    print(f"Actualizados {n} muebles en productos.json")

if __name__ == "__main__":
    {"exportar": exportar, "importar": importar}.get(sys.argv[1] if len(sys.argv) > 1 else "", lambda: print(__doc__))()
