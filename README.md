# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Hay dos naves disponibles: la clásica y una nave morada el doble de grande que otorga el doble de puntos.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `1` `2`   | Cambiar de nave |

## Naves

Se puede cambiar de nave en cualquier momento, incluso durante la partida. La
nave elegida se mantiene al reiniciar.

| Nave      | Color  | Tamaño | Puntos      |
| --------- | ------ | ------ | ----------- |
| Clásica   | Blanco | 1x     | Normal      |
| Nebulosa  | Morado | 2x     | Doble (x2)  |

La nave **Nebulosa** es el doble de grande que la clásica, por lo que su radio
de colisión también es el doble (golpea y choca más). A cambio, cada asteroide
destruido vale el doble de puntos.

## Puntuación

| Asteroide | Puntos | Nebulosa (x2) |
| --------- | ------ | ------------- |
| Grande    | 20     | 40            |
| Mediano   | 50     | 100           |
| Pequeño   | 100    | 200           |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Dos naves seleccionables con las teclas `1` y `2`
