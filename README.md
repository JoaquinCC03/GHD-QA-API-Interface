# QA Task Interface

Interfaz web para gestionar tareas de QA con replications, claims y reworks. Todo corre **en memoria**: no hay backend ni base de datos, así que al recargar la página se pierde el estado y vuelve a los datos de ejemplo.

## Requisitos

- Node.js 18 o superior
- npm

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrí [http://localhost:5173](http://localhost:5173) en el navegador.

## Qué hace

La app tiene tres tabs:

- **Queue**: tareas que todavía no fueron enviadas a rework, o que sí tienen alguna replication en rework pero aún no se decidió sobre todas.
- **Reworks**: tareas donde ya se decidió sobre las 3 replications y al menos una fue enviada a rework.
- **Approved**: tareas ya aprobadas de forma final.

### Claims

- Cada QA puede tener hasta **3 tareas claimeadas** a la vez.
- Solo se puede claimear una tarea si ya llegaron sus **3 replications** (columna "Submitted").
- Una vez claimeada, no se puede desclaimear manualmente.
- Cuando las 3 replications de una tarea quedan decididas (aprobadas o mandadas a rework), la tarea se libera del cupo de "My Claimed Tasks" automáticamente, aunque siga figurando como tuya.

### Replications

Cada replication tiene 4 acciones: **View**, **Edit Myself**, **Send to Rework** y **Approve**. Todas requieren tener la tarea claimeada (excepto View, que además nunca se deshabilita por el estado de la replication).

Cuando una replication se manda a rework, queda esperando al rater. Mientras espera, solo se puede ver (View); Edit y Send to Rework quedan bloqueados hasta que se resuelve. Approve sigue disponible para poder resolverla directamente cuando el trabajo corregido ya está listo.

### Aprobación final

El botón "Approve Task" se habilita solo cuando **las 3 replications están realmente aprobadas**. Pide confirmación por popup porque la acción es irreversible.

### Colores de fila (en las listas)

- 🔵 Azul: tarea claimeada por vos.
- 🟠 Naranja: claimeada por otro QA.
- 🟢 Verde: sin claimear y lista para tomar (3/3 submitted).
- Sin color: todavía no llegaron las 3 replications.

Hay un filtro "Ready to Claim" para ver solo las verdes, y otro "My Claimed Tasks" para ver solo las tuyas.

## Estructura del código

```
src/
  hooks/useTaskState.ts   # todo el estado de la app (tareas, claims, acciones)
  data/mockTasks.ts       # datos de ejemplo que se cargan al iniciar
  components/             # UI: Layout (tabs), TaskList, TaskDetail, ReplicationRow, etc.
```

No hay routing ni persistencia: `useTaskState.ts` es la única fuente de verdad, guardada en un `useState` de React.
