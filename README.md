# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Antes de empezar eliges una de las dos naves disponibles, cada una con su propio tamaño y su propio multiplicador de puntos.

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

En el menú de inicio: `←` `→` para elegir nave, `1` `2` para selección rápida y `Espacio` para empezar. Desde el *game over*, `M` vuelve al menú.

## Naves

| Nave       | Color  | Tamaño | Puntos |
| ---------- | ------ | ------ | ------ |
| Estándar   | Blanca | x1     | x1     |
| Titán      | Morada | x2     | x2     |

La nave **Titán** es morada y tiene el doble de tamaño que la estándar (mayor radio de colisión y de disparo), pero a cambio entrega el doble de puntos por cada asteroide destruido.

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

Los puntos se multiplican por el multiplicador de la nave activa (x2 con el Titán).

## Características

- Selección de nave en el menú de inicio (2 naves con tamaño y multiplicador de puntos distintos)
- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides

## Triage automático de issues

La GitHub Action `.github/workflows/issue-triage.yml` se dispara cada vez que se
abre un issue y hace tres cosas:

1. **Clasifica** el issue (`bug`, `enhancement`, `documentation` o `question`)
   usando OpenCode; si el modelo no está disponible, cae a reglas por palabras
   clave.
2. **Etiqueta** el issue con su tipo (crea la etiqueta si el repo todavía no la
   tiene).
3. **Agrega un bloque de metadatos al final del cuerpo** con un resumen, el
   comportamiento esperado vs. el real, los pasos para reproducir, los archivos
   probablemente afectados y un checklist para quien revisa.

**El texto original queda intacto**: el bloque se agrega debajo, separado por un
`---` y delimitado por comentarios HTML (`<!-- opencode-triage:start -->`).
Si el issue ya tiene ese bloque, se reemplaza en vez de duplicarse.

Para re-triar un issue a mano: **Actions → Issue Triage → Run workflow**, con el
número del issue.
