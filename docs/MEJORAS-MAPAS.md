# Mapas interactivos: croquis, iconos y visor por niveles

Esta versión rehace el flujo de trabajo de los mapas. Los planos pasan a ser **croquis limpios** (solo paredes y ambientes) y cada área se marca con un **icono** de una biblioteca común. Los caminos se dibujan entre esos iconos por las zonas de circulación y las escaleras. El visor muestra la ruta **croquis por croquis**, del nivel de origen al de destino.

El flujo completo queda así:

1. **Edificio:** se crea el edificio, se sube un croquis por nivel y se eligen los iconos que va a usar.
2. **Áreas:** en el editor se coloca un icono donde está cada área y se le pone el nombre que verá el público.
3. **Caminos:** se dibujan los tramos por pasillos y zonas de circulación hasta cada icono.
4. **Niveles:** se conectan las escaleras o ascensores de cada nivel tocándolos sobre los planos.
5. **Visor:** quien consulta elige origen y destino y ve la ruta animada, nivel por nivel.

---

## 1. Croquis por nivel

En **Mapas → Agregar edificio / Editar**, cada nivel tiene un botón **Subir**:

- **Formatos:** SVG, PNG, JPG o WEBP. También se puede seguir pegando la URL de una imagen, incluidos enlaces de Google Drive.
- **Croquis cuadrado:** al subirlo, se centra en un lienzo cuadrado con fondo blanco. Todo el sistema de mapas (editor, visor y sitio público) trabaja sobre un lienzo de 800×800, así que un croquis apaisado no se deforma ni se desalinea con los puntos.
- **Almacenamiento:** el croquis se guarda embebido en el documento del edificio como *data URL*, sin servicios externos. Los SVG quedan en vectorial; las imágenes se reducen a 1600 px como máximo y se guardan en WEBP.
- **Límites:**
  - 300 KB por croquis y 900 KB por edificio, por el límite de 1 MiB de Firestore por documento.
  - Si se supera, el formulario lo indica.
  - Los tres croquis de `assets/croquis/` suman unos 430 KB.
- **Niveles nuevos:** un nivel agregado al editar un edificio ya existente arranca con su "Capa 1" vacía.

Los croquis del estadio usados en esta versión están en `assets/croquis/croquis_nivel_{0,1,2}.svg`.

## 2. Biblioteca de iconos

Hay **17 iconos** comunes a todos los edificios, en `public/iconos/` y listados en `src/consts/iconos.consts.ts`:

| Icono | Uso |
|---|---|
| Acceso, Información, Primeros auxilios | Ingresos, stands de informes, atención médica |
| Sanitarios, Sanitarios varones, Sanitarios mujeres | El genérico va mitad azul y mitad rosa; varones en azul y mujeres en rosa, para distinguirlos de un vistazo |
| Lactancia, Vestuarios, Acomodadores, Guardarropas | Servicios |
| Accesibilidad, Limpieza, Servicio voluntario, Plataforma, Bebederos | Servicios |
| **Escaleras**, **Ascensor** | Marcan cambios de nivel: aparecen en "Conectar escaleras" |

- **Por edificio:** en el formulario se eligen qué iconos se usan, y el editor ofrece solo esos. Los edificios anteriores, sin selección, usan todos.
- **Agregar un icono nuevo:** copiar el SVG de 64×64 a `public/iconos/<id>.svg` y sumar una línea en `ICONOS`.

## 3. Editor de mapas

### Áreas (iconos)

- **Colocar:** sobre el croquis hay una barra con los iconos del edificio. Se elige uno, se hace clic donde va, y se le pone el nombre que verá el público (por ejemplo, "Baños Norte"). Ese nombre aparece en el visor y en las referencias.
- **Modo Caminos:** el botón **Caminos** (o la tecla `Esc`) vuelve al modo de dibujar puntos de paso y tramos.
- **Mover:** los iconos se arrastran para reubicarlos.

### Editar y eliminar

- **Al seleccionar** un icono o nodo aparece encima una barra con **Editar** y **Eliminar**.
- **En la lista "Puntos de interés"** cada punto tiene un lápiz y un tacho. Tocar el nombre lo selecciona en el plano.
- **Atajos:** `Supr` borra el punto seleccionado, `Esc` lo deselecciona y el doble clic abre la edición.
- **El diálogo de edición** permite cambiar el nombre, el icono, el tamaño y el nombre en el mapa, y tiene "Eliminar punto".

### Nombre de cada icono en el mapa

- **Mostrar u ocultar:** se puede mostrar solo el icono. En el editor, un nombre oculto se insinúa tenue al seleccionar el punto; en la lista se marca con un ojo tachado.
- **Posición fija:** arriba, abajo, izquierda o derecha, con **distancia** regulable (pegado, cerca, media o lejos).
- **Posición libre:** se **arrastra el nombre** directamente sobre el plano. Queda relativo al icono, así que lo acompaña si el icono se mueve.
- **En el visor** el nombre se ve en la misma posición que en el editor.

