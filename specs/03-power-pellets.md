# SPEC 03 — Power Pellets y fantasmas vulnerables

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-09-20
> **Objective:** Añadir cuatro Power Pellets que activen durante 5000 ms el modo vulnerable de los fantasmas para que Pac-Man pueda comerlos.

## Scope

**In:**

- Colocar cuatro Power Pellets en las esquinas transitables `(1,1)`, `(26,1)`, `(1,29)` y `(26,29)`, sustituyendo los dots de esas celdas.
- Representar los Power Pellets con el valor de celda `4` en `MAZE` y `game.grid`.
- Dibujar los Power Pellets como elementos grandes y visibles, diferenciados de los dots normales.
- Sumar `50` puntos al recoger un Power Pellet y eliminarlo del laberinto de la partida.
- Activar durante `5000 ms` el modo vulnerable desde el momento de recoger un Power Pellet.
- Reiniciar el temporizador a `5000 ms` cuando Pac-Man recoja otro Power Pellet durante el modo vulnerable.
- Mostrar los fantasmas vulnerables en azul y hacer que huyan de Pac-Man sin cambiar su velocidad.
- Permitir que Pac-Man coma fantasmas vulnerables en fases `exiting` y `roaming`.
- Otorgar `200`, `400`, `800` y `1600` puntos por los fantasmas comidos consecutivamente durante el mismo efecto.
- Recolocar en la jaula a un fantasma comido y hacer que repita su salida en fase `exiting`.
- Hacer que los fantasmas no comidos vuelvan a `roaming` al terminar los `5000 ms`.
- Cancelar el modo vulnerable al perder una vida, conservando la puntuación, los pellets consumidos y el progreso de dots.
- Mantener el comportamiento existente de victoria, derrota, túnel y salida gradual de los fantasmas.

**Out of scope (for future specs):**

- Añadir frutas, bonus de nivel o elementos comestibles distintos de los Power Pellets.
- Implementar animaciones de parpadeo antes de terminar el modo vulnerable.
- Cambiar la velocidad de Pac-Man o de los fantasmas durante el modo vulnerable.
- Implementar vidas extra, niveles adicionales, persistencia o ranking.
- Modificar la geometría del laberinto, la jaula o la puerta central.
- Añadir ciclos clásicos de retorno de ojos a la jaula o rutas alternativas de retorno.
- Modificar el orden de carga de scripts o la arquitectura global existente.

## Data model

Los cambios reutilizan el modelo global existente de `src/js/maze.js` y `src/js/game.js`.

```js
const POWER_PELLET = 4;
const POWER_PELLET_SCORE = 50;
const FRIGHTENED_DURATION_MS = 5000;
const FRIGHTENED_GHOST_SCORE = [ 200, 400, 800, 1600 ];

const POWER_PELLET_POSITIONS = [
  { x: 1, y: 1 },
  { x: 26, y: 1 },
  { x: 1, y: 29 },
  { x: 26, y: 29 },
];

const game = {
  // ...estado existente...
  powerPelletsRemaining: 4,
  frightenedUntilMs: 0,
  frightenedGhostsEaten: 0,
};

const ghost = {
  // ...estado existente...
  phase: 'roaming', // 'exiting' o 'roaming'
};
```

- El valor `4` identifica una celda con Power Pellet y se consume igual que el valor `2` de los dots.
- `frightenedUntilMs` expresa el instante de `game.elapsedMs` en que termina el efecto.
- `powerPelletsRemaining` cuenta los Power Pellets que todavía existen en `game.grid` y participa en la condición de victoria.
- `frightenedGhostsEaten` cuenta los fantasmas comidos durante el efecto actual y determina la puntuación de la siguiente captura.
- La vulnerabilidad es un estado global de la partida, mientras que `phase` conserva el estado de movimiento individual de cada fantasma.
- Un fantasma comido vuelve a la posición inicial correspondiente de `GHOST_STARTS`, cambia a `phase: 'exiting'` y vuelve a `roaming` al completar la salida definida en SPEC 02.
- Las coordenadas usan celdas con origen en la esquina superior izquierda, como el laberinto existente.

## Implementation plan

1. Actualizar `src/js/maze.js` para marcar las cuatro posiciones de `POWER_PELLET_POSITIONS` con el valor `4`, manteniendo intacta la geometría del laberinto y las posiciones existentes de Pac-Man y los fantasmas. La página debe seguir cargando el laberinto.
2. Actualizar la creación de partidas y el recuento de elementos en `src/js/game.js` para conservar los Power Pellets en `game.grid`, excluirlos de `dotsRemaining` y inicializar `frightenedUntilMs` y `frightenedGhostsEaten`. La partida debe seguir comenzando con el marcador y el tablero correctos.
3. Extender el movimiento de Pac-Man en `src/js/game.js` para consumir una celda `4`, sumar `50` puntos, decrementar `powerPelletsRemaining`, activar o reiniciar el temporizador de `5000 ms` y comenzar el contador de fantasmas comidos si el efecto estaba inactivo. La partida debe seguir avanzando después de recoger un pellet.
4. Integrar en `src/js/game.js` la transición del modo vulnerable con `game.elapsedMs`, de forma que los fantasmas no comidos vuelvan a `roaming` al alcanzar `frightenedUntilMs` y el contador de capturas se reinicie al terminar el efecto.
5. Ajustar la decisión de movimiento de los fantasmas en `src/js/game.js` para que durante el efecto elijan direcciones válidas que aumenten la distancia a Pac-Man, respetando paredes, túnel y la salida en fase `exiting`. La lógica normal debe continuar funcionando cuando no haya efecto activo.
6. Actualizar las colisiones en `src/js/game.js` para que una colisión con un fantasma vulnerable otorgue la siguiente puntuación disponible y reinicie su posición, fase y dirección según `GHOST_STARTS`, mientras que una colisión con un fantasma no vulnerable conserve la pérdida de vida existente. La partida debe continuar jugable después de comer un fantasma.
7. Actualizar `src/js/render.js` para dibujar las celdas `4` como Power Pellets y los fantasmas vulnerables en azul, conservando los cuatro colores normales cuando el efecto no esté activo. La representación existente de paredes, puerta, Pac-Man y HUD debe seguir funcionando.

