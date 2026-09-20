# SPEC 02 — Salida de los fantasmas de la jaula

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-09-20
> **Objective:** Garantizar que cada fantasma salga gradualmente de la jaula por la puerta central y llegue al mapa antes de ejecutar su conducta normal.

## Scope

**In:**

- Mantener las posiciones iniciales `(13,14)` y `(14,14)` definidas en `src/js/maze.js`.
- Mantener los tiempos de liberación `0`, `2500`, `5000` y `7500 ms` definidos en SPEC 01.
- Añadir un estado explícito `exiting` para los fantasmas que todavía están abandonando la jaula.
- Hacer que un fantasma en estado `exiting` avance hacia arriba por la puerta central del recinto.
- Considerar terminada la salida cuando el fantasma llegue a la fila `11`, en la celda `(13,11)` o `(14,11)`.
- Activar la conducta `hunter`, `ambusher`, `patroller` o `random` únicamente después de terminar la salida.
- Mantener dentro de la jaula a un fantasma que no pueda avanzar porque otro fantasma ocupa la ruta de salida.
- Permitir que un fantasma en estado `exiting` colisione con Pac-Man desde el momento de su liberación.
- Aplicar la misma salida corregida después de perder una vida.
- Corregir únicamente la lógica del juego, sin modificar la representación visual de la jaula o los fantasmas.

**Out of scope (for future specs):**

- Cambiar las coordenadas iniciales o los tiempos de liberación.
- Implementar ciclos clásicos de salida, retorno o entrada en la jaula.
- Crear rutas alternativas cuando la puerta central esté ocupada.
- Añadir animaciones específicas para el estado `exiting`.
- Modificar el laberinto, la apariencia de los fantasmas o el orden de carga de scripts.

## Data model

El cambio reutiliza el modelo global existente de `src/js/maze.js` y `src/js/game.js`.

```js
const ghost = {
  x: 13,
  y: 14,
  dir: 'up',
  speed: GHOST_SPEED,
  kind: 'hunter',
  releaseAt: 0,
  active: true,
  phase: 'exiting',
  patrolTarget: 'top-left',
};
```

- `phase` distingue un fantasma que está saliendo (`exiting`) de uno que ya puede ejecutar su conducta normal (`roaming`).
- `active` continúa indicando que el fantasma participa en movimiento y colisiones desde su liberación.
- La ruta de salida usa la dirección `up` y termina en la fila `11`.
- Las coordenadas usan celdas con origen en la esquina superior izquierda, como el laberinto existente.

## Implementation plan

1. Actualizar la creación y el reinicio de fantasmas en `src/js/game.js` para inicializar y restaurar `phase: 'exiting'`, manteniendo las posiciones y los tiempos de `GHOST_STARTS`. La partida debe seguir iniciándose y reiniciándose.
2. Implementar en `src/js/game.js` la transición de `exiting` a `roaming` al llegar a la fila `11`. Un fantasma en `exiting` debe priorizar siempre la dirección `up` y no debe ejecutar todavía su conducta asignada.
3. Ajustar la salida para que un fantasma espere dentro de la jaula si la siguiente celda de la ruta central está ocupada por otro fantasma. La partida debe continuar siendo jugable mientras los fantasmas esperan.
4. Integrar la salida con el movimiento, la liberación escalonada y las colisiones existentes. Los fantasmas deben ser amenazas desde su liberación, aunque aún estén atravesando la puerta.
5. Verificar manualmente el inicio, la salida de los cuatro fantasmas, la pérdida de vidas, el reinicio de posiciones, el túnel y los estados de victoria y derrota.

## Acceptance criteria

- [ ] La página carga sin errores en la consola del navegador.
- [ ] Los cuatro fantasmas conservan las posiciones iniciales `(13,14)` y `(14,14)`.
- [ ] El primer fantasma comienza su salida en `0 ms`.
- [ ] Los siguientes fantasmas comienzan su salida aproximadamente a los `2500 ms`, `5000 ms` y `7500 ms`.
- [ ] Un fantasma liberado tiene el estado `exiting` mientras permanece dentro de la jaula o atraviesa la puerta.
- [ ] Un fantasma en estado `exiting` avanza hacia arriba por la puerta central y no queda detenido por la lógica de su conducta normal.
- [ ] La salida de un fantasma termina al llegar a la fila `11`.
- [ ] Al terminar la salida, el fantasma cambia a `roaming` y ejecuta su conducta asignada.
- [ ] Un fantasma espera dentro de la jaula si otro fantasma ocupa la siguiente celda de la ruta central.
- [ ] Un fantasma en estado `exiting` puede colisionar con Pac-Man desde el momento de su liberación.
- [ ] Al perder una vida, cada fantasma vuelve a su posición inicial y repite correctamente su salida según su tiempo de liberación.
- [ ] Los fantasmas continúan funcionando correctamente al usar el túnel lateral.
- [ ] La partida sigue mostrando `GANASTE` al comer todos los puntos y `PERDISTE` al agotar las vidas.
- [ ] La representación visual existente no cambia como parte de esta corrección.

## Decisions

- **Sí:** conservar las posiciones `(13,14)` y `(14,14)`, porque el problema está en la lógica que debe conducir a los fantasmas fuera de la jaula.
- **Sí:** añadir el estado `exiting`, porque las conductas normales no deben poder cambiar la dirección de salida antes de llegar al mapa.
- **Sí:** usar la puerta central y la dirección `up`, porque es la única salida definida en el laberinto actual.
- **Sí:** considerar terminada la salida en la fila `11`, porque esas celdas ya pertenecen al mapa transitable fuera de la puerta.
- **Sí:** mantener la liberación escalonada de SPEC 01, porque esta corrección no cambia la dificultad ni el ritmo de aparición.
- **Sí:** permitir colisiones durante la salida, porque el fantasma ya está activo y debe representar una amenaza desde su liberación.
- **Sí:** hacer esperar al fantasma bloqueado, porque esta especificación no introduce rutas alternativas ni atraviesa otros fantasmas.
- **No:** cambiar las coordenadas iniciales o colocar directamente a los fantasmas en el mapa; se perdería la salida gradual solicitada.
- **No:** modificar `src/js/render.js` o `src/css/style.css`; la corrección no requiere cambios visuales.
- **No:** implementar ciclos clásicos de casa de fantasmas; requieren estados y reglas adicionales que pertenecen a otra especificación.

## Risks

| Risk | Mitigation |
| --- | --- |
| Dos fantasmas pueden intentar usar simultáneamente la misma celda de salida. | Comprobar la ocupación de la siguiente celda y hacer esperar al fantasma que está detrás. |
| Una conducta normal puede tomar el control antes de que el fantasma abandone la jaula. | Separar explícitamente los estados `exiting` y `roaming`. |
| El reinicio puede dejar un fantasma en una fase o dirección incorrecta. | Restaurar posición, dirección, fase y activación desde `GHOST_STARTS` al perder una vida. |

## What is **not** in this spec

- Cambiar las posiciones iniciales o los tiempos de liberación.
- Crear rutas alternativas de salida.
- Añadir animaciones específicas para la salida.
- Implementar ciclos clásicos de entrada o salida de la jaula.
- Modificar el aspecto visual de los fantasmas o de la jaula.
