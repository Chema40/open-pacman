# SPEC 01 — Comportamientos de cuatro fantasmas

> **Status:** Approved
> **Depends on:** Ninguna
> **Date:** 2026-09-20
> **Objective:** Incorporar cuatro fantasmas con conductas diferenciadas y liberar uno adicional cada 2500 ms durante la partida.

## Scope

**In:**

- Crear cuatro fantasmas en cada partida usando los cuatro colores ya definidos en `src/js/render.js`.
- Asignar las conductas `hunter`, `ambusher`, `patroller` y `random` en ese orden.
- Hacer que `hunter` persiga agresivamente la posición actual de Pac-Man.
- Hacer que `ambusher` persiga una posición situada cuatro celdas delante de la dirección de Pac-Man.
- Hacer que `patroller` alterne entre las esquinas superior izquierda y superior derecha como objetivos.
- Hacer que `random` elija aleatoriamente entre las direcciones válidas sin invertir el sentido salvo en callejones.
- Activar el primer fantasma al comenzar la partida y liberar los siguientes a los `2500 ms`, `5000 ms` y `7500 ms`.
- Mantener a los fantasmas no liberados dentro del recinto, inmóviles y sin riesgo de colisión con Pac-Man.
- Permitir que los fantasmas atraviesen la puerta del recinto desde el inicio de la partida.

**Out of scope (for future specs):**

- Modos vulnerable, asustado o azul.
- Frutas, poderes, vidas extra o puntuación especial por comer fantasmas.
- Animaciones o formas visuales especiales por conducta.
- Fases de dificultad, cambios de velocidad o cambios de comportamiento por nivel.
- Persistencia, ranking, multijugador o cambios en el laberinto.

## Data model

Los cambios reutilizan el modelo global existente de `src/js/maze.js`, `src/js/game.js` y `src/js/render.js`.

```js
const GHOST_STARTS = [
  { x: 13, y: 14, kind: 'hunter', releaseAt: 0 },
  { x: 14, y: 14, kind: 'ambusher', releaseAt: 2500 },
  { x: 13, y: 14, kind: 'patroller', releaseAt: 5000 },
  { x: 14, y: 14, kind: 'random', releaseAt: 7500 },
];

const ghost = {
  x: 13,
  y: 14,
  dir: 'up',
  speed: GHOST_SPEED,
  kind: 'hunter',
  releaseAt: 0,
  active: true,
  patrolTarget: 'top-left',
};

const game = {
  // ...estado existente...
  elapsedMs: 0,
  ghosts: [/* cuatro objetos ghost */],
};
```

- `elapsedMs` acumula el tiempo real transcurrido desde el inicio de la partida.
- `releaseAt` expresa en milisegundos cuándo puede comenzar a moverse el fantasma.
- `active` indica si el fantasma ya fue liberado y participa en movimiento y colisiones.
- `patrolTarget` conserva la esquina objetivo actual del fantasma `patroller`.
- Las coordenadas usan celdas con origen en la esquina superior izquierda, como el laberinto existente.

## Implementation plan

1. Actualizar `src/js/maze.js` para definir cuatro posiciones iniciales, sus cuatro tipos y los tiempos de liberación `0`, `2500`, `5000` y `7500` ms. La página debe seguir cargando y mostrando los cuatro colores.
2. Actualizar `src/js/game.js` para crear cuatro estados de fantasma, inicializar `elapsedMs`, mantener inactivos los fantasmas pendientes y liberar cada uno cuando se alcance su `releaseAt`. La partida debe seguir siendo jugable con el primer fantasma activo.
3. Implementar en `src/js/game.js` la decisión de cada conducta: persecución para `hunter`, objetivo adelantado para `ambusher`, alternancia de esquinas para `patroller` y elección aleatoria para `random`. Cada decisión debe respetar paredes, túnel y la regla existente de no invertir salvo en callejón.
4. Ajustar el avance temporal entre `src/js/main.js` y `src/js/game.js` para que `elapsedMs` use el tiempo real del navegador y no dependa de una cantidad fija de frames. La liberación debe seguir ocurriendo aproximadamente a los tiempos definidos aunque varíe la tasa de refresco.
5. Actualizar el movimiento y las colisiones en `src/js/game.js` para ignorar fantasmas no activos y reiniciar correctamente sus posiciones, estados y temporizadores tras perder una vida. La página debe permitir completar una partida y reiniciarla.

