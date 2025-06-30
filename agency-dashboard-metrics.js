document.addEventListener('DOMContentLoaded', function() {
  // Configuración
  const UPDATE_INTERVAL = 10 * 60 * 1000; // 10 minutos
  const API_ENDPOINT = '/api/agency-dashboard-metrics';
  const FETCH_TIMEOUT = 15000; // 15 segundos de timeout
  const NOTIFICATION_DURATION = 5000; // 5 segundos para notificaciones
  
  // Referencias a los paneles usando IDs consistentes
  const PANEL_IDS = [
    'agency-today-panel',
    'company-today-panel',
    'agency-month-panel',
    'company-month-panel'
  ];
  
  // Obtener referencias a los paneles
  const PANELS = {};
  let allPanelsExist = true;
  
  PANEL_IDS.forEach(id => {
    const panelElement = document.getElementById(id);
    if (panelElement) {
      PANELS[id] = panelElement;
    } else {
      console.error(`Panel no encontrado: ${id}`);
      allPanelsExist = false;
    }
  });
  
  // Si faltan paneles, no continuar
  if (!allPanelsExist) {
    console.error('No se pueden inicializar las actualizaciones automáticas. Faltan paneles.');
    return;
  }
  
  // Estado de la aplicación
  let updateIntervalId = null;
  let isUpdating = false;
  
  // Función para validar estructura de métricas
  function isValidMetrics(metrics) {
    const requiredKeys = ['agencyToday', 'companyToday', 'agencyMonth', 'companyMonth'];
    if (!requiredKeys.every(key => key in metrics)) {
      return false;
    }
    
    const panelKeys = ['nb_prem', 'nb_pol', 'rn_prem', 'rn_pol', 'rw_prem', 'rw_pol', 'tot_prem', 'tot_pol'];
    return requiredKeys.every(key => {
      const panel = metrics[key];
      return panelKeys.every(k => typeof panel[k] !== 'undefined');
    });
  }

  // Función principal para actualizar métricas
  async function updateMetrics() {
    // Evitar múltiples actualizaciones simultáneas
    if (isUpdating) return;
    isUpdating = true;
    
    try {
      toggleLoadingState(true);
      
      // Configurar timeout para la solicitud
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      const startTime = performance.now();
      const response = await fetch(API_ENDPOINT, {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const metrics = await response.json();
      
      // Validar estructura básica de la respuesta
      if (!isValidMetrics(metrics)) {
        throw new Error('Respuesta de API inválida: Estructura de datos incorrecta');
      }
      
      updateAllPanels(metrics);
      
      // Registrar tiempo de respuesta
      const duration = Math.round(performance.now() - startTime);
      console.log(`Métricas actualizadas en ${duration}ms`);
      
      showNotification('Datos actualizados correctamente', 'success');
    } catch (error) {
      console.error('Error en actualización:', error);
      
      let errorMessage = 'Error al actualizar datos';
      if (error.name === 'AbortError') {
        errorMessage = 'La solicitud tardó demasiado. Intente recargar la página.';
      } else if (error.message.includes('Estructura')) {
        errorMessage = 'Error en el formato de datos recibido';
      }
      
      showNotification(errorMessage, 'danger');
    } finally {
      toggleLoadingState(false);
      isUpdating = false;
    }
  }
  
  // Actualizar todos los paneles
  function updateAllPanels(metrics) {
    PANEL_IDS.forEach(id => {
      const metricKey = id.replace('-panel', '');
      const panel = PANELS[id];
      const data = metrics[metricKey];
      
      if (panel && data) {
        updatePanelMetrics(panel, data);
      }
    });
  }
  
  // Actualizar un panel individual
  function updatePanelMetrics(panel, data) {
    updateMetricElement(panel, 'nb', data.nb_prem, data.nb_pol);
    updateMetricElement(panel, 'rn', data.rn_prem, data.rn_pol);
    updateMetricElement(panel, 'rw', data.rw_prem, data.rw_pol);
    updateMetricElement(panel, 'tot', data.tot_prem, data.tot_pol);
  }
  
  // Actualizar elemento de métrica específica
function updateMetricElement(panel, prefix, prem, pol) {
    try {
      const selector = `.${prefix}-metric`;
      const element = panel.querySelector(selector);
      
      if (element && element.textContent !== `${prem} / ${pol}`) {
        element.textContent = `${prem} / ${pol}`;
      }
    } catch (error) {
      console.error(`Error actualizando métrica ${prefix}:`, error);
    }
  }

  // Estado de carga
  function toggleLoadingState(isLoading) {
    try {
      const cards = document.querySelectorAll('.metric-card');
      if (!cards.length) return;
      
      cards.forEach(card => {
        if (isLoading) {
          card.classList.add('updating');
          card.style.opacity = '0.7';
          card.classList.add('pe-none');
        } else {
          card.classList.remove('updating');
          card.style.opacity = '1';
          card.classList.remove('pe-none');
        }
      });
    } catch (error) {
      console.error('Error en toggleLoadingState:', error);
    }
  }
  
  // Mostrar notificación
  function showNotification(message, type) {
    // Eliminar notificaciones anteriores
    document.querySelectorAll('.auto-update-notification').forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `position-fixed top-0 end-0 mt-3 me-3 alert alert-${type} alert-dismissible fade show auto-update-notification`;
    notification.style.zIndex = '1060';
    notification.innerHTML = `
      <span class="notification-content">${message}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    document.body.appendChild(notification);
    
    // Eliminar automáticamente después de un tiempo
    setTimeout(() => {
      if (notification.isConnected) {
        notification.remove();
      }
    }, NOTIFICATION_DURATION);
  }
  
  // Iniciar el sistema de actualización
  function startAutoUpdate() {
    // Primera actualización inmediata
    updateMetrics().catch(console.error);
    
    // Configurar actualización periódica
    updateIntervalId = setInterval(updateMetrics, UPDATE_INTERVAL);
    
    // Limpiar intervalo si la página se descarga
    window.addEventListener('beforeunload', () => {
      if (updateIntervalId) {
        clearInterval(updateIntervalId);
      }
    });
    
    // Actualizar cuando la pestaña vuelve a estar visible
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        updateMetrics();
      }
    });
  }
  
  // Iniciar todo el sistema
  startAutoUpdate();
});