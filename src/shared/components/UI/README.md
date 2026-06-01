# Componentes Compuestos de Pixetide (UI - Mayúscula)

Esta carpeta contiene componentes compuestos del proyecto desarrollados a medida (Moléculas y Organismos).

## Convención

1. **Nombres en Mayúscula (PascalCase):** Los nombres de carpetas y archivos en esta sección se escriben en PascalCase.
2. **Propósito:** Alojar componentes compuestos específicos de la aplicación que integran componentes primitivos y lógica intermedia (ej. `Card`, `Logo`, `WorkingOnIt`, `Loader`, `Workspace`, etc.).
3. **Mantenibilidad:** Evita contaminar esta carpeta con componentes crudos o instalados directamente por el CLI de shadcn/ui. Mantén la separación clara para facilitar auditorías y tree-shaking.

---
*Para componentes primitivos e independientes de shadcn/ui y Radix UI, utiliza la carpeta vecina `/src/shared/components/ui/`.*
