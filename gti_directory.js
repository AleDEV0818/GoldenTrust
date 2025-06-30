document.addEventListener('DOMContentLoaded', function() {
  const table = $('.dt-row-grouping').DataTable({
    responsive: true,
    columnDefs: [{ targets: 0, responsivePriority: 1 }],
    order: [[0, 'asc']],
    dom: '<"card-header pb-0 pt-sm-0"<"head-label"><"d-flex justify-content-center justify-content-md-end"f>>l t<"row mx-2"<"col-sm-12 col-md-6"i><"col-sm-12 col-md-6"p>>',
    displayLength: 10,
    language: { paginate: { previous: '←', next: '→' } }
  });
});