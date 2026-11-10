# FinFlow Desktop (PyQt6) 💎

Aplicación de escritorio nativa para la gestión de presupuestos personales, control de liquidez por cuenta y seguimiento de compras en cuotas.

## 🚀 Requisitos e Instalación

1. Asegúrate de tener Python 3.10+ instalado.
2. Instala las dependencias necesarias:
   ```bash
   pip install -r desktop_app/requirements.txt
   ```

## 💻 Ejecución en Modo Desarrollo

Desde la raíz del proyecto o desde `desktop_app/`:
```bash
python desktop_app/main.py
```

## 📦 Compilación a Ejecutable (.exe) con PyInstaller

Para generar el ejecutable autocontenido para Windows:
```bash
pyinstaller --noconfirm desktop_app/FinFlow-Desktop.spec
```
El archivo ejecutable compilado quedará listo en la carpeta `dist/FinFlow-Desktop.exe`.

## 🛠️ Módulos Incluidos
* **Panel de Control (Dashboard):** Métricas de liquidez disponible, saldo total, ingresos y gastos del mes, más barras de avance presupuestario.
* **Seguimiento de Cuotas y Créditos:** Registro y cálculo automático de cuotas acumuladas en meses o en dinero ($), compromiso mensual y deuda restante.
* **Movimientos:** Cargos/Gastos, Abonos/Ingresos y bandeja de Pendientes con botones de categorización rápida con un solo clic.
* **Cuentas y Saldos:** Gestión de cuentas corrientes, vista, rut, ahorro, billeteras digitales y tarjetas de crédito.
* **Diseño Dark Moderno:** Estilos visuales oscuros inspirados en la versión web (tokens de diseño en `ui/styles.py`).
