$(function () {
  'use strict';

  $('.thumbnail').hover(
    function () {
      $(this).find('.caption .description').slideDown(250);
    },
    function () {
      $(this).find('.caption .description').slideUp(250);
    }
  );
});
