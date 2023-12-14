moment.locale('sq');
var start1 = moment().subtract(29, 'days');
var end1 = moment();

function cb1(start, end) {
  moment.locale('sq');
  $('#kt_daterangepicker_1').html(start.format('DD, MMMM YYYY') + ' - ' + end.format('DD, MMMM YYYY'));
}
$('#kt_daterangepicker_1').daterangepicker({
  startDate: start1,
  endDate: end1,
  ranges: {
    'Sot': [moment(), moment()],
    'Dje': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Para 7 Dite': [moment().subtract(6, 'days'), moment()],
    'Para 30 Dite': [moment().subtract(29, 'days'), moment()],
    'Këtë muaj': [moment().startOf('month'), moment().endOf('month')],
    'Muajin e kaluar': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }
}, cb1);
cb1(start1, end1);
var start2 = moment().subtract(29, 'days');
var end2 = moment();

function cb2(start, end) {
  moment.locale('sq');
  $('#kt_daterangepicker_2').html(start.format('DD, MMMM YYYY') + ' - ' + end.format('DD, MMMM YYYY'));
}
$('#kt_daterangepicker_2').daterangepicker({
  startDate: start2,
  endDate: end2,
  ranges: {
    'Sot': [moment(), moment()],
    'Dje': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
    'Para 7 Dite': [moment().subtract(6, 'days'), moment()],
    'Para 30 Dite': [moment().subtract(29, 'days'), moment()],
    'Këtë muaj': [moment().startOf('month'), moment().endOf('month')],
    'Muajin e kaluar': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
  }
}, cb2);
cb2(start2, end2);