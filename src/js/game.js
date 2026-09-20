// game.js
// Estado y reglas. Depende de globals de maze.js: MAZE, TUNNEL_ROW,
// PACMAN_START, GHOST_STARTS.

const DIRS = {
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
};
const OPPOSITE = { left: 'right', right: 'left', up: 'down', down: 'up' };

const PACMAN_SPEED = 0.125; // 1/8 celda/frame -> alinea cada 8 frames
const GHOST_SPEED = 0.1;    // 1/10 celda/frame
const POWER_PELLET = 4;
const POWER_PELLET_SCORE = 50;
const FRIGHTENED_DURATION_MS = 5000;
const FRIGHTENED_GHOST_SCORE = [ 200, 400, 800, 1600 ];

// Crea una partida nueva. Copia MAZE (pristino) a game.grid para poder comer
// dots sin destruir el original, y reiniciar.
function createGame() {
  const grid = MAZE.map( ( row ) => row.slice() );
  // La celda de inicio de Pacman arranca sin dot.
  grid[ PACMAN_START.y ][ PACMAN_START.x ] = 0;

  let dots = 0;
  let powerPellets = 0;
  for ( const row of grid ) {
    for ( const v of row ) {
      if ( v === 2 ) dots++;
      if ( v === POWER_PELLET ) powerPellets++;
    }
  }

  return {
    state: 'start',
    score: 0,
    lives: 3,
    dotsRemaining: dots,
    powerPelletsRemaining: powerPellets,
    frightenedUntilMs: 0,
    frightenedGhostsEaten: 0,
    elapsedMs: 0,
    grid,
    pacman: {
      x: PACMAN_START.x,
      y: PACMAN_START.y,
      dir: 'left',
      nextDir: null,
      speed: PACMAN_SPEED,
    },
    ghosts: GHOST_STARTS.map( ( g ) => ( {
      x: g.x,
      y: g.y,
      dir: 'up',
      speed: GHOST_SPEED,
      kind: g.kind,
      releaseAt: g.releaseAt,
      active: g.releaseAt === 0,
      phase: 'exiting',
      patrolTarget: 'top-left',
    } ) ),
  };
}

function releaseGhosts( game ) {
  for ( const g of game.ghosts ) {
    if ( !g.active && game.elapsedMs >= g.releaseAt ) g.active = true;
  }
}

function aligned( v ) {
  return Math.abs( v - Math.round( v ) ) < 1e-3;
}

// Una celda es muro para el actor dado?
//   pacman: bloqueado por pared (1) y puerta (3)
//   ghost:  bloqueado solo por pared (1)
function isWall( grid, x, y, actor ) {
  if ( y < 0 || y >= grid.length ) return true;
  if ( x < 0 || x >= grid[ 0 ].length ) return true;
  const v = grid[ y ][ x ];
  if ( v === 1 ) return true;
  if ( v === 3 && actor === 'pacman' ) return true;
  return false;
}

// Puede el actor avanzar desde (x,y) en la direccion dir?
function canMove( grid, x, y, dir, actor ) {
  const d = DIRS[ dir ];
  if ( !d ) return false;
  const tx = x + d.x;
  const ty = y + d.y;
  // Tunel: salir por un borde en la fila del tunel siempre es valido.
  if ( ty === TUNNEL_ROW && ( tx < 0 || tx >= grid[ 0 ].length ) ) return true;
  return !isWall( grid, tx, ty, actor );
}

function wrapTunnel( a, width ) {
  if ( Math.round( a.y ) === TUNNEL_ROW ) {
    if ( a.x < 0 ) a.x += width;
    else if ( a.x >= width ) a.x -= width;
  }
}

function movePacman( game ) {
  const p = game.pacman;
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( p.x ) && aligned( p.y ) ) {
    p.x = Math.round( p.x );
    p.y = Math.round( p.y );

    // Aplicar giro pendiente si es posible.
    if ( p.nextDir && canMove( grid, p.x, p.y, p.nextDir, 'pacman' ) ) {
      p.dir = p.nextDir;
      p.nextDir = null;
    }
    // Comer dot.
    if ( grid[ p.y ][ p.x ] === 2 ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += 10;
      game.dotsRemaining--;
    }
    if ( grid[ p.y ][ p.x ] === POWER_PELLET ) {
      grid[ p.y ][ p.x ] = 0;
      game.score += POWER_PELLET_SCORE;
      game.powerPelletsRemaining--;
      if ( game.frightenedUntilMs <= game.elapsedMs ) game.frightenedGhostsEaten = 0;
      game.frightenedUntilMs = game.elapsedMs + FRIGHTENED_DURATION_MS;
    }
    // Si no puede seguir, se detiene en la celda.
    if ( !canMove( grid, p.x, p.y, p.dir, 'pacman' ) ) return;
  }

  const d = DIRS[ p.dir ];
  p.x += d.x * p.speed;
  p.y += d.y * p.speed;
  wrapTunnel( p, width );
}

const PATROL_CORNERS = {
  'top-left': { x: 1, y: 1 },
  'top-right': { x: 26, y: 1 },
};

function validTarget( grid, target ) {
  return target.x >= 0 && target.x < grid[ 0 ].length &&
    target.y >= 0 && target.y < grid.length &&
    !isWall( grid, target.x, target.y, 'ghost' );
}

