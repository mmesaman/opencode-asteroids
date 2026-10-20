# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Un OVNI enemigo se cuela en el campo para dispararte. Incluye tres power-ups: **Velocidad** (duplica la velocidad de la nave durante cinco segundos), **Disparo triple** (tres balas paralelas durante cinco segundos) y **Escudo** (absorbe los impactos durante ocho segundos). Además puedes cambiar la apariencia de la nave con `S`.

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
| `S`       | Cambiar skin |

## Puntuación

| Objeto             | Puntos |
| ------------------ | ------ |
| Asteroide grande   | 20     |
| Asteroide mediano  | 50     |
| Asteroide pequeño  | 100    |
| OVNI               | 150    |

## Power-ups

| Power-up       | Efecto                                                                         |
| -------------- | ------------------------------------------------------------------------------ |
| Velocidad      | Duplica la velocidad de la nave durante 5 segundos (rayo cian)                 |
| Disparo triple | Dispara 3 balas paralelas en línea recta durante 5 segundos (icono ámbar)      |
| Escudo         | Absorbe los impactos de proyectiles, asteroides y el OVNI durante 8 segundos (aro verde) |

Los power-ups aparecen al azar cuando destruyes un asteroide o un OVNI. Se recogen acercando la nave antes de que desaparezcan; pueden estar activos a la vez y recoger el mismo power-up reinicia su contador. El HUD muestra el tiempo restante de cada efecto, apilado bajo el marcador.

## Skins

Cuatro apariencias para la nave, se cambian en cualquier momento con `S` (ciclo):

| Skin        | Apariencia                                     |
| ----------- | ---------------------------------------------- |
| Clásica     | Silueta de contorno clásica                   |
| Rellena     | Triángulo sólido estilo arcade                |
| Neón        | Contorno cian con brillo                      |
| Interceptor | Alas angulares y morro alargado               |

La skin elegida se guarda en `localStorage` y se mantiene al recargar la página. La skin activa se refleja en la nave, en los iconos de vidas y en el HUD.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides y el OVNI
- OVNI enemigo que cruza el campo y dispara proyectiles a la nave
- Power-up Escudo: aro verde que anula los impactos mientras dura
- Power-up Disparo triple: 3 balas paralelas por disparo durante 5 segundos
- Power-up Velocidad con indicador de tiempo restante en el HUD
- Efectos activos apilados en el HUD (velocidad, disparo triple y escudo)
- 4 skins de nave seleccionables con `S`, guardadas en `localStorage`
