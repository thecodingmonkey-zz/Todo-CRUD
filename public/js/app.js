$(document).ready( function() {
  $("#description").hide();


  $("input.checkbox").click( function() {
    var $this = $(this);
    var num = $this[0].value;

    if ($this.is(':checked')) {
      $.ajax(
        "/check/" + num,
        {
          type: 'PUT'
        });
    }
    else {
      $.ajax(
        "/uncheck/" + num,
        {
          type: 'PUT'
        });
    }
  });

  $("#item").on("keyup", function() {
    console.log('hai');
    if ($("#item")[0].value.length > 0) {
      $("#description").show();
    }
    else {
      $("#description").hide();
    }
  });

});