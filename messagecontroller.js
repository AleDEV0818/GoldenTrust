import fs from 'fs';
import path from 'path';

// Obtener __dirname en ES Modules
const __dirname = path.resolve();

export const renderMessageCenter = (req, res) => {
  try {
    console.log('[MessageController] Renderizando centro de mensajes');
    const data = { 
      user: req.user,
      videoPath: '/users/message-center/upholding-gti-standards'
    };
    res.render('message-center', data);
  } catch (error) {
    console.error('Error al renderizar message-center:', error);
    res.status(500).render('error', { 
      message: 'Error interno del servidor',
      error
    });
  }
};

export const downloadVideo = (req, res) => {
  try {
    console.log('[MessageController] Solicitud de descarga de video recibida');
    
    // 1. Definir ruta ABSOLUTA del video (misma ruta que en streamVideo)
    const videoPath = 'D:\\Trabajo\\Programacion\\GOLDENTRUST\\intranet2\\intranet2\\assets\\videos\\message1.mp4';
    
    // 2. Verificar existencia del archivo
    if (!fs.existsSync(videoPath)) {
      console.error(`[MessageController] ERROR: Video no encontrado en ${videoPath}`);
      return res.status(404).send('Video no encontrado');
    }

    // 3. Obtener nombre del archivo para la descarga
    const filename = path.basename(videoPath);
    
    // 4. Configurar headers para forzar descarga
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');

    // 5. Crear stream y manejar errores
    const videoStream = fs.createReadStream(videoPath);
    
    videoStream.on('error', (error) => {
      console.error('[MessageController] Error en descarga de video:', error);
      if (!res.headersSent) {
        res.status(500).send('Error en el servidor');
      }
    });

    // 6. Enviar el archivo
    videoStream.pipe(res);
    console.log('[MessageController] Descarga iniciada correctamente');

  } catch (error) {
    console.error('[MessageController] ERROR en descarga de video:', error);
    if (!res.headersSent) {
      res.status(500).send('Error interno del servidor');
    }
  }
};

export const streamVideo = (req, res) => {
  try {
    console.log('[MessageController] Iniciando solicitud de video');
    
    // 1. Definir ruta ABSOLUTA del video (usa tu ruta específica)
    const videoPath = 'D:\\Trabajo\\Programacion\\GOLDENTRUST\\intranet2\\intranet2\\assets\\videos\\message1.mp4';
    
    // 2. Verificar existencia del archivo
    console.log(`[MessageController] Buscando video en: ${videoPath}`);
    if (!fs.existsSync(videoPath)) {
      console.error(`[MessageController] ERROR: Video no encontrado en ${videoPath}`);
      return res.status(404).send('Video no encontrado');
    }
    console.log('[MessageController] Video encontrado');

    // 3. Obtener estadísticas del video
    const videoStats = fs.statSync(videoPath);
    const videoSize = videoStats.size;
    console.log(`[MessageController] Tamaño del video: ${videoSize} bytes`);

    // 4. Manejar solicitudes sin cabecera Range
    if (!req.headers.range) {
      console.log('[MessageController] Enviando video completo (sin Range)');
      const headers = {
        "Content-Length": videoSize,
        "Content-Type": "video/mp4"
      };
      res.writeHead(200, headers);
      return fs.createReadStream(videoPath).pipe(res);
    }

    // 5. Parsear cabecera Range
    const range = req.headers.range;
    console.log(`[MessageController] Cabecera Range: ${range}`);
    
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    const contentLength = end - start + 1;
    
    console.log(`[MessageController] Enviando chunk: bytes ${start}-${end}/${videoSize}`);

    // 6. Configurar headers
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": contentLength,
      "Content-Type": "video/mp4"
    };

    // 7. Enviar respuesta parcial
    res.writeHead(206, headers);
    
    // 8. Crear stream de video
    const videoStream = fs.createReadStream(videoPath, { 
      start, 
      end 
    });
    
    // 9. Manejar errores del stream
    videoStream.on('error', (error) => {
      console.error('[MessageController] Error en stream de video:', error);
      if (!res.headersSent) {
        res.status(500).send('Error en el servidor');
      }
    });
    


    // 10. Pipe al response
    videoStream.pipe(res);
    
    console.log('[MessageController] Streaming iniciado correctamente');
    
  } catch (error) {
    console.error('[MessageController] ERROR en streaming de video:', error);
    if (!res.headersSent) {
      res.status(500).send('Error interno del servidor');
    }
  }
};