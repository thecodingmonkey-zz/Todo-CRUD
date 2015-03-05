$(document).ready( function() {
  $("#description").hide();


  $("input.checkbox").click( function() {
    var $this = $(this);
    var num = $this[0].value;
    var unchecked_count = parseInt( $("#unchecked_count").html() );

//    alert(unchecked_count);


    if ($this.is(':checked')) {
      $.ajax(
        "/check/" + num,
        {
          type: 'PUT'
        });

      unchecked_count--;
    }
    else {
      $.ajax(
        "/uncheck/" + num,
        {
          type: 'PUT'
        });
      unchecked_count++;
    }

    $("#unchecked_count").html(unchecked_count.toString() );
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