### Tamaño de los iconos

- **General:** "Tamaño de iconos" (40 %–300 %), sobre el croquis. Se aplica a todo el edificio, se ve al instante y se guarda solo.
- **Individual:** "Tamaño de este icono" (40 %–250 %), en el diálogo de cada punto. **Multiplica** la escala general: con el general en 120 % y uno en 50 %, ese icono queda en 60 %. "Igual que los demás" lo devuelve al tamaño general.
- **Proporción:** los tamaños están en unidades del mapa, no en píxeles. Los iconos y sus nombres mantienen la proporción con el croquis en cualquier pantalla y con cualquier zoom.

### Conectar niveles

**Conectar escaleras** muestra el croquis de cada nivel con sus escaleras y ascensores en grande, para tocarlos:

- **Puntos elegibles:** escaleras y ascensores, ya sea por su icono o por tener esa palabra en el nombre. El resto de los iconos aparece tenue, como referencia.
- **Elegir:** se toca la escalera de cada nivel que se conectan. Se marcan con su número de orden, y solo se unen puntos de **niveles distintos**.
- **Conexiones existentes:** se marcan con una **letra** (A, B…) en ambos extremos y se listan abajo. Las que están guardadas en el nivel que se edita se pueden quitar desde ahí.
- **Sin guardar:** del nivel que se está editando se usa lo que hay en pantalla, aunque no esté guardado.

### Largo real de los tramos

Cada tramo guarda su **largo real**, medido entre sus dos extremos. Antes todos valían 1, y la "ruta más corta" era en realidad la de menos tramos.

- **Cambios de nivel:** cuentan como un tramo fijo (`COSTO_CAMBIO_NIVEL = 60`).
- **Capas viejas:** se corrigen solas la próxima vez que se guarden.

## 4. Visor (`/mapas/VisorMapa`)

- **Elegir origen y destino:** la lista va **agrupada por nivel** (Nivel 0, Nivel 1…), cada punto con su icono y ordenado por nombre. Ya no lleva "(Nivel n)" al final.
- **Panel plegable:** al elegir la ruta, el panel se pliega a una barra ("● Origen → 📍 Destino") y deja lugar al mapa. Un toque lo vuelve a abrir.
- **Croquis uno debajo del otro:** arriba el nivel de **origen**, abajo el de **destino** y, en el medio, los intermedios en el orden en que se recorren. Si origen y destino están en el mismo nivel, se ve solo ese.
  - Cada croquis indica su papel ("Origen", "De paso", "Destino") y hacia dónde sigue la ruta.
  - Hay carteles en la escalera: "↑ Subí al Nivel 1" donde se toma, y "Llegás desde Nivel 0" donde se llega.
  - El origen se resalta en verde y el destino en rojo.
- **Animación encadenada:** la flecha recorre el primer croquis hasta la escalera, hace una pausa, sigue en el próximo desde la escalera, para en el destino y se repite. Si el croquis siguiente no se ve, la pantalla se desplaza sola, salvo que la persona esté moviendo el mapa.
- **Referencias:** el botón de lista muestra los iconos con sus nombres, agrupados por nivel.
- **Mover y hacer zoom:** el mapa se desplaza deslizando, como cualquier página. El zoom se hace pellizcando, con los botones + y −, o con Ctrl + rueda.
- **Instrucciones paso a paso** (plegables): por ejemplo, "Partida desde…", "Pasá por…", "Tomá Escaleras y subí al Nivel 1", "Llegada a…".
- **Sin camino:** si no hay un camino cargado entre los dos puntos, aparece un aviso y se muestran igual los croquis de origen y destino.

## 5. Legibilidad (modo oscuro)

Con el sistema en modo oscuro, la app usa fondo azul. El gris de los textos secundarios estaba pensado para fondo blanco y no se leía. En esta versión:

- **Tema:** el gris se aclara automáticamente sobre las superficies azules (fondo, diálogos y paneles laterales). Dentro de las tarjetas blancas conserva el gris original.
- **Botones principales de los diálogos:** "Confirmar" y "Conectar seleccionados" usan el estilo blanco del resto de la app, en lugar del azul sobre azul.
- **Información Principal:** los datos en modo lectura se ven completos. Antes estaban al 50 % de opacidad.
- **Resto:** se ajustaron textos tenues del editor y del visor.

## 6. Cambios en los datos

Todos los campos nuevos son **opcionales**: los datos existentes siguen funcionando sin migración.

