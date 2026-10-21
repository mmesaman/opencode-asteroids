# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Naves

Antes de jugar se elige la nave en el menú inicial (y también al volver al menú tras un *game over*).

| Nave         | Color  | Tamaño | Puntos |
| ------------ | ------ | ------ | ------ |
| Nave clásica | Blanco | Normal | x1     |
| Nave morada  | Morado | Doble  | x2     |

La nave morada es el doble de grande que la original (también tiene el doble de radio de colisión) y cada asteroide destruido vale el doble de puntos.

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

| Tecla        | Acción                        |
| ------------ | ----------------------------- |
| `←` `→`      | Rotar nave                    |
| `↑`          | Propulsar                     |
| `Espacio`    | Disparar                      |
| `←` `→`      | Elegir nave (en el menú)      |
| `Espacio`    | Empezar / volver al menú      |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

La puntuación se multiplica según la nave elegida: x1 con la nave clásica y x2 con la nave morada.

## Características

- 2 naves seleccionables: la clásica y la morada (doble tamaño, doble puntuación)
- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
