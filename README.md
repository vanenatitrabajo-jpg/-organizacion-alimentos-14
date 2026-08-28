# Organización de Alimentos

App funcional de punta a punta, lista para desplegar en **Vercel** con **Supabase**
como backend.

La contraseña de entrada al sitio empieza en **1928** y se puede cambiar desde
**Configuración** una vez adentro (pide la contraseña actual para confirmarla).

## Qué incluye esta entrega

- **Importar Excel** → detecta automáticamente las filas de "Alimentos" (tolera
  mayúsculas/minúsculas, con o sin encabezados claros), cruza cada persona con
  **Personal fijo**, **Personal variable** (excepciones por día) y **Reglas**
  (franjas horarias → sector), y muestra un resumen con indicadores
  (🟢 fija, 🔵 por regla, 🟠 revisión, 🔴 conflicto) antes de confirmar.
- **Personal fijo**, **Personal variable** y **Reglas**: altas, ediciones y bajas
  reales contra Supabase.
- **Organización semanal**: vista digital agrupada por día → horario → sector,
  con búsqueda por persona y filtro por sector, más una **Vista cartelera**
  pensada para pegar en la pared (agrupa Mañana/Tarde/Noche, evita repetir texto,
  nombres grandes y con color por sector).
- **Exportar**: botón de Excel (con títulos, colores por sector, bordes,
  configuración de impresión A4 horizontal) y botón de Imprimir/PDF, que abre el
  diálogo de impresión del navegador ya con la vista cartelera en A4 horizontal
  (desde ahí se puede "Guardar como PDF").
- **Historial**: lista las organizaciones generadas, con acceso directo a cada una.
- **Inicio**: resumen real (personas cargadas, última organización generada).

## Cómo usarla la primera vez

1. Cargá algunas personas en **Personal fijo** (nombre + sector habitual).
2. En **Reglas**, apretá "Cargar reglas de ejemplo" (Office almuerzo 12:50–14:30
   y Office cena 20:15–21:35), o cargá las tuyas.
3. Andá a **Importar organización** y subí el Excel general del personal.
4. Revisá el resumen — lo marcado como 🟠 o 🔴 conviene mirarlo antes de imprimir.
5. Confirmá con "Generar y guardar en Historial", y desde ahí exportá o imprimí.

> Nota: el motor de importación es heurístico — interpreta texto libre, así que
> conviene revisar el resumen antes de confirmar, tal como pide el punto 18 del
> pedido original ("nunca inventar, marcar para revisión cuando haya duda").

---

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) → **New project**.
2. Cuando esté creado, andá a **SQL Editor** → **New query**.
3. Copiá y pegá todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y
   apretá **Run**. Esto crea:
   - la tabla `app_config` con la contraseña `1928` ya cargada (hasheada, nadie
     puede leerla directamente),
   - las funciones `check_site_password` y `set_site_password` (son las únicas
     que pueden consultar o cambiar la contraseña),
   - las tablas `personas`, `asignaciones_variables`, `reglas` y
     `organizaciones`, para las próximas etapas.
4. Andá a **Project Settings → API** y copiá:
   - **Project URL**
   - **anon public key**

## 2. Configurar las variables de entorno

### Para probar en tu computadora

```bash
cp .env.example .env.local
```

Y completá `.env.local` con la URL y la anon key de Supabase.

```bash
npm install
npm run dev
```

### Para Vercel

En **Vercel → tu proyecto → Settings → Environment Variables**, agregá:

| Nombre | Valor |
|---|---|
| `VITE_SUPABASE_URL` | La Project URL de Supabase |
| `VITE_SUPABASE_ANON_KEY` | La anon public key de Supabase |

## 3. Desplegar en Vercel

**Opción A — desde GitHub (recomendada):**

1. Subí esta carpeta a un repositorio de GitHub.
2. En Vercel: **Add New → Project → Import** ese repositorio.
3. Framework preset: **Vite** (Vercel lo detecta solo).
4. Agregá las variables de entorno del paso 2.
5. **Deploy**.

**Opción B — desde la terminal, sin GitHub:**

```bash
npm install -g vercel
vercel
```

Seguí las preguntas (te va a pedir loguearte y elegir el proyecto), y después:

```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel --prod
```

## 4. Cambiar la contraseña más adelante

Una vez adentro del sitio: **Configuración → Contraseña de acceso**. Pide la
contraseña actual y la nueva dos veces. Se guarda directamente en Supabase
(hasheada), no en el código — no hace falta volver a desplegar nada.

Si en algún momento se pierde la contraseña y nadie puede entrar, se puede
resetear manualmente desde Supabase → SQL Editor:

```sql
update app_config set password_hash = crypt('nueva_clave', gen_salt('bf')) where id = 1;
```

## 5. Qué queda para más adelante

Lo que todavía es un "Próxima etapa de desarrollo" dentro del menú: **Organización
mensual** (vista por mes) y **Reportes** (cobertura por sector, horas). El resto
del flujo principal del pedido — importar, interpretar, cruzar, generar, revisar,
exportar — ya está funcionando.

## Estructura del proyecto

```
src/
  components/     Layout (menú lateral), tarjetas reutilizables
  lib/            Cliente de Supabase + contexto de autenticación
  pages/          Una página por sección del menú
  styles/         Estilos globales + reglas de impresión (cartelera)
supabase/
  schema.sql      Todo el esquema de base de datos, listo para pegar y correr
```
