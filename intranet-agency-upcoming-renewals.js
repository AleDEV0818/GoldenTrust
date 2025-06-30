"use strict";

// --------- UTILIDADES ---------
function getInitials(nombre) {
  if (!nombre) return '--';
  const parts = nombre.trim().split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value || 0);
}

const avatarColors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFBE0B", "#FB5607",
  "#8338EC", "#3A86FF", "#FF006E", "#6A994E", "#A7C957"
];

function stringToNiceColor(str) {
  if (!str) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) 
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatDate(fechaStr) {
  if (!fechaStr) return "";
  if (fechaStr.includes("T")) return fechaStr.split("T")[0];
  return fechaStr;
}

$(function () {
  // --------- ESTILOS MEJORADOS ---------
  if (!document.getElementById('custom-renewal-css')) {
    const style = document.createElement('style');
    style.id = 'custom-renewal-css';
    style.textContent = `
      /* CONTENEDOR FLEXIBLE ESTABLE */
      .customer-cell-container {
        display: flex;
        align-items: center;
        position: relative;
        min-height: 60px;
      }
      
      /* AVATAR - TAMAÑO FIJO */
      .custom-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        font-size: 14px;
        text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        flex-shrink: 0;
        margin-right: 12px;
      }
      
      /* BOTÓN DE DETALLES - POSICIÓN ABSOLUTA */
      .dt-details-btn {
        position: absolute;
        left: 42px;
        top: 50%;
        transform: translateY(-50%);
        background: var(--bs-card-bg);
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        z-index: 2;
        border: none;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .dt-details-btn i {
        font-size: 16px;
        color: var(--bs-secondary-color);
      }
      
      .dt-details-btn:hover {
        background: rgba(59, 125, 221, 0.1);
      }
      
      .dt-details-btn:hover i {
        color: var(--bs-primary);
      }
      
      /* CONTENEDOR DE TEXTO FLEXIBLE */
      .customer-text-container {
        flex-grow: 1;
        margin-left: 28px;
        padding: 4px 0;
      }
      
      /* SELECTOR DE ELEMENTOS POR PÁGINA - ESTILO PERSONALIZADO */
      .dataTables_length select {
        height: 38px;
        padding: 6px 12px;
        font-size: 16px;
        border-radius: 4px;
        border: 1px solid var(--bs-border-color) !important;
        background-color: var(--bs-body-bg) !important;
        color: var(--bs-body-color) !important;
        margin: 0 5px;
        min-width: 80px;
        cursor: pointer;
        transition: all 0.2s;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23676a7d' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
        background-size: 16px 12px;
      }
      
      .dataTables_length select:focus {
        border-color: var(--bs-primary) !important;
        box-shadow: 0 0 0 2px rgba(var(--bs-primary-rgb), 0.25);
        outline: none;
      }
      
      .dataTables_length select option {
        background-color: var(--bs-body-bg);
        color: var(--bs-body-color);
      }
      
      .dataTables_length label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        color: var(--bs-body-color);
        margin-bottom: 0;
      }
      
      /* MODAL */
      #customerDetailsModal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        align-items: center;
        justify-content: center;
      }
      
      #customerDetailsModal .modal-content {
        width: 90%;
        max-width: 800px;
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 10px;
        position: relative;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        background-color: var(--bs-modal-bg);
        color: var(--bs-body-color);
        border: var(--bs-modal-border-width) solid var(--bs-modal-border-color);
        padding: 25px;
      }
      
      .modal-large-content {
        position: relative;
      }
      
      .customer-avatar-modal {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        color: white;
        font-weight: bold;
        margin-right: 15px;
        font-size: 22px;
        text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .detail-item {
        margin-bottom: 12px;
        padding: 8px 0;
        border-bottom: 1px solid var(--bs-border-color);
      }
      
      .detail-item label {
        font-weight: bold;
        min-width: 160px;
        display: inline-block;
        color: var(--bs-heading-color);
      }
      
      .detail-item span {
        color: var(--bs-body-color);
      }
      
      .contact-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 4px;
      }
      
      .contact-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 13px;
      }
      
      .contact-item i {
        font-size: 14px;
        width: 16px;
        text-align: center;
      }
      
      .modal-footer-button {
        margin-top: 20px;
        text-align: center;
      }
      
      .close-modal-bottom {
        background-color: var(--bs-modal-bg);
        border: 1px solid var(--bs-border-color);
        color: var(--bs-body-color);
        padding: 8px 18px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }
      
      .close-modal-bottom:hover {
        background-color: var(--bs-border-color);
      }
      
      /* PAGINACIÓN */
      .dataTables_wrapper .dataTables_info {
        color: var(--bs-secondary-color);
        padding-top: 0.5rem;
      }
      
      .dataTables_wrapper .dataTables_paginate {
        padding-top: 0.5rem;
      }
      
      .dataTables_wrapper .dataTables_paginate .paginate_button {
        color: var(--bs-link-color) !important;
        background: transparent !important;
        border: none !important;
        padding: 0.3rem 0.6rem !important;
        margin: 0 0.15rem !important;
        border-radius: 4px;
      }
      
      .dataTables_wrapper .dataTables_paginate .paginate_button.current,
      .dataTables_wrapper .dataTables_paginate .paginate_button.current:hover {
        color: white !important;
        background: var(--bs-primary) !important;
        border: none !important;
      }
      
      .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
        background: rgba(var(--bs-primary-rgb), 0.1) !important;
        color: var(--bs-link-hover-color) !important;
      }
      
      .dataTables_wrapper .dataTables_paginate .paginate_button.disabled,
      .dataTables_wrapper .dataTables_paginate .paginate_button.disabled:hover {
        color: var(--bs-secondary-color) !important;
        background: transparent !important;
      }
      
      .dataTables_wrapper .dataTables_paginate .paginate_button.previous,
      .dataTables_wrapper .dataTables_paginate .paginate_button.next {
        font-weight: 500;
      }
      
      .dataTables_wrapper .dataTables_paginate .ellipsis {
        padding: 0 4px;
        color: var(--bs-secondary-color);
      }
    `;
    document.head.appendChild(style);
  }

  // --------- DATATABLE ---------
  let dt_user;
  
  function renderCustomerCell(data, type, full, meta) {
    const name = full["customer"] || "";
    const phone = full["phone"] || "";
    const email = full["customer_email"] || "";
    const initials = getInitials(name);
    const bgColor = stringToNiceColor(name);

    const detailsBtn = `
      <button type="button" class="dt-details-btn" aria-label="Ver detalles" 
        data-customer='${JSON.stringify(full)}'>
        <i class="ti ti-eye"></i>
      </button>
    `;

    return `
      <div class="customer-cell-container">
        <span class="custom-avatar" style="background:${bgColor};">${initials}</span>
        ${detailsBtn}
        <div class="customer-text-container">
          <span class="fw-medium d-block">${name}</span>
          <div class="contact-info">
            ${phone ? `
              <div class="contact-item">
                <i class="ti ti-phone"></i>
                <a href="tel:${phone}" style="color:var(--bs-primary);">${phone}</a>
              </div>
            ` : ''}
            ${email ? `
              <div class="contact-item">
                <i class="ti ti-mail"></i>
                <a href="mailto:${email}" style="color:var(--bs-primary);">${email}</a>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function renderTable(renewals) {
    const table = $('.datatables-upcoming-renewals');
    
    if ($.fn.DataTable.isDataTable(table)) {
      dt_user.destroy();
      table.find('tbody').empty();
    }

    dt_user = table.DataTable({
      data: renewals,
      columns: [
        { 
          data: "customer",
          className: "align-middle",
          responsivePriority: 1,
          render: renderCustomerCell
        },
        { data: "policy_number", className: "align-middle" },
        { data: "carrier", className: "align-middle" },
        { data: "line", className: "align-middle" },
        { 
          data: "premium",
          className: "align-middle",
          render: data => formatCurrency(data)
        },
        {
          data: "exp_date",
          className: "align-middle",
          render: formatDate
        },
        { data: "csr", className: "align-middle" },
        { 
          data: "renewed",
          className: "text-center align-middle",
          render: function (data) {
            if (data === true) return '<span class="badge bg-success">Renewed</span>';
            if (data === false) return '<span class="badge bg-danger">-</span>';
            return "";
          }
        }
      ],
      order: [[5, "asc"]],
      dom: '<"d-flex justify-content-between align-items-center mb-3"lfB>t<"d-flex justify-content-between align-items-center"ip>',
      buttons: [
        {
          extend: 'collection',
          text: '<i class="ti ti-download me-2"></i> Export',
          className: 'btn btn-label-secondary dropdown-toggle ms-3',
          buttons: [
            { extend: 'copy', text: '<i class="ti ti-copy me-2"></i>Copy', className: 'dropdown-item' },
            { extend: 'csv', text: '<i class="ti ti-file-spreadsheet me-2"></i>CSV', className: 'dropdown-item' },
            { extend: 'pdf', text: '<i class="ti ti-file-code-2 me-2"></i>PDF', className: 'dropdown-item' },
            { extend: 'print', text: '<i class="ti ti-printer me-2"></i>Print', className: 'dropdown-item' }
          ]
        }
      ],
      language: {
        sLengthMenu: "_MENU_",
        search: "",
        searchPlaceholder: "Search..",
        paginate: {
          previous: '<i class="ti ti-chevron-left"></i>',
          next: '<i class="ti ti-chevron-right"></i>',
          first: '<i class="ti ti-chevrons-left"></i>',
          last: '<i class="ti ti-chevrons-right"></i>'
        },
        info: "Showing _START_ to _END_ of _TOTAL_ entries"
      },
      lengthMenu: [10, 25, 50, 100],
      initComplete: function() {
        $('.dataTables_length select').addClass('form-select');
      },
      responsive: true
    });
  }

  // --------- MODAL MEJORADO ---------
  $(document).on('click', '.dt-details-btn', function (e) {
    e.stopPropagation();
    const data = $(this).data('customer');
    const initials = getInitials(data.customer);
    const bgColor = stringToNiceColor(data.customer);
    
    const isRenewed = data.renewed === true 
      ? '<span class="badge bg-success">Renewed</span>' 
      : data.renewed === false 
        ? '<span class="badge bg-danger">-</span>' 
        : '';
    
    const avatarHtml = `<span class="customer-avatar-modal" style="background:${bgColor}">${initials}</span>`;
    
    $('#customerDetailsBody').html(`
      <div class="modal-large-content">
        <h4 class="text-center mb-4">${data.customer || 'N/A'}</h4>
        
        <div class="d-flex align-items-center mb-4">
          ${avatarHtml}
          <div>
            <h5 class="mb-1">Customer Information</h5>
            ${data.phone ? `
            <div class="contact-item mb-1">
              <i class="ti ti-phone me-2"></i>
              <a href="tel:${data.phone}">${data.phone}</a>
            </div>` : ''}
            ${data.customer_email ? `
            <div class="contact-item">
              <i class="ti ti-mail me-2"></i>
              <a href="mailto:${data.customer_email}">${data.customer_email}</a>
            </div>` : ''}
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-6">
            <div class="detail-item">
              <label>Policy Number:</label>
              <span>${data.policy_number || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Carrier:</label>
              <span>${data.carrier || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>Line of business:</label>
              <span>${data.line || 'N/A'}</span>
            </div>
          </div>
          <div class="col-md-6">
            <div class="detail-item">
              <label>Premium:</label>
              <span>${formatCurrency(data.premium)}</span>
            </div>
            <div class="detail-item">
              <label>Exp date:</label>
              <span>${formatDate(data.exp_date) || 'N/A'}</span>
            </div>
            <div class="detail-item">
              <label>CSR:</label>
              <span>${data.csr || 'N/A'}</span>
            </div>
          </div>
        </div>
        
        <div class="detail-item mt-3">
          <label>Status:</label>
          <span>${isRenewed}</span>
        </div>
        
        <div class="modal-footer-button">
          <button class="close-modal-bottom">Close</button>
        </div>
      </div>
    `);

    // Manejo de tema claro/oscuro
    const theme = typeof window.isDarkStyle !== "undefined" && window.isDarkStyle ? "dark" : "light";
    const modalBgColor = theme === "dark" 
      ? (window.config?.colors_dark?.cardBg || "#181C2A") 
      : (window.config?.colors?.cardBg || "#fff");
      
    const modalTextColor = theme === "dark" 
      ? (window.config?.colors_dark?.headingColor || "#fff") 
      : (window.config?.colors?.headingColor || "#222");
    
    $("#customerDetailsModal .modal-content").css({
      "background": modalBgColor,
      "color": modalTextColor
    });

    // Mostrar modal centrado
    $('#customerDetailsModal').css('display', 'flex').hide().fadeIn(150);
  });

  // Manejar cierre del modal
  $(document).on('click', '#customerDetailsModal, .close-modal-bottom', function(e){
    if(e.target === this || $(e.target).hasClass('close-modal-bottom')) {
      $('#customerDetailsModal').fadeOut(220);
    }
  });

  // Cerrar modal con tecla ESC
  $(document).on('keydown', function(e) {
    if (e.key === "Escape" && $('#customerDetailsModal').is(':visible')) {
      $('#customerDetailsModal').fadeOut(220);
    }
  });

  // --------- FETCH Y RENDER ---------
  const next3months = document.getElementById("next3months");

  function fetchAndRender() {
    const data = { month: next3months.value || 0 };
    
    fetch("/users/renewals/agency-upcoming-renewals/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include"
    })
    .then(response => {
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return response.json();
    })
    .then(data => {
      console.log("Datos recibidos del backend:", data);
      renderKpis(data);
      renderTable(data.upcomingRenewals || []);
    })
    .catch(error => {
      console.error("Error fetching data:", error);
      alert("Error loading data: " + error.message);
    });
  }

  function renderKpis(data) {
    console.log("Renderizando KPIs con datos:", data);
    
    const ur = data.ur || { premium: 0, policies: 0 };
    const pr = data.pr || { premium: 0, policies: 0 };
    const pl = data.pl || { premium: 0, policies: 0 };
    const per = data.per || { percentren: 0, percenttkg: 0 };
    
    updateElementContent("premium-policies", `${formatCurrency(ur.premium)} / ${ur.policies}`);
    updateElementContent("renewed-premium-policies", `${formatCurrency(pr.premium)} / ${pr.policies}`);
    updateElementContent("lost-premium-policies", `${formatCurrency(pl.premium)} / ${pl.policies}`);
    updateElementContent("renewed-max-percent", `${per.percentren}% / ${per.percenttkg}%`);
  }

  function updateElementContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = content;
    }
  }

  // Inicialización
  if (next3months) {
    fetchAndRender();
    next3months.addEventListener("change", fetchAndRender);
  }
});