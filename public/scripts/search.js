$('#agencia-search').on('input', function() {
  var search = $(this).serialize();
  if(search === "search=") {
    search = "all"
  }
  $.get('/agencias?' + search, function(data) {
    $('#agencia-grid').html('');
    data.forEach(function(agencia) {
      $('#agencia-grid').append(`
        <div class="col-md-3 col-sm-6">
          <div class="thumbnail">
            <img src="${ agencia.image }">
            <div class="caption">
              <h4>${ agencia.name }</h4>
            </div>
            <p>
              <a href="/agencias/${ agencia._id }" class="btn btn-primary">More Info</a>
            </p>
          </div>
        </div>
      `);
    });
  });
});

$('#agencia-search').submit(function(event) {
  event.preventDefault();
});