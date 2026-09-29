# Visualizador web del Excel — AyJ Transmisiones

## Archivos
- `index.html`: página pública.
- `styles.css`: diseño responsive.
- `app.js`: navegación, búsqueda, filtros y renderizado.
- `data.js`: copia estructurada de los datos del Excel para visualización.
- `assets/`: imágenes embebidas encontradas en el Excel.
- `ENTREGABLE GRUPAL 2_mejora_evidencias_y_fuentes.xlsx`: archivo Excel original, conservado sin modificaciones.

## Cómo usarlo localmente
1. Mantén todos los archivos y la carpeta `assets` en la misma estructura.
2. Abre `index.html` en un navegador.
3. Para una experiencia local más estable, puedes abrir una terminal en esta carpeta y ejecutar:
   `python -m http.server 8000`
4. Entra a `http://localhost:8000`.

## Cómo actualizar desde otro Excel
La versión entregada contiene los datos actuales ya convertidos a `data.js`. Si el Excel cambia, vuelve a generar `data.js` con el mismo proceso o utiliza una variante con SheetJS para leer el `.xlsx` directamente en el navegador.

## Publicación pública
Puedes subir esta carpeta a cualquier hosting de archivos estáticos, por ejemplo GitHub Pages, Netlify, Vercel o un servidor web institucional. No requiere base de datos ni backend.

## Nota de integridad
La interfaz reorganiza la presentación para facilitar la consulta. El Excel original se incluye intacto y la interfaz no escribe ni modifica ese archivo.