| Dónde | Campo | Significado |
|---|---|---|
| `edificios/{id}` | `planos[nivel]` | Ahora puede ser una URL o un croquis embebido (*data URL*) |
| `edificios/{id}` | `iconos: string[]` | Iconos habilitados para el edificio |
| `edificios/{id}` | `escalaIconos: number` | Tamaño general de los iconos (1 = 100 %) |
| `pois[]` | `icon: string` | Id del icono de la biblioteca |
| `pois[]` | `escala: number` | Tamaño propio del icono, que multiplica la escala general |
| `pois[]` | `etiqueta` | `{ visible, posicion: "derecha" \| "izquierda" \| "arriba" \| "abajo" \| "libre", distancia, dx?, dy? }` |
| `connections[]` | `distancia` | Largo real del tramo (60 para un cambio de nivel) |

### Compatibilidad con el sitio público

El sitio público (asambleamendoza.net.ar) lee las mismas colecciones:

- **Lo que toma automáticamente:** los croquis nuevos (que siguen siendo imágenes de 800×800) y los **largos reales de los tramos**, porque su cálculo de ruta usa `distancia`.
- **Lo que no muestra todavía:** los iconos, los nombres con posición, las referencias ni la vista por niveles apilados. Para eso hay que aplicar en su repositorio los cambios equivalentes a los de `MapVisor.tsx`.

## 7. Correcciones incluidas

- **Guardado de puntos "sin icono":** Firestore rechazaba campos `undefined` y el guardado fallaba sin avisar.
- **Escala de los iconos:** guardar el formulario del edificio borraba la escala, porque ese guardado reemplaza el documento completo.
- **Selector de nivel del editor:** ahora identifica el nivel por su número y no por la URL del plano. Antes fallaba con croquis embebidos o con dos niveles que usaban la misma imagen.
- **Cambio de piso del visor:** el cambio automático durante la animación no funcionaba. Lo reemplaza la vista de croquis apilados.

## 8. Desarrollo local con datos de ejemplo

El repo incluye todo lo necesario para probar sin tocar el proyecto real:

- **`firebase.json` y `.firebaserc`:** configuran los emuladores de Auth y Firestore, con el proyecto `demo-asamblea`.
- **`datos-ejemplo/`:** exportación de los emuladores. Incluye un edificio de demo de dos niveles, con escaleras conectadas, y el estadio con los croquis nuevos y los puntos cargados.
- **`scripts/seed-emulators.mjs`:** regenera los datos desde cero. No pisa un edificio que ya exista.
- **`.env.example`:** variables de entorno para el modo emulador y para producción.

Requisitos: Node 20 o superior y Java 21 o superior (los emuladores de Firebase lo necesitan).

```bash
cp .env.example .env.local
npm install
npm run emulators          # terminal 1: Auth + Firestore con los datos de ejemplo
npm run dev                # terminal 2: http://localhost:3000
```

- **Usuario de prueba:** `admin@demo.local`. La contraseña está en `scripts/seed-emulators.mjs` y solo existe en el emulador.
- **Datos:** los cambios se pierden al cerrar los emuladores. Para conservarlos en `datos-ejemplo/`, correr `npm run emulators:guardar` con los emuladores abiertos.
- **Consola de los emuladores:** <http://localhost:4000>.

## 9. Pendientes conocidos

- **El visor de este repo requiere iniciar sesión.** El público usa el sitio aparte.
- **El visor usa siempre la capa "Capa 1"** e ignora la marcada como activa.
- **En modo claro del sistema,** los botones blancos del diseño quedan sobre fondo blanco.
- **Borrar un nivel intermedio** en el formulario del edificio renumera los siguientes y desalinea sus capas. Conviene agregar niveles al final.

## Archivos principales

| Archivo | Contenido |
|---|---|
| `src/consts/iconos.consts.ts` | Biblioteca de iconos y tamaños |
| `src/lib/croquis.ts` | Conversión de croquis a lienzo cuadrado |
| `src/lib/etiquetas.ts` | Posición de los nombres (compartida por el editor y el visor) |
| `src/components/pages/Mapas/components/FormEdificio.tsx` | Croquis e iconos del edificio |
| `src/components/pages/EditarMapa/components/MapEditor.tsx` | Editor: iconos, caminos, nombres, tamaños |
| `src/components/pages/EditarMapa/components/RenamePoiModal.tsx` | Diálogo de cada punto |
| `src/components/pages/EditarMapa/components/ConnectStairsModal.tsx` | Conexión gráfica de niveles |
| `src/components/pages/EditarMapa/components/POI.tsx` | Lista de puntos con editar/eliminar |
| `src/components/pages/VisorMapa/MapVisor.tsx` | Visor por niveles apilados |
| `app/mapas/VisorMapa/page.tsx` | Pantalla del visor (panel plegable, búsqueda) |
| `src/zustand/grafo-mapa.store.ts` | Estado del editor y largos de los tramos |
