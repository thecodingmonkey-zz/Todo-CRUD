$(document).ready( function() {
  $("input.checkbox").click( function() {
//    alert('hi');
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
});