function chooseDirectionToward( grid, g, choices, target ) {
  let best = choices[ 0 ];
  let bestDist = Infinity;
  for ( const dir of choices ) {
    const d = DIRS[ dir ];
    const nx = g.x + d.x;
    const ny = g.y + d.y;
    const dist = Math.abs( nx - target.x ) + Math.abs( ny - target.y );
    if ( dist < bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

function chooseDirectionAway( grid, g, choices, target ) {
  let best = choices[ 0 ];
  let bestDist = -Infinity;
  for ( const dir of choices ) {
    const d = DIRS[ dir ];
    const nx = g.x + d.x;
    const ny = g.y + d.y;
    const dist = Math.abs( nx - target.x ) + Math.abs( ny - target.y );
    if ( dist > bestDist ) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

function decideGhost( game, g ) {
  const grid = game.grid;
  const p = game.pacman;

  const options = Object.keys( DIRS ).filter(
    ( dir ) => dir !== OPPOSITE[ g.dir ] && canMove( grid, g.x, g.y, dir, 'ghost' )
  );
  // Sin salida (callejon): permitir el giro de 180.
  const choices = options.length ? options : [ '' + OPPOSITE[ g.dir ] ];

  if ( game.frightenedUntilMs > game.elapsedMs ) {
    g.dir = chooseDirectionAway( grid, g, choices, {
      x: Math.round( p.x ),
      y: Math.round( p.y ),
    } );
    return;
  }

  if ( g.kind === 'random' ) {
    g.dir = choices[ Math.floor( Math.random() * choices.length ) ];
    return;
  }

  let target = { x: Math.round( p.x ), y: Math.round( p.y ) };
  if ( g.kind === 'ambusher' ) {
    const d = DIRS[ p.dir ];
    const ahead = {
      x: target.x + d.x * 4,
      y: target.y + d.y * 4,
    };
    if ( validTarget( grid, ahead ) ) target = ahead;
  } else if ( g.kind === 'patroller' ) {
    const corner = PATROL_CORNERS[ g.patrolTarget ];
    if ( g.x === corner.x && g.y === corner.y ) {
      g.patrolTarget = g.patrolTarget === 'top-left' ? 'top-right' : 'top-left';
      target = PATROL_CORNERS[ g.patrolTarget ];
    } else {
      target = corner;
    }
  }

  g.dir = chooseDirectionToward( grid, g, choices, target );
}

function moveGhost( game, g ) {
  const grid = game.grid;
  const width = grid[ 0 ].length;

  if ( aligned( g.x ) && aligned( g.y ) ) {
    g.x = Math.round( g.x );
    g.y = Math.round( g.y );

    if ( g.phase === 'exiting' ) {
      if ( g.y === 11 ) {
        g.phase = 'roaming';
        return;
      }
      g.dir = 'up';

      const nextCell = {
        x: g.x + DIRS.up.x,
        y: g.y + DIRS.up.y,
      };
      const blockedByGhost = game.ghosts.some( ( other ) =>
        other !== g && Math.abs( other.x - nextCell.x ) < 0.5 &&
        Math.abs( other.y - nextCell.y ) < 0.5
      );
      if ( blockedByGhost ) return;
    } else {
      decideGhost( game, g );
    }

    if ( !canMove( grid, g.x, g.y, g.dir, 'ghost' ) ) return;
  }

  const d = DIRS[ g.dir ];
  g.x += d.x * g.speed;
  g.y += d.y * g.speed;
  wrapTunnel( g, width );
}

function resetPositions( game ) {
  const p = game.pacman;
  game.elapsedMs = 0;
  game.frightenedUntilMs = 0;
  game.frightenedGhostsEaten = 0;
  p.x = PACMAN_START.x;
  p.y = PACMAN_START.y;
  p.dir = 'left';
  p.nextDir = null;
  game.ghosts.forEach( ( g, i ) => {
    g.x = GHOST_STARTS[ i ].x;
    g.y = GHOST_STARTS[ i ].y;
    g.dir = 'up';
    g.active = g.releaseAt === 0;
    g.phase = 'exiting';
    g.patrolTarget = 'top-left';
  } );
}

function updateFrightenedState( game ) {
  if ( game.frightenedUntilMs === 0 || game.elapsedMs < game.frightenedUntilMs ) return;
  game.frightenedUntilMs = 0;
  game.frightenedGhostsEaten = 0;
  game.ghosts.forEach( ( g ) => {
    if ( g.active ) g.phase = 'roaming';
  } );
}

function eatGhost( game, g, ghostIndex ) {
  const scoreIndex = Math.min( game.frightenedGhostsEaten, FRIGHTENED_GHOST_SCORE.length - 1 );
  game.score += FRIGHTENED_GHOST_SCORE[ scoreIndex ];
  game.frightenedGhostsEaten++;
  g.x = GHOST_STARTS[ ghostIndex ].x;
  g.y = GHOST_STARTS[ ghostIndex ].y;
  g.dir = 'up';
  g.active = true;
  g.phase = 'exiting';
}

function collides( a, b ) {
  return Math.abs( a.x - b.x ) < 0.5 && Math.abs( a.y - b.y ) < 0.5;
}

function update( game, deltaMs ) {
  game.elapsedMs += deltaMs;
  updateFrightenedState( game );
  releaseGhosts( game );
  movePacman( game );
  game.ghosts.forEach( ( g ) => {
    if ( g.active ) moveGhost( game, g );
  } );

  for ( let i = 0; i < game.ghosts.length; i++ ) {
    const g = game.ghosts[ i ];
    if ( !g.active ) continue;
    if ( collides( game.pacman, g ) ) {
      if ( game.frightenedUntilMs > game.elapsedMs ) {
        eatGhost( game, g, i );
        continue;
      }
      game.lives--;
      if ( game.lives <= 0 ) {
        game.state = 'lost';
        return;
      }
      resetPositions( game );
      break;
    }
  }

  if ( game.dotsRemaining <= 0 && game.powerPelletsRemaining <= 0 ) game.state = 'won';
}

window.createGame = createGame;
window.update = update;
window.DIRS = DIRS;
