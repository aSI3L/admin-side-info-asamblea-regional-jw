# Panel de administración · Asamblea Regional

Panel de control de la información que muestra el sitio informativo de la Asamblea Regional: información principal, categorías, usuarios autorizados y **mapas interactivos** de los edificios.

Está hecho con Next.js 15, React 19, Firebase (Auth + Firestore), Zustand y Tailwind.

## Mapas

Los planos son croquis limpios por nivel. Sobre ellos se ubican iconos para cada área y se dibujan los caminos entre áreas, zonas de circulación y escaleras. El visor muestra la ruta animada nivel por nivel.

Toda la explicación está en **[docs/MEJORAS-MAPAS.md](docs/MEJORAS-MAPAS.md)**.

## Desarrollo local

Se trabaja contra los emuladores de Firebase, con datos de ejemplo incluidos en `datos-ejemplo/`. Se necesita Node 20 o superior y Java 21 o superior.

```bash
cp .env.example .env.local
npm install
npm run emulators   # terminal 1
npm run dev         # terminal 2 → http://localhost:3000
```

El usuario de prueba es `admin@demo.local`; la contraseña está en `scripts/seed-emulators.mjs`. Más detalles en [docs/MEJORAS-MAPAS.md](docs/MEJORAS-MAPAS.md#8-desarrollo-local-con-datos-de-ejemplo).

## Producción

Configurar en `.env.local` (o en las variables del hosting) los valores `NEXT_PUBLIC_FIREBASE_*` del proyecto real, sin `NEXT_PUBLIC_USE_FIREBASE_EMULATORS`. Ver `.env.example`.