## Acceptance criteria

- [ X ] Al iniciar una partida existen exactamente cuatro fantasmas.
- [ X ] Los fantasmas se dibujan con los cuatro colores definidos actualmente en `src/js/render.js`.
- [ X ] El primer fantasma se mueve desde el inicio de la partida.
- [ X ] El segundo, tercero y cuarto fantasma se liberan aproximadamente a los `2500 ms`, `5000 ms` y `7500 ms`.
- [ X ] Antes de su liberación, cada fantasma pendiente permanece inmóvil dentro del recinto.
- [ X ] Un fantasma pendiente no reduce las vidas de Pac-Man por colisión.
- [ X ] `hunter` selecciona en cada intersección una dirección válida que reduzca la distancia hasta Pac-Man cuando existe una opción.
- [ X ] `ambusher` usa como objetivo cuatro celdas delante de Pac-Man y usa la posición de Pac-Man si el objetivo adelantado no es válido.
- [ X ] `patroller` alterna su objetivo entre las esquinas superior izquierda y superior derecha al alcanzar una esquina.
- [ X ] `random` selecciona una dirección válida aleatoria y solo invierte el sentido en un callejón.
- [ X ] Los cuatro fantasmas pueden atravesar la puerta del recinto desde el comienzo de la partida.
- [ X ] Los fantasmas continúan funcionando correctamente al usar el túnel lateral.
- [ X ] Una colisión con un fantasma activo resta una vida y reinicia las posiciones sin perder el progreso de puntos y puntos restantes.
- [ X ] La partida muestra `GANASTE` cuando se comen todos los puntos y `PERDISTE` cuando se agotan las vidas.
- [ X ] La consola del navegador no muestra errores al iniciar, jugar, perder y reiniciar una partida.

## Decisions

- **Sí:** cuatro conductas explícitas (`hunter`, `ambusher`, `patroller` y `random`) para que la diferencia sea observable durante una partida.
- **Sí:** liberar un fantasma cada `2500 ms`, empezando con uno activo, para introducir dificultad progresiva sin implementar una máquina de estados de niveles.
- **Sí:** medir la liberación con tiempo real transcurrido, porque no debe depender de la velocidad de los frames.
- **Sí:** conservar los cuatro colores existentes y asociarlos al orden de `GHOST_STARTS`, evitando cambios visuales innecesarios.
- **Sí:** permitir el paso por la puerta desde el inicio, porque los ciclos clásicos de salida del recinto no forman parte de esta especificación.
- **No:** implementar modos vulnerables o poderes; requieren reglas de puntuación, estados visuales y colisiones propias.
- **No:** añadir pathfinding global o navegación avanzada; las decisiones se toman en intersecciones usando objetivos válidos y la geometría actual del laberinto.
- **No:** modificar `src/index.html` o el orden de carga de scripts; se conserva la arquitectura global existente.

## Risks

| Risk | Mitigation |
| --- | --- |
| La liberación puede variar por pausas o baja tasa de frames. | Acumular `deltaTime` real y liberar cuando `elapsedMs` alcance cada umbral. |
| El objetivo adelantado o una esquina puede quedar detrás de una pared. | Elegir la mejor dirección válida hacia el objetivo y aplicar fallback a Pac-Man o a la siguiente opción válida. |
| Dos fantasmas pueden compartir la misma celda inicial. | Mantener sus posiciones dentro del recinto y liberar de forma escalonada, evitando colisiones entre fantasmas como regla de esta especificación. |

## What is **not** in this spec

- Modos vulnerable, poderes y puntuación por comer fantasmas.
- Animaciones especiales según la conducta.
- Fases de dificultad o cambios de velocidad por nivel.
- Persistencia, multijugador y cambios del laberinto.