## Acceptance criteria

- [ ] La página carga sin errores en la consola del navegador.
- [ ] El laberinto contiene exactamente cuatro Power Pellets en `(1,1)`, `(26,1)`, `(1,29)` y `(26,29)` al iniciar una partida.
- [ ] Los cuatro Power Pellets se dibujan más grandes o visualmente distintos de los dots normales.
- [ ] Recoger un Power Pellet lo elimina del tablero y suma exactamente `50` puntos.
- [ ] Recoger un Power Pellet activa el modo vulnerable durante exactamente `5000 ms` medidos con `game.elapsedMs`.
- [ ] Recoger otro Power Pellet durante el modo vulnerable reinicia el temporizador a `5000 ms`.
- [ ] Durante el modo vulnerable los fantasmas se dibujan en azul y se alejan de Pac-Man cuando tienen varias direcciones válidas.
- [ ] Los fantasmas conservan la salida por la puerta central cuando están en fase `exiting` y el modo vulnerable está activo.
- [ ] Pac-Man puede comer un fantasma vulnerable tanto en fase `exiting` como en fase `roaming`.
- [ ] El primer fantasma comido durante un efecto suma `200` puntos, el segundo `400`, el tercero `800` y el cuarto `1600`.
- [ ] Un fantasma comido vuelve a su posición inicial, repite la salida de SPEC 02 y no reduce las vidas de Pac-Man.
- [ ] Los fantasmas vulnerables que no son comidos vuelven a `roaming` cuando terminan los `5000 ms`.
- [ ] Una colisión con un fantasma no vulnerable sigue restando una vida y reiniciando las posiciones como antes.
- [ ] Al perder una vida se cancela el modo vulnerable y se reinician sus contadores, pero se conservan la puntuación, los dots consumidos y los Power Pellets consumidos.
- [ ] Comer todos los dots y Power Pellets transitables continúa mostrando `GANASTE`.
- [ ] La partida continúa funcionando correctamente en el túnel lateral y al reiniciarse desde los overlays de victoria o derrota.

## Decisions

- **Sí:** colocar cuatro Power Pellets en las cuatro esquinas transitables, porque son posiciones reconocibles y no requieren cambiar la geometría del laberinto.
- **Sí:** usar el valor de celda `4`, porque separa los Power Pellets de los dots (`2`), las paredes (`1`), el vacío (`0`) y la puerta (`3`).
- **Sí:** dar `50` puntos por Power Pellet, porque debe diferenciarse de los dots de `10` puntos sin introducir una tabla de puntuación adicional.
- **Sí:** mantener el modo vulnerable durante `5000 ms` y reiniciar el temporizador al recoger otro pellet, porque el efecto debe medirse con tiempo real y poder prolongarse durante la partida.
- **Sí:** hacer que los fantasmas huyan y se dibujen azules sin cambiar su velocidad, porque la vulnerabilidad modifica el riesgo y la apariencia sin alterar el ritmo del juego.
- **Sí:** permitir comer fantasmas en `exiting` y `roaming`, porque ambos estados representan fantasmas activos y peligrosos.
- **Sí:** usar la secuencia de puntuación `200`, `400`, `800`, `1600`, porque recompensa capturas consecutivas dentro del mismo efecto.
- **Sí:** devolver un fantasma comido a la jaula y repetir su salida, porque conserva la integración con las reglas de SPEC 02 sin crear rutas alternativas.
- **Sí:** cancelar el efecto al perder una vida y conservar el progreso del tablero, porque perder una vida reinicia posiciones pero no una partida completa.
- **No:** implementar parpadeo o una animación especial al terminar el efecto; requiere cambios visuales y temporales adicionales que no son necesarios para la mecánica principal.
- **No:** cambiar velocidades o añadir niveles; pertenecen a una especificación de dificultad independiente.
- **No:** implementar frutas, vidas extra, persistencia o ranking; no son necesarios para comer fantasmas.

## Risks

| Risk | Mitigation |
| --- | --- |
| El temporizador puede depender de la tasa de refresco del navegador. | Usar `deltaMs` y comparar `frightenedUntilMs` con `game.elapsedMs`, como en la liberación de fantasmas. |
| Un fantasma puede ser capturado mientras está saliendo de la jaula. | Tratar `exiting` como un estado activo y devolverlo explícitamente a su posición inicial tras la captura. |
| El valor `4` puede afectar al recuento de victoria si se cuenta como dot. | Consumirlo por separado y considerar la victoria cuando no queden dots ni Power Pellets. |
| Una colisión puede resolverse dos veces en el mismo frame después de comer un fantasma. | Resolver una sola captura por fantasma y excluirlo de la comprobación de pérdida de vida en ese frame. |
| El modo vulnerable puede quedar activo después de perder una vida. | Restaurar `frightenedUntilMs` y `frightenedGhostsEaten` junto con las posiciones. |

## What is **not** in this spec

- Frutas, bonus de nivel, vidas extra o ranking.
- Animaciones de parpadeo al terminar el modo vulnerable.
- Cambios de velocidad, niveles o dificultad progresiva.
- Rutas alternativas o ciclos clásicos de retorno a la jaula.
- Persistencia, multijugador o cambios en la geometría del laberinto.
